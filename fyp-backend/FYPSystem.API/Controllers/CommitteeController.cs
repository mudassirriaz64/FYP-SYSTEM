using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

/// <summary>
/// Controller for the Proposal Defense Committee shared login module.
/// Handles proposal defense evaluation by the committee.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Committee")]
public class CommitteeController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CommitteeController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all proposal defenses for evaluation (today's and upcoming scheduled)
    /// </summary>
    [HttpGet("defenses")]
    public async Task<IActionResult> GetProposalDefenses([FromQuery] string? filter = "today")
    {
        try
        {
            var query = _context.Defenses
                .Include(d => d.Group)
                    .ThenInclude(g => g!.Members)
                        .ThenInclude(m => m.Student)
                .Include(d => d.Group)
                    .ThenInclude(g => g!.Supervisor)
                .Where(d => d.Type == DefenseTypes.Proposal);

            var today = DateTime.UtcNow.Date;

            if (filter == "today")
            {
                query = query.Where(d => d.DateTime.Date == today);
            }
            else if (filter == "upcoming")
            {
                query = query.Where(d => d.DateTime.Date >= today && d.Result == null);
            }
            else if (filter == "completed")
            {
                query = query.Where(d => d.Result != null);
            }

            var defenses = await query
                .OrderBy(d => d.DateTime)
                .ToListAsync();

            var result = defenses.Select(d => new
            {
                d.Id,
                d.DateTime,
                d.Venue,
                d.Status,
                d.Result,
                d.ResultRemarks,
                d.ResultEnteredAt,
                Group = d.Group == null ? null : new
                {
                    d.Group.Id,
                    d.Group.GroupName,
                    d.Group.ProjectTitle,
                    d.Group.ProjectDescription,
                    SupervisorName = d.Group.Supervisor?.FullName,
                    Members = d.Group.Members.Select(m => new
                    {
                        m.Id,
                        Student = m.Student == null ? null : new
                        {
                            m.Student.Id,
                            m.Student.FullName,
                            m.Student.EnrollmentId
                        }
                    })
                }
            });

            return Ok(new
            {
                defenses = result,
                stats = new
                {
                    total = defenses.Count,
                    pending = defenses.Count(d => d.Result == null),
                    accepted = defenses.Count(d => d.Result == DefenseResults.Accepted),
                    deferred = defenses.Count(d => d.Result == DefenseResults.Deferred),
                    rejected = defenses.Count(d => d.Result == DefenseResults.Rejected)
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to fetch defenses", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a single defense with full details
    /// </summary>
    [HttpGet("defenses/{id}")]
    public async Task<IActionResult> GetDefense(int id)
    {
        var defense = await _context.Defenses
            .Include(d => d.Group)
                .ThenInclude(g => g!.Members)
                    .ThenInclude(m => m.Student)
            .Include(d => d.Group)
                .ThenInclude(g => g!.Supervisor)
            .Include(d => d.Group)
                .ThenInclude(g => g!.Proposals)
            .FirstOrDefaultAsync(d => d.Id == id && d.Type == DefenseTypes.Proposal);

        if (defense == null)
        {
            return NotFound(new { message = "Defense not found" });
        }

        return Ok(new
        {
            defense.Id,
            defense.DateTime,
            defense.Venue,
            defense.Status,
            defense.Result,
            defense.ResultRemarks,
            defense.Notes,
            Group = defense.Group == null ? null : new
            {
                defense.Group.Id,
                defense.Group.GroupName,
                defense.Group.ProjectTitle,
                defense.Group.ProjectDescription,
                defense.Group.DegreeLevel,
                defense.Group.DegreeProgram,
                SupervisorName = defense.Group.Supervisor?.FullName,
                SupervisorEmail = defense.Group.Supervisor?.Email,
                Members = defense.Group.Members.Select(m => new
                {
                    m.Id,
                    m.Student?.FullName,
                    m.Student?.EnrollmentId,
                    m.Student?.Email,
                    m.Role
                }),
                // Get the latest proposal info if available
                LatestProposal = defense.Group.Proposals?
                    .OrderByDescending(p => p.SubmittedAt)
                    .Select(p => new
                    {
                        p.Id,
                        p.FormType,
                        p.Status,
                        p.SubmittedAt
                    })
                    .FirstOrDefault()
            }
        });
    }

    /// <summary>
    /// Submit the result of a proposal defense evaluation.
    /// </summary>
    [HttpPost("defenses/{id}/result")]
    public async Task<IActionResult> SubmitDefenseResult(int id, [FromBody] ProposalDefenseResultRequest request)
    {
        var defense = await _context.Defenses
            .Include(d => d.Group)
            .FirstOrDefaultAsync(d => d.Id == id && d.Type == DefenseTypes.Proposal);

        if (defense == null)
        {
            return NotFound(new { message = "Defense not found" });
        }

        if (defense.Result != null)
        {
            return BadRequest(new { message = "This defense has already been evaluated" });
        }

        // Validate result
        if (!new[] { DefenseResults.Accepted, DefenseResults.Deferred, DefenseResults.Rejected }.Contains(request.Result))
        {
            return BadRequest(new { message = "Invalid result. Must be Accepted, Deferred, or Rejected" });
        }

        // Update defense
        defense.Result = request.Result;
        defense.ResultRemarks = request.Remarks;
        defense.ResultEnteredAt = DateTime.UtcNow;
        defense.Status = DefenseStatuses.Completed;
        defense.UpdatedAt = DateTime.UtcNow;

        // Update group status based on result
        if (defense.Group != null)
        {
            if (request.Result == DefenseResults.Accepted)
            {
                defense.Group.Status = GroupStatuses.Active;
            }
            else if (request.Result == DefenseResults.Deferred)
            {
                defense.Group.Status = GroupStatuses.Deferred;
            }
            else if (request.Result == DefenseResults.Rejected)
            {
                defense.Group.Status = GroupStatuses.Rejected;
            }
            defense.Group.UpdatedAt = DateTime.UtcNow;
        }

        // Create notification for students
        var notification = new Notification
        {
            Title = $"Proposal Defense Result: {request.Result}",
            Message = $"Your proposal defense has been evaluated. Result: {request.Result}. {(string.IsNullOrEmpty(request.Remarks) ? "" : $"Remarks: {request.Remarks}")}",
            Type = NotificationTypes.DefenseScheduled,
            TargetAudience = "Group",
            Priority = request.Result == DefenseResults.Rejected ? 2 : 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Defense marked as {request.Result}",
            defenseId = defense.Id,
            result = defense.Result,
            groupStatus = defense.Group?.Status
        });
    }

    /// <summary>
    /// Get committee dashboard stats
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var today = DateTime.UtcNow.Date;

        var todayDefenses = await _context.Defenses
            .Where(d => d.Type == DefenseTypes.Proposal && d.DateTime.Date == today)
            .CountAsync();

        var pendingEvaluation = await _context.Defenses
            .Where(d => d.Type == DefenseTypes.Proposal && d.Result == null && d.DateTime < DateTime.UtcNow)
            .CountAsync();

        var upcomingDefenses = await _context.Defenses
            .Where(d => d.Type == DefenseTypes.Proposal && d.DateTime.Date > today && d.Result == null)
            .CountAsync();

        var totalEvaluated = await _context.Defenses
            .Where(d => d.Type == DefenseTypes.Proposal && d.Result != null)
            .CountAsync();

        var recentResults = await _context.Defenses
            .Include(d => d.Group)
            .Where(d => d.Type == DefenseTypes.Proposal && d.Result != null)
            .OrderByDescending(d => d.ResultEnteredAt)
            .Take(5)
            .Select(d => new
            {
                d.Id,
                d.Group!.GroupName,
                d.Result,
                d.ResultEnteredAt
            })
            .ToListAsync();

        return Ok(new
        {
            todayDefenses,
            pendingEvaluation,
            upcomingDefenses,
            totalEvaluated,
            recentResults
        });
    }

    /// <summary>
    /// Get notifications for committee
    /// </summary>
    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var notifications = await _context.Notifications
            .Where(n => n.TargetAudience == "Committee" || n.Type == NotificationTypes.DefenseScheduled)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(new { notifications });
    }

    /// <summary>
    /// Get committee members with their roles
    /// </summary>
    [HttpGet("members")]
    public async Task<IActionResult> GetCommitteeMembers()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Get the committee for this user
        var committee = await _context.ProposalCommittees
            .Include(c => c.Members)
                .ThenInclude(m => m.Staff)
                    .ThenInclude(s => s!.Department)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == CommitteeStatuses.Active);

        if (committee == null)
        {
            return NotFound(new { message = "Committee not found or not active" });
        }

        var members = committee.Members.Select(m => new
        {
            m.Id,
            m.StaffId,
            FullName = m.Staff?.FullName,
            Email = m.Staff?.Email,
            Designation = m.Staff?.Designation,
            Department = m.Staff?.Department?.Name,
            // Determine roles based on staff properties
            Roles = new List<string>
            {
                m.Staff?.IsSupervisor == true ? "Supervisor" : null,
                m.Staff?.IsHOD == true ? "HOD" : null,
                m.Staff?.IsCommitteeMember == true ? "Committee Member" : null
            }.Where(r => r != null).ToList()
        }).ToList();

        return Ok(new { members });
    }
}

public class ProposalDefenseResultRequest
{
    public string Result { get; set; } = string.Empty; // Accepted, Deferred, Rejected
    public string? Remarks { get; set; }
}
