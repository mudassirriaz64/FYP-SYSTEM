using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/coordinator")]
[Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
public class CoordinatorDocumentController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CoordinatorDocumentController(ApplicationDbContext context)
    {
        _context = context;
    }

    private async Task<Staff?> GetCurrentCoordinator()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return null;

        var userId = int.Parse(userIdClaim.Value);
        return await _context.Staff
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsFYPCoordinator);
    }

    /// <summary>
    /// Get all document submission controls with stats
    /// </summary>
    [HttpGet("documents/controls")]
    public async Task<IActionResult> GetDocumentControls()
    {
        var controls = await _context.DocumentSubmissionControls
            .Include(c => c.UnlockedBy)
            .OrderBy(c => c.DocumentType)
            .ToListAsync();

        var totalGroups = await _context.FYPGroups.CountAsync();

        var result = controls.Select(c => new
        {
            c.Id,
            c.DocumentType,
            c.IsUnlocked,
            c.UnlockedAt,
            UnlockedBy = c.UnlockedBy?.FullName,
            c.DeadlineDate,
            c.Phase,
            TotalGroups = totalGroups,
            SubmittedCount = GetSubmissionCount(c.DocumentType),
            PendingApprovalCount = GetPendingApprovalCount(c.DocumentType)
        }).ToList();

        return Ok(new { controls = result });
    }

    /// <summary>
    /// Unlock a document type for all students
    /// </summary>
    [HttpPost("documents/unlock/{documentType}")]
    public async Task<IActionResult> UnlockDocument(
        string documentType,
        [FromBody] UnlockDocumentRequest? request = null)
    {
        var coordinator = await GetCurrentCoordinator();
        if (coordinator == null)
            return Unauthorized(new { message = "Coordinator not found" });

        var control = await _context.DocumentSubmissionControls
            .FirstOrDefaultAsync(c => c.DocumentType == documentType);

        // Enforce deadline requirement when unlocking
        if (request == null || !request.DeadlineDate.HasValue)
        {
            return BadRequest(new { message = "Deadline date is required when unlocking a document." });
        }

        if (control == null)
        {
            // Create new control
            control = new DocumentSubmissionControl
            {
                DocumentType = documentType,
                IsUnlocked = true,
                UnlockedAt = DateTime.UtcNow,
                UnlockedById = coordinator.Id,
                DeadlineDate = request!.DeadlineDate,
                UnlockMessage = request?.Message,
                Instructions = request?.Instructions,
                Phase = request?.Phase
            };
            _context.DocumentSubmissionControls.Add(control);
        }
        else
        {
            // Update existing control
            control.IsUnlocked = true;
            control.UnlockedAt = DateTime.UtcNow;
            control.UnlockedById = coordinator.Id;
            control.DeadlineDate = request!.DeadlineDate;
            control.UnlockMessage = request?.Message;
            control.Instructions = request?.Instructions;
            control.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Create notification for all students
        await CreateDocumentUnlockNotification(documentType, request?.Message);

        return Ok(new { message = $"{documentType} unlocked successfully" });
    }

    /// <summary>
    /// Lock a document type
    /// </summary>
    [HttpPost("documents/lock/{documentType}")]
    public async Task<IActionResult> LockDocument(string documentType)
    {
        var coordinator = await GetCurrentCoordinator();
        if (coordinator == null)
            return Unauthorized(new { message = "Coordinator not found" });

        var control = await _context.DocumentSubmissionControls
            .FirstOrDefaultAsync(c => c.DocumentType == documentType);

        if (control == null)
            return NotFound(new { message = "Document control not found" });

        control.IsUnlocked = false;
        control.LockedAt = DateTime.UtcNow;
        control.LockedById = coordinator.Id;
        control.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = $"{documentType} locked successfully" });
    }

    /// <summary>
    /// Get monthly report submissions for a specific month
    /// </summary>
    [HttpGet("monthly-reports/{monthNumber}/submissions")]
    public async Task<IActionResult> GetMonthlyReportSubmissions(int monthNumber)
    {
        if (monthNumber < 1 || monthNumber > 8)
            return BadRequest(new { message = "Month number must be between 1 and 8" });

        var reports = await _context.MonthlyReports
            .Where(r => r.MonthNumber == monthNumber)
            .Include(r => r.Group)
                .ThenInclude(g => g!.Supervisor)
            .Include(r => r.Group)
                .ThenInclude(g => g!.Members)
                    .ThenInclude(m => m.Student)
            .Include(r => r.GradedBy)
            .OrderBy(r => r.Group!.GroupName)
            .Select(r => new
            {
                r.Id,
                GroupId = r.Group!.Id,
                GroupName = r.Group.GroupName,
                ProjectTitle = r.Group.ProjectTitle,
                SupervisorName = r.Group.Supervisor!.FullName,
                Members = r.Group.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Select(m => new
                    {
                        m.Student!.FullName,
                        m.Student.EnrollmentId
                    }).ToList(),
                r.MonthNumber,
                r.WeeklyMeetingsCompleted,
                r.CanSubmit,
                r.Status,
                r.SubmittedAt,
                r.SupervisorMarks,
                r.SupervisorRemarks,
                GradedBy = r.GradedBy!.FullName,
                r.GradedAt,
                r.ProgressPercentage,
                r.Summary
            })
            .ToListAsync();

        // Group by status
        var summary = new
        {
            TotalGroups = await _context.FYPGroups.CountAsync(),
            Submitted = reports.Count(r => r.Status == ReportStatuses.SubmittedBySupervisor || r.Status == ReportStatuses.FinalizedByCoordinator),
            Finalized = reports.Count(r => r.Status == ReportStatuses.FinalizedByCoordinator),
            Pending = reports.Count(r => r.Status == ReportStatuses.Pending),
            Late = reports.Count(r => r.Status == ReportStatuses.Late),
            Missing = reports.Count(r => r.Status == ReportStatuses.Missing)
        };

        return Ok(new { reports, summary });
    }

    /// <summary>
    /// Unlock specific monthly report (1-8)
    /// </summary>
    [HttpPost("documents/unlock-monthly-report/{monthNumber}")]
    public async Task<IActionResult> UnlockMonthlyReport(
        int monthNumber,
        [FromBody] UnlockDocumentRequest? request = null)
    {
        if (monthNumber < 1 || monthNumber > 8)
            return BadRequest(new { message = "Month number must be between 1 and 8" });

        var documentType = $"MonthlyReport{monthNumber}";
        return await UnlockDocument(documentType, request);
    }

    /// <summary>
    /// Finalize monthly report (coordinator final approval)
    /// </summary>
    [HttpPost("monthly-reports/{reportId}/finalize")]
    public async Task<IActionResult> FinalizeMonthlyReport(
        int reportId,
        [FromBody] FinalizeReportRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var coordinator = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);

        if (coordinator == null)
            return Unauthorized(new { message = "Coordinator not found" });

        var report = await _context.MonthlyReports
            .Include(r => r.Group)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
            return NotFound(new { message = "Report not found" });

        if (report.Status != ReportStatuses.SubmittedBySupervisor)
            return BadRequest(new { message = "Report must be submitted by supervisor first" });

        report.IsFinalized = true;
        report.FinalizedById = coordinator.Id;
        report.FinalizedAt = DateTime.UtcNow;
        report.CoordinatorRemarks = request.Remarks;
        report.Status = ReportStatuses.FinalizedByCoordinator;
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Monthly report finalized successfully" });
    }

    // Helper methods
    private int GetSubmissionCount(string documentType)
    {
        if (documentType.StartsWith("MonthlyReport"))
        {
            var monthNumber = int.Parse(documentType.Replace("MonthlyReport", ""));
            return _context.MonthlyReports
                .Count(r => r.MonthNumber == monthNumber &&
                           (r.Status == ReportStatuses.SubmittedBySupervisor || r.Status == ReportStatuses.FinalizedByCoordinator));
        }

        return _context.StudentDocuments
            .Count(d => d.DocumentType == documentType);
    }

    private int GetPendingApprovalCount(string documentType)
    {
        if (documentType.StartsWith("MonthlyReport"))
        {
            var monthNumber = int.Parse(documentType.Replace("MonthlyReport", ""));
            return _context.MonthlyReports
                .Count(r => r.MonthNumber == monthNumber && r.Status == ReportStatuses.SubmittedBySupervisor);
        }

        return _context.StudentDocuments
            .Count(d => d.DocumentType == documentType &&
                       d.WorkflowStatus == WorkflowStatuses.SupervisorReviewed);
    }

    private async Task CreateDocumentUnlockNotification(string documentType, string? message)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        int? creatorId = userIdClaim != null ? int.Parse(userIdClaim.Value) : null;

        // Determine target audience based on document type
        // Monthly reports are submitted by supervisors, not students
        bool isMonthlyReport = documentType.StartsWith("MonthlyReport");
        string targetAudience = isMonthlyReport ? "Supervisors" : "Students";
        string messageText = isMonthlyReport
            ? (message ?? $"Monthly report {documentType.Replace("MonthlyReport", "")} is now open for submission")
            : (message ?? $"You can now submit {documentType}");

        var notification = new Notification
        {
            Title = $"{documentType} Now Available",
            Message = messageText,
            Type = NotificationTypes.DocumentSubmission,
            TargetAudience = targetAudience,
            RelatedFormType = documentType,
            Priority = 1, // Important
            IsActive = true,
            CreatedById = creatorId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();
    }
}

// Request DTOs
public class UnlockDocumentRequest
{
    public string DocumentType { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public DateTime? DeadlineDate { get; set; }
    public string? Message { get; set; }
    public string? Instructions { get; set; }
    public string? Phase { get; set; }
    public int? Semester { get; set; }
    public bool NotifyStudents { get; set; } = true;
}

public class FinalizeReportRequest
{
    public string? Remarks { get; set; }
}
