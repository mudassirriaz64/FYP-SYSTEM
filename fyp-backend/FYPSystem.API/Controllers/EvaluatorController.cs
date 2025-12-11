using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Evaluator,Committee,Supervisor")] // Allow evaluators, committee members, and supervisors
public class EvaluatorController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EvaluatorController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Helper: Get current staff profile linked to logged-in user
    private async Task<Staff?> GetCurrentStaff()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return null;

        var userId = int.Parse(userIdClaim.Value);
        return await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);
    }

    // GET: api/evaluator/defenses - Get defenses assigned to current evaluator
    [HttpGet("defenses")]
    public async Task<IActionResult> GetAssignedDefenses(
        [FromQuery] string? status = null,
        [FromQuery] string? type = null)
    {
        var staff = await GetCurrentStaff();
        if (staff == null)
        {
            return Unauthorized(new { message = "Staff profile not found for this user" });
        }

        var query = _context.DefenseEvaluators
            .Include(de => de.Defense)
                .ThenInclude(d => d!.Group)
                    .ThenInclude(g => g!.Members)
                        .ThenInclude(m => m.Student)
            .Include(de => de.Defense)
                .ThenInclude(d => d!.Group)
                    .ThenInclude(g => g!.Supervisor)
            .Include(de => de.Defense)
                .ThenInclude(d => d!.Evaluators)
                    .ThenInclude(e => e.Staff)
            .Where(de => de.StaffId == staff.Id)
            .AsSplitQuery(); // Use split query for better performance with multiple includes

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(de => de.Defense!.Status == status);
        }

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(de => de.Defense!.Type == type);
        }

        var assignments = await query
            .OrderBy(de => de.Defense!.DateTime)
            .ToListAsync();

        // Filter out any assignments where Defense is null (shouldn't happen but defensive)
        var validAssignments = assignments.Where(de => de.Defense != null && de.Defense.Group != null).ToList();

        var result = validAssignments.Select(de => new
        {
            EvaluationId = de.Id,
            DefenseId = de.DefenseId,
            Defense = new
            {
                Id = de.Defense.Id,
                Type = de.Defense.Type,
                DateTime = de.Defense.DateTime,
                Venue = de.Defense.Venue,
                Status = de.Defense.Status,
                Notes = de.Defense.Notes,
                Result = de.Defense.Result,
                ResultRemarks = de.Defense.ResultRemarks,
                Duration = de.Defense.Duration?.ToString(@"hh\:mm")
            },
            Group = new
            {
                Id = de.Defense.Group.Id,
                GroupName = de.Defense.Group.GroupName,
                ProjectTitle = de.Defense.Group.ProjectTitle,
                ProjectDescription = de.Defense.Group.ProjectDescription,
                SupervisorName = de.Defense.Group.Supervisor?.FullName,
                Members = de.Defense.Group.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Select(m => new
                    {
                        Id = m.Student!.Id,
                        FullName = m.Student.FullName,
                        EnrollmentId = m.Student.EnrollmentId,
                        IsGroupManager = m.IsGroupManager
                    }).ToList()
            },
            MyRole = new
            {
                Role = de.Role,
                IsExternal = de.IsExternal,
                IsNotified = de.IsNotified,
                NotifiedAt = de.NotifiedAt,
                HasSubmittedMarks = de.HasSubmittedMarks,
                MarksSubmittedAt = de.MarksSubmittedAt
            },
            OtherEvaluators = de.Defense.Evaluators
                .Where(e => e.Id != de.Id)
                .Select(e => new
                {
                    FullName = e.Staff!.FullName,
                    Designation = e.Staff.Designation,
                    Role = e.Role,
                    IsExternal = e.IsExternal,
                    HasSubmittedMarks = e.HasSubmittedMarks
                }).ToList()
        }).ToList();

        return Ok(new { defenses = result, totalCount = result.Count });
    }

    // GET: api/evaluator/defenses/{defenseId}/marks - Get marks submitted for a defense
    [HttpGet("defenses/{defenseId}/marks")]
    public async Task<IActionResult> GetDefenseMarks(int defenseId)
    {
        var staff = await GetCurrentStaff();
        if (staff == null)
        {
            return Unauthorized(new { message = "Staff profile not found for this user" });
        }

        // Check if evaluator is assigned to this defense
        var assignment = await _context.DefenseEvaluators
            .FirstOrDefaultAsync(de => de.DefenseId == defenseId && de.StaffId == staff.Id);

        if (assignment == null)
        {
            return Forbid(); // Not authorized to view this defense
        }

        var marks = await _context.DefenseMarks
            .Include(dm => dm.Evaluator)
            .Where(dm => dm.DefenseId == defenseId)
            .Select(dm => new
            {
                dm.Id,
                EvaluatorId = dm.EvaluatorId,
                EvaluatorName = dm.Evaluator!.FullName,
                dm.PresentationMarks,
                dm.TechnicalMarks,
                dm.DocumentationMarks,
                dm.QAMarks,
                dm.TotalMarks,
                dm.Comments,
                dm.Feedback,
                dm.SubmittedAt,
                IsMySubmission = dm.EvaluatorId == staff.Id
            })
            .ToListAsync();

        return Ok(new { marks });
    }

    // POST: api/evaluator/defenses/{defenseId}/marks - Submit marks for a defense
    [HttpPost("defenses/{defenseId}/marks")]
    public async Task<IActionResult> SubmitMarks(int defenseId, [FromBody] SubmitMarksRequest request)
    {
        var staff = await GetCurrentStaff();
        if (staff == null)
        {
            return Unauthorized(new { message = "Staff profile not found for this user" });
        }

        // Check if evaluator is assigned to this defense
        var assignment = await _context.DefenseEvaluators
            .Include(de => de.Defense)
            .FirstOrDefaultAsync(de => de.DefenseId == defenseId && de.StaffId == staff.Id);

        if (assignment == null)
        {
            return Forbid(); // Not authorized to evaluate this defense
        }

        // Validate defense status
        if (assignment.Defense?.Status != DefenseStatuses.Scheduled &&
            assignment.Defense?.Status != DefenseStatuses.InProgress &&
            assignment.Defense?.Status != DefenseStatuses.Completed)
        {
            return BadRequest(new { message = "Defense is not ready for evaluation" });
        }

        // Check if marks already submitted
        var existingMarks = await _context.DefenseMarks
            .FirstOrDefaultAsync(dm => dm.DefenseId == defenseId && dm.EvaluatorId == staff.Id);

        if (existingMarks != null)
        {
            return BadRequest(new { message = "You have already submitted marks for this defense. Use the update endpoint to modify." });
        }

        // Calculate total marks
        var totalMarks = (request.PresentationMarks ?? 0) +
                        (request.TechnicalMarks ?? 0) +
                        (request.DocumentationMarks ?? 0) +
                        (request.QAMarks ?? 0);

        // Create marks entry
        var marks = new DefenseMarks
        {
            DefenseId = defenseId,
            EvaluatorId = staff.Id,
            PresentationMarks = request.PresentationMarks,
            TechnicalMarks = request.TechnicalMarks,
            DocumentationMarks = request.DocumentationMarks,
            QAMarks = request.QAMarks,
            TotalMarks = totalMarks,
            Comments = request.Comments,
            Feedback = request.Feedback,
            SubmittedAt = DateTime.UtcNow
        };

        _context.DefenseMarks.Add(marks);

        // Update evaluator assignment
        assignment.HasSubmittedMarks = true;
        assignment.MarksSubmittedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Marks submitted successfully",
            marksId = marks.Id,
            totalMarks = totalMarks
        });
    }

    // PUT: api/evaluator/defenses/{defenseId}/marks - Update submitted marks
    [HttpPut("defenses/{defenseId}/marks")]
    public async Task<IActionResult> UpdateMarks(int defenseId, [FromBody] SubmitMarksRequest request)
    {
        var staff = await GetCurrentStaff();
        if (staff == null)
        {
            return Unauthorized(new { message = "Staff profile not found for this user" });
        }

        // Check if evaluator is assigned to this defense
        var assignment = await _context.DefenseEvaluators
            .Include(de => de.Defense)
            .FirstOrDefaultAsync(de => de.DefenseId == defenseId && de.StaffId == staff.Id);

        if (assignment == null)
        {
            return Forbid();
        }

        // Find existing marks
        var existingMarks = await _context.DefenseMarks
            .FirstOrDefaultAsync(dm => dm.DefenseId == defenseId && dm.EvaluatorId == staff.Id);

        if (existingMarks == null)
        {
            return NotFound(new { message = "No marks found to update. Please submit marks first." });
        }

        // Validate defense is not finalized
        if (assignment.Defense?.Status == DefenseStatuses.Cancelled)
        {
            return BadRequest(new { message = "Cannot update marks for cancelled defense" });
        }

        // Calculate total marks
        var totalMarks = (request.PresentationMarks ?? 0) +
                        (request.TechnicalMarks ?? 0) +
                        (request.DocumentationMarks ?? 0) +
                        (request.QAMarks ?? 0);

        // Update marks
        existingMarks.PresentationMarks = request.PresentationMarks;
        existingMarks.TechnicalMarks = request.TechnicalMarks;
        existingMarks.DocumentationMarks = request.DocumentationMarks;
        existingMarks.QAMarks = request.QAMarks;
        existingMarks.TotalMarks = totalMarks;
        existingMarks.Comments = request.Comments;
        existingMarks.Feedback = request.Feedback;
        existingMarks.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Marks updated successfully",
            totalMarks = totalMarks
        });
    }

    // GET: api/evaluator/stats - Get evaluator statistics
    [HttpGet("stats")]
    public async Task<IActionResult> GetEvaluatorStats()
    {
        var staff = await GetCurrentStaff();
        if (staff == null)
        {
            return Unauthorized(new { message = "Staff profile not found for this user" });
        }

        var assignments = await _context.DefenseEvaluators
            .Include(de => de.Defense)
            .Where(de => de.StaffId == staff.Id)
            .ToListAsync();

        var stats = new
        {
            TotalAssignments = assignments.Count,
            UpcomingDefenses = assignments.Count(de => de.Defense!.Status == DefenseStatuses.Scheduled &&
                                                      de.Defense.DateTime > DateTime.UtcNow),
            CompletedDefenses = assignments.Count(de => de.Defense!.Status == DefenseStatuses.Completed),
            PendingMarksSubmission = assignments.Count(de => !de.HasSubmittedMarks &&
                                                            de.Defense!.Status != DefenseStatuses.Cancelled),
            SubmittedMarks = assignments.Count(de => de.HasSubmittedMarks),
            DefensesByType = assignments
                .GroupBy(de => de.Defense!.Type)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToList()
        };

        return Ok(stats);
    }
}

// Request DTOs
public class SubmitMarksRequest
{
    public decimal? PresentationMarks { get; set; }
    public decimal? TechnicalMarks { get; set; }
    public decimal? DocumentationMarks { get; set; }
    public decimal? QAMarks { get; set; }
    public string? Comments { get; set; }
    public string? Feedback { get; set; }
}
