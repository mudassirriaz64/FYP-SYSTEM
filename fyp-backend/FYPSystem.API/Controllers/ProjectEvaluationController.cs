using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProjectEvaluationController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProjectEvaluationController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/projectevaluation/{groupId}
    [HttpGet("{groupId}")]
    public async Task<IActionResult> GetProjectEvaluation(int groupId)
    {
        var evaluation = await _context.ProjectEvaluations
            .Include(pe => pe.Group)
            .Include(pe => pe.CoordinatorEvaluatedBy)
            .Include(pe => pe.SupervisorEvaluatedBy)
            .Include(pe => pe.InitialDefense)
            .Include(pe => pe.MidDefense)
            .Include(pe => pe.FinalDefense)
            .FirstOrDefaultAsync(pe => pe.GroupId == groupId);

        if (evaluation == null)
        {
            // Create a new evaluation record if it doesn't exist
            evaluation = new ProjectEvaluation
            {
                GroupId = groupId,
                CreatedAt = DateTime.UtcNow
            };
            _context.ProjectEvaluations.Add(evaluation);
            await _context.SaveChangesAsync();

            // Reload with relationships
            evaluation = await _context.ProjectEvaluations
                .Include(pe => pe.Group)
                .Include(pe => pe.CoordinatorEvaluatedBy)
                .Include(pe => pe.SupervisorEvaluatedBy)
                .Include(pe => pe.InitialDefense)
                .Include(pe => pe.MidDefense)
                .Include(pe => pe.FinalDefense)
                .FirstOrDefaultAsync(pe => pe.Id == evaluation.Id);
        }

        return Ok(MapToDTO(evaluation!));
    }

    // GET: api/projectevaluation/all
    [HttpGet("all")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator,HOD")]
    public async Task<IActionResult> GetAllProjectEvaluations([FromQuery] int? departmentId = null)
    {
        var query = _context.ProjectEvaluations
            .Include(pe => pe.Group)
            .Include(pe => pe.CoordinatorEvaluatedBy)
            .Include(pe => pe.SupervisorEvaluatedBy)
            .AsQueryable();

        if (departmentId.HasValue)
        {
            query = query.Where(pe => pe.Group!.DepartmentId == departmentId.Value);
        }

        var evaluations = await query
            .OrderByDescending(pe => pe.TotalMarks)
            .Select(pe => MapToDTO(pe))
            .ToListAsync();

        return Ok(new { evaluations, totalCount = evaluations.Count });
    }

    // POST: api/projectevaluation/{groupId}/coordinator-marks
    [HttpPost("{groupId}/coordinator-marks")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<IActionResult> AssignCoordinatorMarks(int groupId, [FromBody] AssignCoordinatorMarksRequest request)
    {
        if (request.Marks < 0 || request.Marks > 10)
        {
            return BadRequest(new { message = "Coordinator timeline marks must be between 0 and 10" });
        }

        var evaluation = await GetOrCreateEvaluation(groupId);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        var userId = userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;

        evaluation.CoordinatorTimelineMarks = request.Marks;
        evaluation.CoordinatorEvaluatedById = userId;
        evaluation.CoordinatorEvaluatedAt = DateTime.UtcNow;
        evaluation.CoordinatorRemarks = request.Remarks;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await RecalculateTotalMarks(evaluation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Coordinator marks assigned successfully", evaluation = MapToDTO(evaluation) });
    }

    // POST: api/projectevaluation/{groupId}/supervisor-marks
    [HttpPost("{groupId}/supervisor-marks")]
    [Authorize(Roles = "SuperAdmin,Admin,Supervisor,Faculty")]
    public async Task<IActionResult> AssignSupervisorMarks(int groupId, [FromBody] AssignSupervisorMarksRequest request)
    {
        if (request.Marks < 0 || request.Marks > 30)
        {
            return BadRequest(new { message = "Supervisor progress marks must be between 0 and 30" });
        }

        var evaluation = await GetOrCreateEvaluation(groupId);

        // Verify the user is the supervisor of this group
        var group = await _context.FYPGroups.FindAsync(groupId);
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        var userId = userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;

        // Allow if user is supervisor or admin/coordinator
        var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("Admin") ||
                      User.IsInRole("FYPCoordinator") || User.IsInRole("Coordinator");
        var isSupervisor = group?.SupervisorId == userId;

        if (!isAdmin && !isSupervisor)
        {
            return Forbid();
        }

        evaluation.SupervisorProgressMarks = request.Marks;
        evaluation.SupervisorEvaluatedById = userId;
        evaluation.SupervisorEvaluatedAt = DateTime.UtcNow;
        evaluation.SupervisorRemarks = request.Remarks;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await RecalculateTotalMarks(evaluation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Supervisor marks assigned successfully", evaluation = MapToDTO(evaluation) });
    }

    // POST: api/projectevaluation/{groupId}/calculate
    [HttpPost("{groupId}/calculate")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<IActionResult> CalculateProjectEvaluation(int groupId)
    {
        var evaluation = await GetOrCreateEvaluation(groupId);

        // Link defense marks to evaluation
        await LinkDefenseMarks(evaluation);

        // Recalculate totals
        await RecalculateTotalMarks(evaluation);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Project evaluation calculated successfully",
            evaluation = MapToDTO(evaluation)
        });
    }

    // POST: api/projectevaluation/calculate-all
    [HttpPost("calculate-all")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<IActionResult> CalculateAllEvaluations([FromQuery] int? departmentId = null)
    {
        var query = _context.FYPGroups
            .Where(g => g.Status == GroupStatuses.Active || g.Status == GroupStatuses.Completed)
            .AsQueryable();

        if (departmentId.HasValue)
        {
            query = query.Where(g => g.DepartmentId == departmentId.Value);
        }

        var groups = await query.ToListAsync();
        var updatedCount = 0;

        foreach (var group in groups)
        {
            var evaluation = await GetOrCreateEvaluation(group.Id);
            await LinkDefenseMarks(evaluation);
            await RecalculateTotalMarks(evaluation);
            updatedCount++;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Successfully calculated evaluations for {updatedCount} groups",
            totalGroups = updatedCount
        });
    }

    // Helper: Get or create evaluation record
    private async Task<ProjectEvaluation> GetOrCreateEvaluation(int groupId)
    {
        var evaluation = await _context.ProjectEvaluations
            .Include(pe => pe.Group)
            .Include(pe => pe.InitialDefense)
                .ThenInclude(d => d!.Marks)
            .Include(pe => pe.MidDefense)
                .ThenInclude(d => d!.Marks)
            .Include(pe => pe.FinalDefense)
                .ThenInclude(d => d!.Marks)
            .FirstOrDefaultAsync(pe => pe.GroupId == groupId);

        if (evaluation == null)
        {
            evaluation = new ProjectEvaluation
            {
                GroupId = groupId,
                CreatedAt = DateTime.UtcNow
            };
            _context.ProjectEvaluations.Add(evaluation);
            await _context.SaveChangesAsync();

            // Reload with relationships
            evaluation = await _context.ProjectEvaluations
                .Include(pe => pe.Group)
                .Include(pe => pe.InitialDefense)
                    .ThenInclude(d => d!.Marks)
                .Include(pe => pe.MidDefense)
                    .ThenInclude(d => d!.Marks)
                .Include(pe => pe.FinalDefense)
                    .ThenInclude(d => d!.Marks)
                .FirstOrDefaultAsync(pe => pe.Id == evaluation.Id);
        }

        return evaluation!;
    }

    // Helper: Link defense marks to evaluation
    private async Task LinkDefenseMarks(ProjectEvaluation evaluation)
    {
        var groupId = evaluation.GroupId;

        // Find defenses for this group
        var defenses = await _context.Defenses
            .Include(d => d.Marks)
            .Where(d => d.GroupId == groupId && d.Status == DefenseStatuses.Completed)
            .ToListAsync();

        // Link Initial Defense
        var initialDefense = defenses.FirstOrDefault(d => d.Type == DefenseTypes.Initial);
        if (initialDefense != null)
        {
            evaluation.InitialDefenseId = initialDefense.Id;
            evaluation.InitialDefenseMarks = CalculateAverageDefenseMarks(initialDefense.Marks, 15);
        }

        // Link Mid Defense
        var midDefense = defenses.FirstOrDefault(d => d.Type == DefenseTypes.MidTerm);
        if (midDefense != null)
        {
            evaluation.MidDefenseId = midDefense.Id;
            evaluation.MidDefenseMarks = CalculateAverageDefenseMarks(midDefense.Marks, 15);
        }

        // Link Final Defense
        var finalDefense = defenses.FirstOrDefault(d => d.Type == DefenseTypes.Final);
        if (finalDefense != null)
        {
            evaluation.FinalDefenseId = finalDefense.Id;
            evaluation.FinalDefenseMarks = CalculateAverageDefenseMarks(finalDefense.Marks, 30);
        }

        evaluation.UpdatedAt = DateTime.UtcNow;
    }

    // Helper: Calculate average marks from all evaluators for a defense
    private decimal CalculateAverageDefenseMarks(ICollection<DefenseMarks> marks, decimal maxMarks)
    {
        if (marks == null || !marks.Any())
        {
            return 0;
        }

        var averageTotal = marks.Average(m => m.TotalMarks);

        // Ensure marks don't exceed max
        return Math.Min(averageTotal, maxMarks);
    }

    // Helper: Recalculate total marks and grade
    private async Task RecalculateTotalMarks(ProjectEvaluation evaluation)
    {
        decimal total = 0;

        // Add all components
        if (evaluation.CoordinatorTimelineMarks.HasValue)
            total += evaluation.CoordinatorTimelineMarks.Value;

        if (evaluation.SupervisorProgressMarks.HasValue)
            total += evaluation.SupervisorProgressMarks.Value;

        if (evaluation.InitialDefenseMarks.HasValue)
            total += evaluation.InitialDefenseMarks.Value;

        if (evaluation.MidDefenseMarks.HasValue)
            total += evaluation.MidDefenseMarks.Value;

        if (evaluation.FinalDefenseMarks.HasValue)
            total += evaluation.FinalDefenseMarks.Value;

        evaluation.TotalMarks = total;
        evaluation.Percentage = (total / 100) * 100; // Already out of 100
        evaluation.Grade = CalculateGrade(evaluation.Percentage);
        evaluation.UpdatedAt = DateTime.UtcNow;
    }

    // Helper: Calculate grade based on percentage
    private string CalculateGrade(decimal percentage)
    {
        if (percentage >= 85) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 75) return "A-";
        if (percentage >= 71) return "B+";
        if (percentage >= 68) return "B";
        if (percentage >= 64) return "B-";
        if (percentage >= 61) return "C+";
        if (percentage >= 58) return "C";
        if (percentage >= 54) return "C-";
        if (percentage >= 50) return "D";
        return "F";
    }

    // Helper: Map to DTO
    private static ProjectEvaluationDTO MapToDTO(ProjectEvaluation pe)
    {
        return new ProjectEvaluationDTO
        {
            Id = pe.Id,
            GroupId = pe.GroupId,
            GroupName = pe.Group?.GroupName,
            ProjectTitle = pe.Group?.ProjectTitle,

            CoordinatorTimelineMarks = pe.CoordinatorTimelineMarks,
            CoordinatorEvaluatedBy = pe.CoordinatorEvaluatedBy?.FullName,
            CoordinatorEvaluatedAt = pe.CoordinatorEvaluatedAt,
            CoordinatorRemarks = pe.CoordinatorRemarks,

            SupervisorProgressMarks = pe.SupervisorProgressMarks,
            SupervisorEvaluatedBy = pe.SupervisorEvaluatedBy?.FullName,
            SupervisorEvaluatedAt = pe.SupervisorEvaluatedAt,
            SupervisorRemarks = pe.SupervisorRemarks,

            InitialDefenseMarks = pe.InitialDefenseMarks,
            InitialDefenseId = pe.InitialDefenseId,

            MidDefenseMarks = pe.MidDefenseMarks,
            MidDefenseId = pe.MidDefenseId,

            FinalDefenseMarks = pe.FinalDefenseMarks,
            FinalDefenseId = pe.FinalDefenseId,

            TotalMarks = pe.TotalMarks,
            Percentage = pe.Percentage,
            Grade = pe.Grade,

            CreatedAt = pe.CreatedAt,
            UpdatedAt = pe.UpdatedAt
        };
    }
}

// Request DTOs
public class AssignCoordinatorMarksRequest
{
    public decimal Marks { get; set; }
    public string? Remarks { get; set; }
}

public class AssignSupervisorMarksRequest
{
    public decimal Marks { get; set; }
    public string? Remarks { get; set; }
}

// Response DTO
public class ProjectEvaluationDTO
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string? GroupName { get; set; }
    public string? ProjectTitle { get; set; }

    public decimal? CoordinatorTimelineMarks { get; set; }
    public string? CoordinatorEvaluatedBy { get; set; }
    public DateTime? CoordinatorEvaluatedAt { get; set; }
    public string? CoordinatorRemarks { get; set; }

    public decimal? SupervisorProgressMarks { get; set; }
    public string? SupervisorEvaluatedBy { get; set; }
    public DateTime? SupervisorEvaluatedAt { get; set; }
    public string? SupervisorRemarks { get; set; }

    public decimal? InitialDefenseMarks { get; set; }
    public int? InitialDefenseId { get; set; }

    public decimal? MidDefenseMarks { get; set; }
    public int? MidDefenseId { get; set; }

    public decimal? FinalDefenseMarks { get; set; }
    public int? FinalDefenseId { get; set; }

    public decimal TotalMarks { get; set; }
    public decimal Percentage { get; set; }
    public string? Grade { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
