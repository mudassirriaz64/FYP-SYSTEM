using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using FYPSystem.API.DTOs;

namespace FYPSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
public class ResultsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ResultsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/results
    [HttpGet]
    public async Task<IActionResult> GetResults([FromQuery] string? status = null)
    {
        var query = _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Include(g => g.Supervisor)
            .Where(g => g.Status == GroupStatuses.Active || g.Status == GroupStatuses.Completed);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(g => g.Status == status);
        }

        var groups = await query.ToListAsync();

        var resultGroups = groups.Select(g => MapToResultsDTO(g)).ToList();

        return Ok(new ResultsListResponse
        {
            Groups = resultGroups,
            TotalCount = resultGroups.Count
        });
    }

    // POST: api/results/compile
    [HttpPost("compile")]
    public async Task<IActionResult> CompileResults()
    {
        var groups = await _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Where(g => g.Status == GroupStatuses.Active || g.Status == GroupStatuses.Completed)
            .ToListAsync();

        foreach (var group in groups)
        {
            foreach (var member in group.Members)
            {
                // Calculate total marks
                var total = (member.ProposalMarks ?? 0) +
                           (member.MidEvalMarks ?? 0) +
                           (member.FinalEvalMarks ?? 0) +
                           (member.SupervisorMarks ?? 0);

                member.TotalMarks = total;
                member.Grade = CalculateGrade(total);
                
                // Auto-determine result based on marks
                if (string.IsNullOrEmpty(member.FinalResult))
                {
                    if (total >= 50)
                    {
                        member.FinalResult = "Approved";
                    }
                    else if (total >= 40)
                    {
                        member.FinalResult = "Deferred";
                    }
                    else if (member.ProposalMarks.HasValue || member.MidEvalMarks.HasValue || member.FinalEvalMarks.HasValue)
                    {
                        member.FinalResult = "Failed";
                    }
                }
                
                member.UpdatedAt = DateTime.UtcNow;
            }

            // Mark group as compiled
            group.ResultsCompiled = true;
            group.ResultsCompiledAt = DateTime.UtcNow;
            group.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Results compiled successfully", groupsProcessed = groups.Count });
    }

    // POST: api/results/publish
    [HttpPost("publish")]
    public async Task<IActionResult> PublishResults()
    {
        var groups = await _context.FYPGroups
            .Include(g => g.Members)
            .Where(g => g.ResultsCompiled && !g.ResultsPublished)
            .ToListAsync();

        if (!groups.Any())
        {
            return BadRequest(new { message = "No compiled results to publish" });
        }

        foreach (var group in groups)
        {
            group.ResultsPublished = true;
            group.ResultsPublishedAt = DateTime.UtcNow;
            group.Status = GroupStatuses.Completed;
            group.CompletedAt = DateTime.UtcNow;
            group.UpdatedAt = DateTime.UtcNow;
        }

        // Create notification
        var notification = new Notification
        {
            Title = "FYP Results Published",
            Message = "Final Year Project results have been published. Please check your results in the portal.",
            Type = NotificationTypes.Announcement,
            TargetAudience = "Students",
            Priority = 2, // Urgent
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return Ok(new { 
            message = "Results published successfully", 
            groupsPublished = groups.Count,
            notificationSent = true
        });
    }

    // PUT: api/results/member/{memberId}
    [HttpPut("member/{memberId}")]
    public async Task<IActionResult> UpdateMemberResult(int memberId, [FromBody] UpdateMemberResultRequest request)
    {
        var member = await _context.GroupMembers.FindAsync(memberId);
        if (member == null)
        {
            return NotFound(new { message = "Member not found" });
        }

        if (!string.IsNullOrEmpty(request.FinalResult))
        {
            member.FinalResult = request.FinalResult;
        }
        if (request.ProposalMarks.HasValue)
        {
            member.ProposalMarks = request.ProposalMarks.Value;
        }
        if (request.MidEvalMarks.HasValue)
        {
            member.MidEvalMarks = request.MidEvalMarks.Value;
        }
        if (request.FinalEvalMarks.HasValue)
        {
            member.FinalEvalMarks = request.FinalEvalMarks.Value;
        }
        if (request.SupervisorMarks.HasValue)
        {
            member.SupervisorMarks = request.SupervisorMarks.Value;
        }

        // Recalculate total and grade
        var total = (member.ProposalMarks ?? 0) +
                   (member.MidEvalMarks ?? 0) +
                   (member.FinalEvalMarks ?? 0) +
                   (member.SupervisorMarks ?? 0);

        member.TotalMarks = total;
        member.Grade = CalculateGrade(total);
        member.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Result updated successfully" });
    }

    // GET: api/results/export
    [HttpGet("export")]
    public async Task<IActionResult> ExportResults()
    {
        var groups = await _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Include(g => g.Supervisor)
            .Include(g => g.Department)
            .Where(g => g.ResultsCompiled)
            .ToListAsync();

        // Create Excel file using ClosedXML
        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var worksheet = workbook.Worksheets.Add("FYP Results");

        // Headers
        var headers = new[] { 
            "Group", "Project Title", "Department", "Supervisor",
            "Student Name", "Enrollment ID", "Proposal", "Mid-Term", "Final", "Supervisor", 
            "Total", "Grade", "Result"
        };
        
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightBlue;
        }

        // Data
        int row = 2;
        foreach (var group in groups)
        {
            foreach (var member in group.Members)
            {
                worksheet.Cell(row, 1).Value = group.GroupName;
                worksheet.Cell(row, 2).Value = group.ProjectTitle;
                worksheet.Cell(row, 3).Value = group.Department?.Name;
                worksheet.Cell(row, 4).Value = group.Supervisor?.FullName;
                worksheet.Cell(row, 5).Value = member.Student?.FullName;
                worksheet.Cell(row, 6).Value = member.Student?.EnrollmentId;
                worksheet.Cell(row, 7).Value = member.ProposalMarks;
                worksheet.Cell(row, 8).Value = member.MidEvalMarks;
                worksheet.Cell(row, 9).Value = member.FinalEvalMarks;
                worksheet.Cell(row, 10).Value = member.SupervisorMarks;
                worksheet.Cell(row, 11).Value = member.TotalMarks;
                worksheet.Cell(row, 12).Value = member.Grade;
                worksheet.Cell(row, 13).Value = member.FinalResult;
                row++;
            }
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"FYP_Results_{DateTime.Now:yyyyMMdd}.xlsx"
        );
    }

    private static string CalculateGrade(decimal total)
    {
        return total switch
        {
            >= 85 => "A",
            >= 80 => "A-",
            >= 75 => "B+",
            >= 70 => "B",
            >= 65 => "B-",
            >= 60 => "C+",
            >= 55 => "C",
            >= 50 => "C-",
            >= 45 => "D",
            _ => "F"
        };
    }

    private static ResultsGroupDTO MapToResultsDTO(FYPGroup group)
    {
        var members = group.Members.Select(m => new ResultsMemberDTO
        {
            Id = m.Id,
            StudentId = m.StudentId,
            StudentName = m.Student?.FullName ?? "",
            EnrollmentId = m.Student?.EnrollmentId ?? "",
            ProposalMarks = m.ProposalMarks,
            MidEvalMarks = m.MidEvalMarks,
            FinalEvalMarks = m.FinalEvalMarks,
            SupervisorMarks = m.SupervisorMarks,
            TotalMarks = m.TotalMarks,
            Grade = m.Grade,
            FinalResult = m.FinalResult
        }).ToList();

        var validMembers = members.Where(m => m.TotalMarks.HasValue && m.TotalMarks > 0).ToList();

        return new ResultsGroupDTO
        {
            Id = group.Id,
            GroupName = group.GroupName,
            ProjectTitle = group.ProjectTitle,
            MemberCount = members.Count,
            Status = group.Status,
            IsCompiled = group.ResultsCompiled,
            IsPublished = group.ResultsPublished,
            AvgProposalMarks = validMembers.Any() ? validMembers.Average(m => m.ProposalMarks ?? 0) : null,
            AvgMidEvalMarks = validMembers.Any() ? validMembers.Average(m => m.MidEvalMarks ?? 0) : null,
            AvgFinalEvalMarks = validMembers.Any() ? validMembers.Average(m => m.FinalEvalMarks ?? 0) : null,
            AvgSupervisorMarks = validMembers.Any() ? validMembers.Average(m => m.SupervisorMarks ?? 0) : null,
            AvgTotalMarks = validMembers.Any() ? validMembers.Average(m => m.TotalMarks ?? 0) : null,
            Members = members
        };
    }
}

