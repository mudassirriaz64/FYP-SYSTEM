using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Text.Json;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Supervisor")]
public class SupervisorMeetingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SupervisorMeetingController> _logger;

    public SupervisorMeetingController(
        ApplicationDbContext context,
        ILogger<SupervisorMeetingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private async Task<Staff?> GetCurrentSupervisor()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
            return null;

        return await _context.Staff
            .FirstOrDefaultAsync(s => s.Username == username);
    }

    /// <summary>
    /// Mark weekly meeting attendance for a group
    /// </summary>
    [HttpPost("mark-attendance")]
    public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceRequest request)
    {
        var supervisor = await GetCurrentSupervisor();
        if (supervisor == null)
            return Unauthorized(new { message = "Supervisor not found" });

        // Verify supervisor owns this group
        var group = await _context.FYPGroups
            .FirstOrDefaultAsync(g => g.Id == request.GroupId && g.SupervisorId == supervisor.Id);

        if (group == null)
            return NotFound(new { message = "Group not found or you are not the supervisor" });

        // Check if meeting already exists
        var existingMeeting = await _context.SupervisorMeetings
            .FirstOrDefaultAsync(m =>
                m.GroupId == request.GroupId &&
                m.MonthNumber == request.MonthNumber &&
                m.WeekNumber == request.WeekNumber);

        if (existingMeeting != null)
        {
            // Update existing meeting
            existingMeeting.MeetingDate = request.MeetingDate;
            existingMeeting.TopicsDiscussed = request.TopicsDiscussed;
            existingMeeting.SupervisorNotes = request.SupervisorNotes;
            existingMeeting.Agenda = request.Agenda;
            existingMeeting.StudentAttendance = JsonSerializer.Serialize(request.StudentAttendance);
            existingMeeting.StudentNotes = request.StudentNotes != null
                ? JsonSerializer.Serialize(request.StudentNotes)
                : null;
            existingMeeting.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Create new meeting
            var meeting = new SupervisorMeeting
            {
                GroupId = request.GroupId,
                SupervisorId = supervisor.Id,
                MonthNumber = request.MonthNumber,
                WeekNumber = request.WeekNumber,
                MeetingDate = request.MeetingDate,
                TopicsDiscussed = request.TopicsDiscussed,
                SupervisorNotes = request.SupervisorNotes,
                Agenda = request.Agenda,
                StudentAttendance = JsonSerializer.Serialize(request.StudentAttendance),
                StudentNotes = request.StudentNotes != null
                    ? JsonSerializer.Serialize(request.StudentNotes)
                    : null
            };

            _context.SupervisorMeetings.Add(meeting);
        }

        // Update monthly report attendance count
        await UpdateMonthlyReportAttendance(request.GroupId, request.MonthNumber);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Attendance marked successfully" });
    }

    /// <summary>
    /// Get meeting history for a group
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetMeetingHistory(
        [FromQuery] int groupId,
        [FromQuery] int? monthNumber = null)
    {
        var supervisor = await GetCurrentSupervisor();
        if (supervisor == null)
            return Unauthorized(new { message = "Supervisor not found" });

        // Verify supervisor owns this group
        var group = await _context.FYPGroups
            .FirstOrDefaultAsync(g => g.Id == groupId && g.SupervisorId == supervisor.Id);

        if (group == null)
            return NotFound(new { message = "Group not found or you are not the supervisor" });

        var query = _context.SupervisorMeetings
            .Where(m => m.GroupId == groupId);

        if (monthNumber.HasValue)
        {
            query = query.Where(m => m.MonthNumber == monthNumber.Value);
        }

        var meetings = await query
            .OrderBy(m => m.MonthNumber)
            .ThenBy(m => m.WeekNumber)
            .Select(m => new
            {
                m.Id,
                m.MonthNumber,
                m.WeekNumber,
                m.MeetingDate,
                m.TopicsDiscussed,
                m.SupervisorNotes,
                m.Agenda,
                StudentAttendance = JsonSerializer.Deserialize<List<int>>(m.StudentAttendance),
                StudentNotes = m.StudentNotes != null
                    ? JsonSerializer.Deserialize<Dictionary<string, string>>(m.StudentNotes)
                    : null,
                m.MarkedAt
            })
            .ToListAsync();

        return Ok(new { meetings });
    }

    /// <summary>
    /// Get my supervised groups with meeting completion status
    /// </summary>
    [HttpGet("my-groups")]
    public async Task<IActionResult> GetMyGroups()
    {
        var supervisor = await GetCurrentSupervisor();
        if (supervisor == null)
            return Unauthorized(new { message = "Supervisor not found" });

        var groups = await _context.FYPGroups
            .Where(g => g.SupervisorId == supervisor.Id)
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .ToListAsync();

        // Get all meetings for these groups
        var groupIds = groups.Select(g => g.Id).ToList();
        var meetings = await _context.SupervisorMeetings
            .Where(m => groupIds.Contains(m.GroupId))
            .ToListAsync();

        var result = groups.Select(g => new
        {
            g.Id,
            g.GroupName,
            g.ProjectTitle,
            Members = g.Members
                .Where(m => m.Status == MemberStatuses.Accepted)
                .Select(m => new
                {
                    Id = m.Student!.Id,
                    m.Student.FullName,
                    m.Student.EnrollmentId
                }).ToList(),
            MonthlyProgress = Enumerable.Range(1, 8).Select(month =>
            {
                var meetingsCompleted = meetings.Count(m => m.GroupId == g.Id && m.MonthNumber == month);
                return new
                {
                    MonthNumber = month,
                    MeetingsCompleted = meetingsCompleted,
                    CanSubmitReport = meetingsCompleted >= 4
                };
            }).ToList()
        }).ToList();

        return Ok(new { groups = result });
    }

    /// <summary>
    /// Approve monthly report
    /// </summary>
    [HttpPost("monthly-reports/{reportId}/approve")]
    public async Task<IActionResult> ApproveMonthlyReport(
        int reportId,
        [FromBody] ApproveReportRequest request)
    {
        var supervisor = await GetCurrentSupervisor();
        if (supervisor == null)
            return Unauthorized(new { message = "Supervisor not found" });

        var report = await _context.MonthlyReports
            .Include(r => r.Group)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
            return NotFound(new { message = "Report not found" });

        if (report.Group!.SupervisorId != supervisor.Id)
            return Forbid();

        if (!report.CanSubmit)
            return BadRequest(new { message = "Report cannot be approved - 4 weekly meetings not completed" });

        report.SupervisorMarks = request.Marks;
        report.SupervisorRemarks = request.Remarks;
        report.GradedById = supervisor.Id;
        report.GradedAt = DateTime.UtcNow;
        report.Status = ReportStatuses.SubmittedBySupervisor;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Report approved successfully" });
    }

    /// <summary>
    /// Upload/Submit monthly report as supervisor
    /// </summary>
    [HttpPost("monthly-reports/upload")]
    public async Task<IActionResult> UploadMonthlyReport([FromBody] UploadMonthlyReportRequest request)
    {
        var supervisor = await GetCurrentSupervisor();
        if (supervisor == null)
            return Unauthorized(new { message = "Supervisor not found" });

        // Verify supervisor owns this group
        var group = await _context.FYPGroups
            .FirstOrDefaultAsync(g => g.Id == request.GroupId && g.SupervisorId == supervisor.Id);

        if (group == null)
            return NotFound(new { message = "Group not found or you are not the supervisor" });

        // Check if 4 meetings are completed
        var meetingCount = await _context.SupervisorMeetings
            .CountAsync(m => m.GroupId == request.GroupId && m.MonthNumber == request.MonthNumber);

        if (meetingCount < 4)
            return BadRequest(new { message = $"Cannot submit report - only {meetingCount}/4 meetings completed" });

        // Check if report already exists
        var existingReport = await _context.MonthlyReports
            .FirstOrDefaultAsync(r => r.GroupId == request.GroupId && r.MonthNumber == request.MonthNumber);

        if (existingReport != null)
        {
            // Update existing report
            existingReport.Summary = request.Summary;
            existingReport.ChallengesFaced = request.ChallengesFaced;
            existingReport.NextMonthPlan = request.NextMonthPlan;
            existingReport.ProgressPercentage = request.ProgressPercentage;
            existingReport.ReportFilePath = request.ReportFilePath;
            existingReport.Status = ReportStatuses.SubmittedBySupervisor;
            existingReport.SubmittedById = supervisor.Id;
            existingReport.SubmittedAt = DateTime.UtcNow;
            existingReport.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Create new report
            var report = new MonthlyReport
            {
                GroupId = request.GroupId,
                MonthNumber = request.MonthNumber,
                Summary = request.Summary,
                ChallengesFaced = request.ChallengesFaced,
                NextMonthPlan = request.NextMonthPlan,
                ProgressPercentage = request.ProgressPercentage,
                ReportFilePath = request.ReportFilePath,
                Status = ReportStatuses.SubmittedBySupervisor,
                SubmittedById = supervisor.Id,
                SubmittedAt = DateTime.UtcNow,
                WeeklyMeetingsCompleted = meetingCount,
                CanSubmit = true
            };

            _context.MonthlyReports.Add(report);
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Monthly report submitted successfully" });
    }

    private async Task UpdateMonthlyReportAttendance(int groupId, int monthNumber)
    {
        var meetingCount = await _context.SupervisorMeetings
            .CountAsync(m => m.GroupId == groupId && m.MonthNumber == monthNumber);

        var reports = await _context.MonthlyReports
            .Where(r => r.GroupId == groupId && r.MonthNumber == monthNumber)
            .ToListAsync();

        foreach (var report in reports)
        {
            report.WeeklyMeetingsCompleted = meetingCount;
            report.CanSubmit = meetingCount >= 4;
        }
    }
}

// Request DTOs
public class MarkAttendanceRequest
{
    public int GroupId { get; set; }
    public int MonthNumber { get; set; } // 1-8
    public int WeekNumber { get; set; } // 1-4
    public DateTime MeetingDate { get; set; }
    public string? TopicsDiscussed { get; set; }
    public string? SupervisorNotes { get; set; }
    public string? Agenda { get; set; }
    public List<int> StudentAttendance { get; set; } = new(); // List of student IDs who attended
    public Dictionary<string, string>? StudentNotes { get; set; } // Student ID -> Notes
}

public class ApproveReportRequest
{
    public decimal? Marks { get; set; }
    public string? Remarks { get; set; }
}

public class UploadMonthlyReportRequest
{
    public int GroupId { get; set; }
    public int MonthNumber { get; set; } // 1-8
    public string? Summary { get; set; }
    public string? ChallengesFaced { get; set; }
    public string? NextMonthPlan { get; set; }
    public int? ProgressPercentage { get; set; }
    public string? ReportFilePath { get; set; }
}
