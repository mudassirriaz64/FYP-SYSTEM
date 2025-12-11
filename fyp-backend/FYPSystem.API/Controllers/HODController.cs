using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/hod")]
[Authorize(Roles = "HOD,SuperAdmin")]
public class HODController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public HODController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/hod/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        // Find HOD's staff record and department
        var staff = await _context.Staff
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => (s.UserId == userId || s.Id == userId) && s.IsHOD);

        int? departmentId = staff?.DepartmentId;
        string departmentName = staff?.Department?.Name ?? "Department";

        // Get statistics
        var totalGroups = await _context.FYPGroups
            .Where(g => departmentId == null || g.DepartmentId == departmentId)
            .CountAsync();

        var activeGroups = await _context.FYPGroups
            .Where(g => (departmentId == null || g.DepartmentId == departmentId) && g.Status == GroupStatuses.Active)
            .CountAsync();

        var pendingEscalations = await _context.Escalations
            .Where(e => (departmentId == null || e.DepartmentId == departmentId) && 
                       (e.Status == EscalationStatuses.Open || e.Status == EscalationStatuses.UnderReview))
            .CountAsync();

        var pendingBudgets = await _context.ProjectBudgets
            .Include(b => b.Group)
            .Where(b => (departmentId == null || b.Group!.DepartmentId == departmentId) && 
                       b.Status == BudgetStatuses.SupervisorEndorsed)
            .CountAsync();

        var pendingMarkReviews = await _context.FYPGroups
            .Where(g => (departmentId == null || g.DepartmentId == departmentId) && 
                       g.ResultsCompiled && !g.HODMarksReviewed)
            .CountAsync();

        // Get recent escalations
        var escalations = await _context.Escalations
            .Include(e => e.Group)
            .Where(e => (departmentId == null || e.DepartmentId == departmentId) && 
                       e.Status == EscalationStatuses.Open)
            .OrderByDescending(e => e.ReportedAt)
            .Take(5)
            .Select(e => new
            {
                e.Id,
                groupName = e.Group!.GroupName,
                e.Type,
                e.Reason,
                e.Severity,
                e.Status,
                e.ReportedAt
            })
            .ToListAsync();

        // Get pending budgets
        var budgets = await _context.ProjectBudgets
            .Include(b => b.Group)
            .Where(b => (departmentId == null || b.Group!.DepartmentId == departmentId) && 
                       b.Status == BudgetStatuses.SupervisorEndorsed)
            .OrderByDescending(b => b.CreatedAt)
            .Take(3)
            .Select(b => new
            {
                b.Id,
                groupName = b.Group!.GroupName,
                b.Title,
                b.RequestedAmount
            })
            .ToListAsync();

        return Ok(new
        {
            departmentName,
            totalGroups,
            activeGroups,
            pendingEscalations,
            pendingBudgets,
            pendingMarkReviews,
            escalations,
            budgets,
            recentActivities = new List<object>()
        });
    }

    // GET: api/hod/escalations
    [HttpGet("escalations")]
    public async Task<IActionResult> GetEscalations([FromQuery] string? status, [FromQuery] string? severity)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff.FirstOrDefaultAsync(s => (s.UserId == userId || s.Id == userId) && s.IsHOD);
        int? departmentId = staff?.DepartmentId;

        var query = _context.Escalations
            .Include(e => e.Group)
                .ThenInclude(g => g!.Supervisor)
            .Include(e => e.Group)
                .ThenInclude(g => g!.Members)
            .Include(e => e.ReportedBy)
            .Include(e => e.ResolvedBy)
            .Where(e => departmentId == null || e.DepartmentId == departmentId);

        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            query = query.Where(e => e.Status == status);
        }

        if (!string.IsNullOrEmpty(severity) && severity != "All")
        {
            query = query.Where(e => e.Severity == severity);
        }

        var escalations = await query
            .OrderByDescending(e => e.ReportedAt)
            .Select(e => new
            {
                e.Id,
                e.GroupId,
                groupName = e.Group!.GroupName,
                projectTitle = e.Group.ProjectTitle,
                supervisorName = e.Group.Supervisor != null ? e.Group.Supervisor.FullName : null,
                memberCount = e.Group.Members.Count(m => m.Status == MemberStatuses.Accepted),
                e.Type,
                e.Reason,
                e.Severity,
                e.Status,
                reportedByName = e.ReportedBy != null ? e.ReportedBy.FullName : "System",
                e.ReportedAt,
                resolvedByName = e.ResolvedBy != null ? e.ResolvedBy.FullName : null,
                e.ResolvedAt,
                e.ResolutionNotes
            })
            .ToListAsync();

        return Ok(new { escalations });
    }

    // POST: api/hod/escalations/{id}/action
    [HttpPost("escalations/{id}/action")]
    public async Task<IActionResult> HandleEscalation(int id, [FromBody] EscalationActionRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId || s.Id == userId);

        var escalation = await _context.Escalations
            .Include(e => e.Group)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (escalation == null)
        {
            return NotFound(new { message = "Escalation not found" });
        }

        if (request.Action == "warning")
        {
            escalation.Status = EscalationStatuses.WarningIssued;
            
            // Create notification for students
            var notification = new Notification
            {
                Title = "Warning Issued by HOD",
                Message = request.Remarks ?? "A warning has been issued regarding your group's performance. Please take immediate action.",
                Type = NotificationTypes.Announcement,
                TargetAudience = "Group",
                DepartmentId = escalation.DepartmentId,
                Priority = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }
        else if (request.Action == "resolve")
        {
            escalation.Status = EscalationStatuses.Resolved;
            escalation.ResolvedById = staff?.Id;
            escalation.ResolvedAt = DateTime.UtcNow;
            escalation.ResolutionNotes = request.Remarks;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Escalation {request.Action}ed successfully" });
    }

    // GET: api/hod/budgets
    [HttpGet("budgets")]
    public async Task<IActionResult> GetBudgets([FromQuery] string? status)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff.FirstOrDefaultAsync(s => (s.UserId == userId || s.Id == userId) && s.IsHOD);
        int? departmentId = staff?.DepartmentId;

        var query = _context.ProjectBudgets
            .Include(b => b.Group)
                .ThenInclude(g => g!.Supervisor)
            .Include(b => b.SupervisorEndorsedBy)
            .Include(b => b.HODApprovedBy)
            .Include(b => b.FinanceDisbursedBy)
            .Where(b => departmentId == null || b.Group!.DepartmentId == departmentId);

        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            query = query.Where(b => b.Status == status);
        }

        var budgets = await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.Id,
                b.GroupId,
                groupName = b.Group!.GroupName,
                projectTitle = b.Group.ProjectTitle,
                supervisorName = b.Group.Supervisor != null ? b.Group.Supervisor.FullName : null,
                b.Title,
                b.Description,
                b.RequestedAmount,
                b.ApprovedAmount,
                b.Status,
                b.BoQFilePath,
                supervisorEndorsedByName = b.SupervisorEndorsedBy != null ? b.SupervisorEndorsedBy.FullName : null,
                b.SupervisorEndorsedAt,
                b.SupervisorRemarks,
                hodApprovedByName = b.HODApprovedBy != null ? b.HODApprovedBy.FullName : null,
                b.HODApprovedAt,
                b.HODRemarks,
                b.FinanceDisbursedAt,
                b.FinanceRemarks,
                b.CreatedAt
            })
            .ToListAsync();

        return Ok(new { budgets });
    }

    // POST: api/hod/budgets/{id}/review
    [HttpPost("budgets/{id}/review")]
    public async Task<IActionResult> ReviewBudget(int id, [FromBody] BudgetReviewRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId || s.Id == userId);

        var budget = await _context.ProjectBudgets
            .Include(b => b.Group)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (budget == null)
        {
            return NotFound(new { message = "Budget not found" });
        }

        if (request.Approved)
        {
            budget.Status = BudgetStatuses.HODApproved;
            budget.ApprovedAmount = request.ApprovedAmount ?? budget.RequestedAmount;
        }
        else
        {
            budget.Status = BudgetStatuses.HODRejected;
        }

        budget.HODApprovedById = staff?.Id;
        budget.HODApprovedAt = DateTime.UtcNow;
        budget.HODRemarks = request.Remarks;
        budget.UpdatedAt = DateTime.UtcNow;

        // Notify group
        var notification = new Notification
        {
            Title = request.Approved ? "Budget Approved by HOD" : "Budget Rejected by HOD",
            Message = request.Approved 
                ? $"Your budget request for PKR {budget.ApprovedAmount:N0} has been approved. It will now be processed by the Finance department."
                : $"Your budget request has been rejected. Reason: {request.Remarks ?? "Not specified"}",
            Type = NotificationTypes.Announcement,
            TargetAudience = "Group",
            DepartmentId = budget.Group?.DepartmentId,
            Priority = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();

        return Ok(new { message = request.Approved ? "Budget approved successfully" : "Budget rejected" });
    }

    // GET: api/hod/marks
    [HttpGet("marks")]
    public async Task<IActionResult> GetMarks([FromQuery] string? reviewStatus)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff.FirstOrDefaultAsync(s => (s.UserId == userId || s.Id == userId) && s.IsHOD);
        int? departmentId = staff?.DepartmentId;

        var query = _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Include(g => g.Supervisor)
            .Where(g => (departmentId == null || g.DepartmentId == departmentId) && g.ResultsCompiled);

        if (!string.IsNullOrEmpty(reviewStatus) && reviewStatus != "All")
        {
            if (reviewStatus == "PendingReview")
            {
                query = query.Where(g => !g.HODMarksReviewed);
            }
            else if (reviewStatus == "Approved")
            {
                query = query.Where(g => g.HODMarksReviewed && g.HODReviewStatus == HODReviewStatuses.Approved);
            }
            else if (reviewStatus == "NeedsRevision")
            {
                query = query.Where(g => g.HODMarksReviewed && g.HODReviewStatus == HODReviewStatuses.NeedsRevision);
            }
        }

        var groups = await query
            .OrderByDescending(g => g.ResultsCompiledAt)
            .Select(g => new
            {
                g.Id,
                g.GroupName,
                g.ProjectTitle,
                supervisorName = g.Supervisor != null ? g.Supervisor.FullName : null,
                memberCount = g.Members.Count(m => m.Status == MemberStatuses.Accepted),
                g.HODMarksReviewed,
                hodReviewStatus = g.HODReviewStatus,
                hodReviewRemarks = g.HODReviewRemarks,
                g.HODReviewedAt,
                members = g.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Select(m => new
                    {
                        m.Id,
                        studentName = m.Student != null ? m.Student.FullName : "",
                        enrollmentId = m.Student != null ? m.Student.EnrollmentId : "",
                        m.ProposalMarks,
                        m.MidEvalMarks,
                        m.SupervisorMarks,
                        m.FinalEvalMarks,
                        m.TotalMarks,
                        m.Grade,
                        // Calculate variance (difference between evaluator marks)
                        variance = CalculateVariance(m.ProposalMarks, m.MidEvalMarks, m.FinalEvalMarks)
                    }).ToList(),
                averageMarks = g.Members
                    .Where(m => m.Status == MemberStatuses.Accepted && m.TotalMarks.HasValue)
                    .Average(m => (double?)m.TotalMarks),
                highestMarks = g.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Max(m => m.TotalMarks),
                lowestMarks = g.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Min(m => m.TotalMarks),
                maxVariance = g.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Max(m => Math.Abs(CalculateVariance(m.ProposalMarks, m.MidEvalMarks, m.FinalEvalMarks)))
            })
            .ToListAsync();

        return Ok(new { groups });
    }

    // POST: api/hod/groups/{id}/review-marks
    [HttpPost("groups/{id}/review-marks")]
    public async Task<IActionResult> ReviewMarks(int id, [FromBody] MarkReviewRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId || s.Id == userId);

        var group = await _context.FYPGroups.FirstOrDefaultAsync(g => g.Id == id);

        if (group == null)
        {
            return NotFound(new { message = "Group not found" });
        }

        group.HODMarksReviewed = true;
        group.HODReviewedById = staff?.Id;
        group.HODReviewedAt = DateTime.UtcNow;
        group.HODReviewRemarks = request.Remarks;
        group.HODReviewStatus = request.Approved ? HODReviewStatuses.Approved : HODReviewStatuses.NeedsRevision;

        // If approved, marks can be published
        if (request.Approved)
        {
            // Optionally auto-publish or leave for coordinator
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = request.Approved ? "Marks approved successfully" : "Marks flagged for revision" });
    }

    // GET: api/hod/groups
    [HttpGet("groups")]
    public async Task<IActionResult> GetGroups()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff.FirstOrDefaultAsync(s => (s.UserId == userId || s.Id == userId) && s.IsHOD);
        int? departmentId = staff?.DepartmentId;

        var groups = await _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Include(g => g.Supervisor)
            .Where(g => departmentId == null || g.DepartmentId == departmentId)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                g.Id,
                g.GroupName,
                g.ProjectTitle,
                g.Status,
                supervisorName = g.Supervisor != null ? g.Supervisor.FullName : null,
                memberCount = g.Members.Count(m => m.Status == MemberStatuses.Accepted),
                g.CreatedAt
            })
            .ToListAsync();

        return Ok(new { groups });
    }

    private static decimal CalculateVariance(decimal? proposal, decimal? midTerm, decimal? final)
    {
        var values = new List<decimal>();
        if (proposal.HasValue) values.Add(proposal.Value);
        if (midTerm.HasValue) values.Add(midTerm.Value);
        if (final.HasValue) values.Add(final.Value);

        if (values.Count < 2) return 0;

        var avg = values.Average();
        if (avg == 0) return 0;

        var maxDiff = values.Max() - values.Min();
        return Math.Round((maxDiff / avg) * 100, 1);
    }

    // GET: api/hod/reports
    [HttpGet("reports")]
    public async Task<IActionResult> GetReports([FromQuery] string period = "current")
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => (s.UserId == userId || s.Id == userId) && s.IsHOD);

        int? departmentId = staff?.DepartmentId;
        string departmentName = staff?.Department?.Name ?? "Department";

        // Get summary data
        var totalGroups = await _context.FYPGroups
            .Where(g => departmentId == null || g.DepartmentId == departmentId)
            .CountAsync();

        var activeGroups = await _context.FYPGroups
            .Where(g => (departmentId == null || g.DepartmentId == departmentId) && g.Status == GroupStatuses.Active)
            .CountAsync();

        var completedGroups = await _context.FYPGroups
            .Where(g => (departmentId == null || g.DepartmentId == departmentId) && g.Status == GroupStatuses.Completed)
            .CountAsync();

        var totalStudents = await _context.GroupMembers
            .Include(gm => gm.Group)
            .Where(gm => (departmentId == null || gm.Group!.DepartmentId == departmentId) && gm.Status == MemberStatuses.Accepted)
            .CountAsync();

        var totalSupervisors = await _context.Staff
            .Where(s => (departmentId == null || s.DepartmentId == departmentId) && s.IsSupervisor)
            .CountAsync();

        // Escalations summary
        var totalEscalations = await _context.Escalations
            .Where(e => departmentId == null || e.DepartmentId == departmentId)
            .CountAsync();

        var resolvedEscalations = await _context.Escalations
            .Where(e => (departmentId == null || e.DepartmentId == departmentId) && 
                       (e.Status == EscalationStatuses.Resolved || e.Status == EscalationStatuses.Closed))
            .CountAsync();

        // Budget summary
        var budgetStats = await _context.ProjectBudgets
            .Include(b => b.Group)
            .Where(b => departmentId == null || b.Group!.DepartmentId == departmentId)
            .GroupBy(b => 1)
            .Select(g => new
            {
                TotalRequested = g.Sum(b => b.RequestedAmount),
                TotalApproved = g.Sum(b => b.ApprovedAmount ?? 0),
                TotalDisbursed = g.Where(b => b.Status == BudgetStatuses.Disbursed).Sum(b => b.ApprovedAmount ?? 0)
            })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            departmentName,
            period,
            summary = new
            {
                totalGroups,
                activeGroups,
                completedGroups,
                totalStudents,
                totalSupervisors
            },
            performance = new
            {
                averageGrade = "B+", // This would need actual calculation from marks
                passRate = completedGroups > 0 ? 85 : 0, // Placeholder
                onTimeCompletion = completedGroups > 0 ? 78 : 0 // Placeholder
            },
            escalations = new
            {
                total = totalEscalations,
                resolved = resolvedEscalations,
                pending = totalEscalations - resolvedEscalations
            },
            budgets = new
            {
                totalRequested = budgetStats?.TotalRequested ?? 0,
                totalApproved = budgetStats?.TotalApproved ?? 0,
                totalDisbursed = budgetStats?.TotalDisbursed ?? 0
            }
        });
    }
}

// Request DTOs
public class EscalationActionRequest
{
    public string Action { get; set; } = string.Empty; // "warning" or "resolve"
    public string? Remarks { get; set; }
}

public class BudgetReviewRequest
{
    public bool Approved { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public string? Remarks { get; set; }
}

public class MarkReviewRequest
{
    public bool Approved { get; set; }
    public string? Remarks { get; set; }
}

