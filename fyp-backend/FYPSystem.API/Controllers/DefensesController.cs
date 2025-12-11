using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using FYPSystem.API.DTOs;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
public class DefensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DefensesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/defenses
    [HttpGet]
    public async Task<IActionResult> GetDefenses(
        [FromQuery] string? type = null,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var query = _context.Defenses
            .Include(d => d.Group)
            .Include(d => d.Department)
            .Include(d => d.Evaluators)
                .ThenInclude(e => e.Staff)
            .AsQueryable();

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(d => d.Type == type);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(d => d.Status == status);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(d => d.DateTime >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(d => d.DateTime <= toDate.Value);
        }

        var defenses = await query
            .OrderBy(d => d.DateTime)
            .Select(d => MapToDTO(d))
            .ToListAsync();

        return Ok(new DefenseListResponse
        {
            Defenses = defenses,
            TotalCount = defenses.Count
        });
    }

    // GET: api/defenses/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDefense(int id)
    {
        var defense = await _context.Defenses
            .Include(d => d.Group)
            .Include(d => d.Department)
            .Include(d => d.Evaluators)
                .ThenInclude(e => e.Staff)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defense == null)
        {
            return NotFound(new { message = "Defense not found" });
        }

        return Ok(MapToDTO(defense));
    }

    // POST: api/defenses
    [HttpPost]
    public async Task<IActionResult> CreateDefense([FromBody] CreateDefenseRequest request)
    {
        var group = await _context.FYPGroups.FindAsync(request.GroupId);
        if (group == null)
        {
            return BadRequest(new { message = "Group not found" });
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        var userId = userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;

        var defense = new Defense
        {
            GroupId = request.GroupId,
            Type = request.Type,
            DateTime = request.DateTime,
            Venue = request.Venue,
            Notes = request.Notes,
            DepartmentId = group.DepartmentId,
            CreatedById = userId,
            Status = DefenseStatuses.Scheduled,
            CreatedAt = DateTime.UtcNow
        };

        _context.Defenses.Add(defense);
        await _context.SaveChangesAsync();

        // Add evaluators (only for Initial, MidTerm, Final - NOT for Proposal)
        var evaluatorsList = new List<DefenseEvaluator>();

        // Proposal defense doesn't require evaluators - it's reviewed by the committee
        if (defense.Type != DefenseTypes.Proposal)
        {
            if (request.InternalEvaluatorIds?.Any() == true)
            {
                // Validate all evaluators are committee members
                var evaluatorIds = request.InternalEvaluatorIds.ToList();
                if (request.ExternalEvaluatorId.HasValue)
                {
                    evaluatorIds.Add(request.ExternalEvaluatorId.Value);
                }

                var staffMembers = await _context.Staff
                    .Where(s => evaluatorIds.Contains(s.Id))
                    .ToListAsync();

                var nonCommitteeMembers = staffMembers.Where(s => !s.IsCommitteeMember).ToList();
                if (nonCommitteeMembers.Any())
                {
                    return BadRequest(new
                    {
                        message = "The following staff members are not committee members and cannot be assigned as evaluators: " +
                                 string.Join(", ", nonCommitteeMembers.Select(s => s.FullName))
                    });
                }

                foreach (var evalId in request.InternalEvaluatorIds)
                {
                    evaluatorsList.Add(new DefenseEvaluator
                    {
                        DefenseId = defense.Id,
                        StaffId = evalId,
                        IsExternal = false,
                        Role = "Internal",
                        IsNotified = false
                    });
                }
            }

            if (request.ExternalEvaluatorId.HasValue)
            {
                evaluatorsList.Add(new DefenseEvaluator
                {
                    DefenseId = defense.Id,
                    StaffId = request.ExternalEvaluatorId.Value,
                    IsExternal = true,
                    Role = "External",
                    IsNotified = false
                });
            }

            _context.DefenseEvaluators.AddRange(evaluatorsList);
            await _context.SaveChangesAsync();
        }

        // Send notifications to evaluators
        if (request.NotifyParticipants && evaluatorsList.Any())
        {
            await NotifyEvaluators(defense, evaluatorsList);
        }

        // Send notifications if requested
        if (request.NotifyParticipants)
        {
            await SendDefenseNotifications(defense, group);
        }

        var result = await _context.Defenses
            .Include(d => d.Group)
            .Include(d => d.Evaluators)
                .ThenInclude(e => e.Staff)
            .FirstOrDefaultAsync(d => d.Id == defense.Id);

        return CreatedAtAction(nameof(GetDefense), new { id = defense.Id }, MapToDTO(result!));
    }

    // PUT: api/defenses/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDefense(int id, [FromBody] UpdateDefenseRequest request)
    {
        var defense = await _context.Defenses.FindAsync(id);
        if (defense == null)
        {
            return NotFound(new { message = "Defense not found" });
        }

        if (request.GroupId.HasValue) defense.GroupId = request.GroupId.Value;
        if (!string.IsNullOrEmpty(request.Type)) defense.Type = request.Type;
        if (request.DateTime.HasValue) defense.DateTime = request.DateTime.Value;
        if (request.Venue != null) defense.Venue = request.Venue;
        if (request.Notes != null) defense.Notes = request.Notes;
        if (!string.IsNullOrEmpty(request.Status)) defense.Status = request.Status;

        defense.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Defense updated successfully" });
    }

    // PUT: api/defenses/{id}/panel
    [HttpPut("{id}/panel")]
    public async Task<IActionResult> AllocatePanel(int id, [FromBody] AllocatePanelRequest request)
    {
        var defense = await _context.Defenses
            .Include(d => d.Evaluators)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defense == null)
        {
            return NotFound(new { message = "Defense not found" });
        }

        // Proposal defense doesn't require evaluator panel
        if (defense.Type == DefenseTypes.Proposal)
        {
            return BadRequest(new { message = "Proposal defense does not require evaluator assignment. It is reviewed by the committee." });
        }

        // Validate all evaluators are committee members
        var evaluatorIds = request.InternalEvaluatorIds.ToList();
        if (request.ExternalEvaluatorId.HasValue)
        {
            evaluatorIds.Add(request.ExternalEvaluatorId.Value);
        }

        var staffMembers = await _context.Staff
            .Where(s => evaluatorIds.Contains(s.Id))
            .ToListAsync();

        var nonCommitteeMembers = staffMembers.Where(s => !s.IsCommitteeMember).ToList();
        if (nonCommitteeMembers.Any())
        {
            return BadRequest(new
            {
                message = "The following staff members are not committee members and cannot be assigned as evaluators: " +
                         string.Join(", ", nonCommitteeMembers.Select(s => s.FullName))
            });
        }

        // Remove existing evaluators
        _context.DefenseEvaluators.RemoveRange(defense.Evaluators);

        // Add new internal evaluators
        var newEvaluators = new List<DefenseEvaluator>();

        foreach (var evalId in request.InternalEvaluatorIds)
        {
            newEvaluators.Add(new DefenseEvaluator
            {
                DefenseId = defense.Id,
                StaffId = evalId,
                IsExternal = false,
                Role = "Internal",
                IsNotified = false
            });
        }

        // Add external evaluator
        if (request.ExternalEvaluatorId.HasValue)
        {
            newEvaluators.Add(new DefenseEvaluator
            {
                DefenseId = defense.Id,
                StaffId = request.ExternalEvaluatorId.Value,
                IsExternal = true,
                Role = "External",
                IsNotified = false
            });
        }

        _context.DefenseEvaluators.AddRange(newEvaluators);
        defense.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Notify newly assigned evaluators
        await NotifyEvaluators(defense, newEvaluators);

        return Ok(new { message = "Panel allocated successfully" });
    }

    // POST: api/defenses/{id}/notify
    [HttpPost("{id}/notify")]
    public async Task<IActionResult> NotifyParticipants(int id)
    {
        var defense = await _context.Defenses
            .Include(d => d.Group)
                .ThenInclude(g => g!.Members)
                    .ThenInclude(gm => gm.Student)
            .Include(d => d.Evaluators)
                .ThenInclude(e => e.Staff)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defense == null)
        {
            return NotFound(new { message = "Defense not found" });
        }

        await SendDefenseNotifications(defense, defense.Group!);

        return Ok(new { message = "Notifications sent successfully" });
    }

    // DELETE: api/defenses/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDefense(int id)
    {
        var defense = await _context.Defenses
            .Include(d => d.Evaluators)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defense == null)
        {
            return NotFound(new { message = "Defense not found" });
        }

        _context.DefenseEvaluators.RemoveRange(defense.Evaluators);
        _context.Defenses.Remove(defense);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Defense deleted successfully" });
    }

    // POST: api/defenses/{id}/results
    [HttpPost("{id}/results")]
    public async Task<IActionResult> EnterDefenseResults(int id, [FromBody] EnterDefenseResultsRequest request)
    {
        var defense = await _context.Defenses
            .Include(d => d.Group)
                .ThenInclude(g => g!.Members)
            .Include(d => d.Evaluators)
                .ThenInclude(e => e.Staff)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defense == null)
        {
            return NotFound(new { message = "Defense not found" });
        }

        if (string.IsNullOrEmpty(request.Result) ||
            !new[] { DefenseResults.Accepted, DefenseResults.Deferred, DefenseResults.Rejected }.Contains(request.Result))
        {
            return BadRequest(new { message = "Invalid result. Must be Accepted, Deferred, or Rejected" });
        }

        // For Initial defenses, ensure all assigned evaluators have submitted marks before finalizing
        if (defense.Type == DefenseTypes.Initial)
        {
            var internalEvaluators = defense.Evaluators
                .Where(e => !e.IsExternal)
                .ToList();

            // If internal evaluators exist, all must have submitted marks
            if (internalEvaluators.Any())
            {
                var pendingEvaluators = internalEvaluators
                    .Where(e => !e.HasSubmittedMarks)
                    .Select(e => new
                    {
                        EvaluatorId = e.StaffId,
                        EvaluatorName = e.Staff?.FullName ?? "Unknown",
                        Role = e.Role
                    })
                    .ToList();

                if (pendingEvaluators.Any())
                {
                    return BadRequest(new
                    {
                        message = "All assigned evaluators must submit marks before entering the result for this initial defense.",
                        pendingEvaluators
                    });
                }
            }
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        var userId = userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;

        // Update defense with results
        defense.Result = request.Result;
        defense.ResultRemarks = request.Remarks;
        defense.ResultEnteredAt = DateTime.UtcNow;
        defense.ResultEnteredById = userId;
        defense.Status = DefenseStatuses.Completed;
        defense.UpdatedAt = DateTime.UtcNow;

        // Update group status based on result
        if (defense.Group != null)
        {
            if (request.Result == DefenseResults.Accepted)
            {
                // Move to next phase
                if (defense.Type == DefenseTypes.Proposal)
                {
                    defense.Group.Status = GroupStatuses.Active;
                }
                else if (defense.Type == DefenseTypes.Final)
                {
                    defense.Group.Status = GroupStatuses.Completed;
                }
            }
            else if (request.Result == DefenseResults.Deferred)
            {
                // Group needs to resubmit
                defense.Group.Status = GroupStatuses.PendingApproval; // Back to pending for resubmission
            }
            else if (request.Result == DefenseResults.Rejected)
            {
                // Major revision needed
                defense.Group.Status = GroupStatuses.Rejected;
            }

            defense.Group.UpdatedAt = DateTime.UtcNow;
        }

        // Update member marks if provided
        if (request.MemberMarks != null && defense.Group?.Members != null)
        {
            foreach (var memberEntry in request.MemberMarks)
            {
                var member = defense.Group.Members.FirstOrDefault(m => m.Id == memberEntry.Key);
                if (member != null && memberEntry.Value.Marks.HasValue)
                {
                    // Assign marks based on defense type
                    if (defense.Type == DefenseTypes.Proposal)
                    {
                        member.ProposalMarks = memberEntry.Value.Marks;
                    }
                    else if (defense.Type == DefenseTypes.MidTerm)
                    {
                        member.MidEvalMarks = memberEntry.Value.Marks;
                    }
                    else if (defense.Type == DefenseTypes.Final)
                    {
                        member.FinalEvalMarks = memberEntry.Value.Marks;
                    }
                }
            }
        }

        await _context.SaveChangesAsync();

        // Send notification to students about the result
        await SendResultNotification(defense, request.Result, request.Remarks);

        return Ok(new
        {
            message = $"Defense marked as {request.Result}. Students have been notified.",
            result = request.Result
        });
    }

    private async Task SendResultNotification(Defense defense, string result, string? remarks)
    {
        var resultMessage = result switch
        {
            DefenseResults.Accepted => "Congratulations! Your proposal has been accepted. You can now proceed to the next phase.",
            DefenseResults.Deferred => "Your proposal has been deferred. Please revise and resubmit based on the feedback provided.",
            DefenseResults.Rejected => "Your proposal requires major revision. Please review the feedback and make significant changes.",
            _ => $"Your defense result: {result}"
        };

        var notification = new Notification
        {
            Title = $"{defense.Type} Defense Result: {result}",
            Message = resultMessage + (string.IsNullOrEmpty(remarks) ? "" : $"\n\nFeedback: {remarks}"),
            Type = NotificationTypes.GradeRelease,
            TargetAudience = "Group",
            DepartmentId = defense.DepartmentId,
            Priority = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    private async Task SendDefenseNotifications(Defense defense, FYPGroup group)
    {
        var typeLabel = defense.Type switch
        {
            DefenseTypes.Proposal => "Proposal Defense",
            DefenseTypes.MidTerm => "Mid-Term Defense",
            DefenseTypes.Final => "Final Defense",
            _ => defense.Type
        };

        // Notification for the group/students
        var notification = new Notification
        {
            Title = $"{typeLabel} Scheduled",
            Message = $"Your {typeLabel} has been scheduled for {defense.DateTime:MMMM dd, yyyy 'at' h:mm tt}" +
                     (string.IsNullOrEmpty(defense.Venue) ? "" : $" at {defense.Venue}"),
            Type = NotificationTypes.Announcement,
            TargetAudience = "Group",
            DepartmentId = defense.DepartmentId,
            Priority = 1, // Important
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);

        // For proposal defenses, also notify the committee
        if (defense.Type == DefenseTypes.Proposal)
        {
            var committeeNotification = new Notification
            {
                Title = "New Proposal Defense Scheduled",
                Message = $"Proposal defense for {group.GroupName} scheduled on {defense.DateTime:MMMM dd, yyyy} at {defense.DateTime:h:mm tt}" +
                         (string.IsNullOrEmpty(defense.Venue) ? "" : $" in {defense.Venue}") +
                         $". Project: {group.ProjectTitle ?? "N/A"}",
                Type = NotificationTypes.DefenseScheduled,
                TargetAudience = "Committee",
                DepartmentId = defense.DepartmentId,
                Priority = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(committeeNotification);
        }

        await _context.SaveChangesAsync();
    }

    private async Task NotifyEvaluators(Defense defense, List<DefenseEvaluator> evaluators)
    {
        if (!evaluators.Any()) return;

        // Load defense group details if not already loaded
        if (defense.Group == null)
        {
            defense = await _context.Defenses
                .Include(d => d.Group)
                .FirstOrDefaultAsync(d => d.Id == defense.Id) ?? defense;
        }

        var typeLabel = defense.Type switch
        {
            DefenseTypes.Proposal => "Proposal Defense",
            DefenseTypes.Initial => "Initial Defense",
            DefenseTypes.MidTerm => "Mid-Term Defense",
            DefenseTypes.Final => "Final Defense",
            _ => defense.Type
        };

        var marksAllocation = defense.Type switch
        {
            DefenseTypes.Initial => "15 marks",
            DefenseTypes.MidTerm => "15 marks",
            DefenseTypes.Final => "30 marks",
            _ => ""
        };

        foreach (var evaluator in evaluators)
        {
            var notification = new Notification
            {
                Title = $"Defense Evaluation Assignment: {typeLabel}",
                Message = $"You have been assigned as an evaluator for {defense.Group?.GroupName ?? "a group"}'s {typeLabel}.\n\n" +
                         $"Project: {defense.Group?.ProjectTitle ?? "N/A"}\n" +
                         $"Date & Time: {defense.DateTime:MMMM dd, yyyy 'at' h:mm tt}\n" +
                         $"Venue: {defense.Venue ?? "TBA"}\n" +
                         (string.IsNullOrEmpty(marksAllocation) ? "" : $"Marks Allocation: {marksAllocation}\n") +
                         $"Role: {(evaluator.IsExternal ? "External Examiner" : "Internal Evaluator")}\n\n" +
                         "Please review the project documentation and prepare your evaluation criteria.",
                Type = NotificationTypes.DefenseScheduled,
                TargetAudience = "Evaluator",
                DepartmentId = defense.DepartmentId,
                Priority = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);

            // Mark evaluator as notified
            evaluator.IsNotified = true;
            evaluator.NotifiedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private static DefenseDTO MapToDTO(Defense d)
    {
        var internalEvals = d.Evaluators?
            .Where(e => !e.IsExternal)
            .Select(e => new DefenseEvaluatorDTO
            {
                Id = e.Id,
                StaffId = e.StaffId,
                FullName = e.Staff?.FullName ?? "",
                Designation = e.Staff?.Designation,
                IsExternal = e.IsExternal,
                Role = e.Role
            }).ToList() ?? new List<DefenseEvaluatorDTO>();

        var externalEval = d.Evaluators?
            .FirstOrDefault(e => e.IsExternal);

        return new DefenseDTO
        {
            Id = d.Id,
            GroupId = d.GroupId,
            GroupName = d.Group?.GroupName,
            ProjectTitle = d.Group?.ProjectTitle,
            Type = d.Type,
            DateTime = d.DateTime,
            Venue = d.Venue,
            Status = d.Status,
            Notes = d.Notes,
            DepartmentId = d.DepartmentId,
            DepartmentName = d.Department?.Name,
            InternalEvaluators = internalEvals,
            ExternalEvaluator = externalEval != null ? new DefenseEvaluatorDTO
            {
                Id = externalEval.Id,
                StaffId = externalEval.StaffId,
                FullName = externalEval.Staff?.FullName ?? "",
                Designation = externalEval.Staff?.Designation,
                IsExternal = true,
                Role = "External"
            } : null,
            ExternalEvaluatorId = externalEval?.StaffId,
            CreatedAt = d.CreatedAt,
            // Result fields
            Result = d.Result,
            ResultRemarks = d.ResultRemarks,
            ResultEnteredAt = d.ResultEnteredAt
        };
    }
}

