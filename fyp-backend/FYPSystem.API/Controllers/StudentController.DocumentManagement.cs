using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Text.Json;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/student-docs")]
[Authorize(Roles = "Student")]
public class StudentDocumentController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StudentDocumentController(ApplicationDbContext context)
    {
        _context = context;
    }

    private async Task<Student?> GetCurrentStudent()
    {
        var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (studentIdClaim == null) return null;

        // JWT contains Student.Id directly for student logins
        var studentId = int.Parse(studentIdClaim.Value);
        return await _context.Students
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => s.Id == studentId);
    }

    /// <summary>
    /// Get available documents for student
    /// </summary>
    [HttpGet("documents/available")]
    public async Task<IActionResult> GetAvailableDocuments()
    {
        var student = await GetCurrentStudent();
        if (student == null)
            return Unauthorized(new { message = "Student not found" });

        var group = await _context.GroupMembers
            .Include(m => m.Group)
            .Where(m => m.StudentId == student.Id && m.Status == MemberStatuses.Accepted)
            .Select(m => m.Group)
            .FirstOrDefaultAsync();

        if (group == null)
            return Ok(new { documents = new List<object>(), message = "Not part of any FYP group" });

        // Get only unlocked document controls for this department and not past deadline
        var nowUtc = DateTime.UtcNow;
        var controls = await _context.DocumentSubmissionControls
            .Where(c => c.IsUnlocked &&
                       c.DeadlineDate.HasValue && c.DeadlineDate >= nowUtc &&
                       (c.DepartmentId == null || c.DepartmentId == student.DepartmentId))
            .ToListAsync();

        var documents = new List<object>();

        foreach (var control in controls)
        {
            var doc = new
            {
                Type = control.DocumentType,
                Name = GetDocumentName(control.DocumentType),
                Description = GetDocumentDescription(control.DocumentType),
                IsUnlocked = control.IsUnlocked,
                DeadlineDate = control.DeadlineDate,
                Instructions = control.Instructions,
                RequiresSupervisorApproval = IsMonthlyReport(control.DocumentType),
                IsSubmitted = await IsDocumentSubmitted(student.Id, group.Id, control.DocumentType),
                SubmissionStatus = await GetDocumentSubmissionStatus(student.Id, group.Id, control.DocumentType)
            };
            documents.Add(doc);
        }

        return Ok(new { documents });
    }

    /// <summary>
    /// Get monthly report status with attendance
    /// </summary>
    [HttpGet("monthly-reports/{monthNumber}/status")]
    public async Task<IActionResult> GetMonthlyReportStatus(int monthNumber)
    {
        if (monthNumber < 1 || monthNumber > 8)
            return BadRequest(new { message = "Month number must be between 1 and 8" });

        var student = await GetCurrentStudent();
        if (student == null)
            return Unauthorized(new { message = "Student not found" });

        var group = await _context.GroupMembers
            .Include(m => m.Group)
            .Where(m => m.StudentId == student.Id && m.Status == MemberStatuses.Accepted)
            .Select(m => m.Group)
            .FirstOrDefaultAsync();

        if (group == null)
            return NotFound(new { message = "Not part of any FYP group" });

        // Check if document is unlocked
        var documentType = $"MonthlyReport{monthNumber}";
        var control = await _context.DocumentSubmissionControls
            .FirstOrDefaultAsync(c => c.DocumentType == documentType);

        var isUnlocked = control?.IsUnlocked ?? false;

        // Get meeting history
        var meetings = await _context.SupervisorMeetings
            .Where(m => m.GroupId == group.Id && m.MonthNumber == monthNumber)
            .OrderBy(m => m.WeekNumber)
            .Select(m => new
            {
                m.WeekNumber,
                m.MeetingDate,
                m.TopicsDiscussed,
                m.Agenda,
                StudentAttended = JsonSerializer.Deserialize<List<int>>(m.StudentAttendance)!.Contains(student.Id)
            })
            .ToListAsync();

        var weeklyMeetingsCompleted = meetings.Count;
        var canSubmit = weeklyMeetingsCompleted >= 4;

        // Get existing report if any
        var report = await _context.MonthlyReports
            .FirstOrDefaultAsync(r => r.GroupId == group.Id &&
                                     r.StudentId == student.Id &&
                                     r.MonthNumber == monthNumber);

        return Ok(new
        {
            monthNumber,
            isUnlocked,
            weeklyMeetingsCompleted,
            requiredMeetings = 4,
            canSubmit,
            meetings,
            report = report != null ? new
            {
                report.Id,
                report.Status,
                report.SubmittedAt,
                report.SupervisorMarks,
                report.SupervisorRemarks,
                report.GradedAt
            } : null,
            deadlineDate = control?.DeadlineDate
        });
    }

    /// <summary>
    /// Submit monthly report
    /// </summary>
    [HttpPost("monthly-reports/{monthNumber}/submit")]
    public async Task<IActionResult> SubmitMonthlyReport(
        int monthNumber,
        [FromBody] SubmitMonthlyReportRequest request)
    {
        if (monthNumber < 1 || monthNumber > 8)
            return BadRequest(new { message = "Month number must be between 1 and 8" });

        var student = await GetCurrentStudent();
        if (student == null)
            return Unauthorized(new { message = "Student not found" });

        var group = await _context.GroupMembers
            .Include(m => m.Group)
            .Where(m => m.StudentId == student.Id && m.Status == MemberStatuses.Accepted)
            .Select(m => m.Group)
            .FirstOrDefaultAsync();

        if (group == null)
            return NotFound(new { message = "Not part of any FYP group" });

        // Check if document is unlocked
        var documentType = $"MonthlyReport{monthNumber}";
        var control = await _context.DocumentSubmissionControls
            .FirstOrDefaultAsync(c => c.DocumentType == documentType);

        if (control == null || !control.IsUnlocked)
            return BadRequest(new { message = "Monthly report is not unlocked yet" });

        // Check if 4 meetings completed
        var meetingCount = await _context.SupervisorMeetings
            .CountAsync(m => m.GroupId == group.Id && m.MonthNumber == monthNumber);

        if (meetingCount < 4)
            return BadRequest(new { message = "Cannot submit - 4 weekly meetings not completed" });

        // Check if report already exists
        var existingReport = await _context.MonthlyReports
            .FirstOrDefaultAsync(r => r.GroupId == group.Id &&
                                     r.StudentId == student.Id &&
                                     r.MonthNumber == monthNumber);

        if (existingReport != null)
        {
            // Update existing report
            existingReport.Summary = request.Summary;
            existingReport.ChallengesFaced = request.ChallengesFaced;
            existingReport.NextMonthPlan = request.NextMonthPlan;
            existingReport.ProgressPercentage = request.ProgressPercentage;
            existingReport.ReportFilePath = request.ReportFilePath;
            existingReport.Status = ReportStatuses.Pending;
            existingReport.UpdatedAt = DateTime.UtcNow;
            existingReport.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Create new report
            var report = new MonthlyReport
            {
                GroupId = group.Id,
                StudentId = student.Id,
                MonthNumber = monthNumber,
                Month = DateTime.UtcNow.Month,
                Year = DateTime.UtcNow.Year,
                WeeklyMeetingsCompleted = meetingCount,
                CanSubmit = true,
                Summary = request.Summary,
                ChallengesFaced = request.ChallengesFaced,
                NextMonthPlan = request.NextMonthPlan,
                ProgressPercentage = request.ProgressPercentage,
                ReportFilePath = request.ReportFilePath,
                Status = ReportStatuses.Pending,
                DueDate = control.DeadlineDate ?? DateTime.UtcNow.AddDays(30)
            };
            _context.MonthlyReports.Add(report);
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Monthly report submitted successfully" });
    }

    // Helper methods
    private string GetDocumentName(string documentType)
    {
        if (documentType.StartsWith("MonthlyReport"))
        {
            var monthNumber = documentType.Replace("MonthlyReport", "");
            return $"Monthly Report {monthNumber}";
        }

        return documentType switch
        {
            "SRS" => "Software Requirement Specification (SRS)",
            "SDS" => "System Design Specification (SDS)",
            "FinalReport" => "Final Report",
            "Proposal" => "Project Proposal",
            "Documentation" => "Technical Documentation",
            _ => documentType
        };
    }

    private string GetDocumentDescription(string documentType)
    {
        return documentType switch
        {
            "SRS" => "Complete software requirements and specifications document",
            "SDS" => "System architecture and design document",
            "FinalReport" => "Final project report and documentation",
            "Proposal" => "Project proposal and objectives",
            "Documentation" => "Technical documentation and user manuals",
            var s when s.StartsWith("MonthlyReport") => "Monthly Progress Report (Requires 4 weekly supervisor meetings)",
            _ => ""
        };
    }

    private bool IsMonthlyReport(string documentType)
    {
        return documentType.StartsWith("MonthlyReport");
    }

    private async Task<bool> IsDocumentSubmitted(int studentId, int groupId, string documentType)
    {
        if (IsMonthlyReport(documentType))
        {
            var monthNumber = int.Parse(documentType.Replace("MonthlyReport", ""));
            return await _context.MonthlyReports
                .AnyAsync(r => r.StudentId == studentId &&
                              r.GroupId == groupId &&
                              r.MonthNumber == monthNumber &&
                              r.Status != ReportStatuses.Pending);
        }

        return await _context.StudentDocuments
            .AnyAsync(d => d.StudentId == studentId &&
                          d.GroupId == groupId &&
                          d.DocumentType == documentType);
    }

    private async Task<string> GetDocumentSubmissionStatus(int studentId, int groupId, string documentType)
    {
        if (IsMonthlyReport(documentType))
        {
            var monthNumber = int.Parse(documentType.Replace("MonthlyReport", ""));
            var report = await _context.MonthlyReports
                .FirstOrDefaultAsync(r => r.StudentId == studentId &&
                                         r.GroupId == groupId &&
                                         r.MonthNumber == monthNumber);
            return report?.Status ?? "Not Submitted";
        }

        var doc = await _context.StudentDocuments
            .FirstOrDefaultAsync(d => d.StudentId == studentId &&
                                     d.GroupId == groupId &&
                                     d.DocumentType == documentType);
        return doc?.Status ?? "Not Submitted";
    }
}

// Request DTOs
public class SubmitMonthlyReportRequest
{
    public string? Summary { get; set; }
    public string? ChallengesFaced { get; set; }
    public string? NextMonthPlan { get; set; }
    public int? ProgressPercentage { get; set; }
    public string? ReportFilePath { get; set; }
}
