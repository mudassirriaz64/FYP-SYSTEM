using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuditLogsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<AuditLogsResponse>> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? actionType = null,
        [FromQuery] string? action = null,
        [FromQuery] int? userId = null,
        [FromQuery] int? studentId = null,
        [FromQuery] int? staffId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] bool? success = null,
        [FromQuery] string? search = null)
    {
        var query = _context.AuditLogs
            .Include(a => a.User)
            .Include(a => a.Student)
            .Include(a => a.Staff)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(actionType))
        {
            query = query.Where(a => a.ActionType == actionType);
        }

        if (!string.IsNullOrEmpty(action))
        {
            query = query.Where(a => a.Action == action);
        }

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId);
        }

        if (studentId.HasValue)
        {
            query = query.Where(a => a.StudentId == studentId);
        }

        if (staffId.HasValue)
        {
            query = query.Where(a => a.StaffId == staffId);
        }

        if (startDate.HasValue)
        {
            query = query.Where(a => a.Timestamp >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.Timestamp <= endDate.Value.AddDays(1));
        }

        if (success.HasValue)
        {
            query = query.Where(a => a.Success == success.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(a =>
                a.Description != null && a.Description.ToLower().Contains(search) ||
                a.Action.ToLower().Contains(search) ||
                a.IpAddress != null && a.IpAddress.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDTO
            {
                Id = a.Id,
                UserId = a.UserId,
                StudentId = a.StudentId,
                StaffId = a.StaffId,
                UserName = a.User != null ? a.User.Username :
                          a.Student != null ? a.Student.EnrollmentId :
                          a.Staff != null ? a.Staff.Email : null,
                FullName = a.Student != null ? a.Student.FullName :
                          a.Staff != null ? a.Staff.FullName : null,
                Action = a.Action,
                ActionType = a.ActionType,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                Description = a.Description,
                Details = a.Details,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent,
                Success = a.Success,
                ErrorMessage = a.ErrorMessage,
                Timestamp = a.Timestamp
            })
            .ToListAsync();

        return Ok(new AuditLogsResponse
        {
            Logs = logs,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<AuditStatsDTO>> GetAuditStats(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        var query = _context.AuditLogs.Where(a => a.Timestamp >= start && a.Timestamp <= end);

        var totalLogs = await query.CountAsync();
        var successfulActions = await query.CountAsync(a => a.Success);
        var failedActions = totalLogs - successfulActions;

        var actionTypeCounts = await query
            .GroupBy(a => a.ActionType)
            .Select(g => new ActionTypeCount
            {
                ActionType = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        var recentFailures = await query
            .Where(a => !a.Success)
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .Select(a => new AuditLogDTO
            {
                Id = a.Id,
                Action = a.Action,
                ActionType = a.ActionType,
                Description = a.Description,
                ErrorMessage = a.ErrorMessage,
                IpAddress = a.IpAddress,
                Timestamp = a.Timestamp
            })
            .ToListAsync();

        return Ok(new AuditStatsDTO
        {
            TotalLogs = totalLogs,
            SuccessfulActions = successfulActions,
            FailedActions = failedActions,
            ActionTypeCounts = actionTypeCounts,
            RecentFailures = recentFailures
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AuditLogDTO>> GetAuditLog(int id)
    {
        var log = await _context.AuditLogs
            .Include(a => a.User)
            .Include(a => a.Student)
            .Include(a => a.Staff)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (log == null)
        {
            return NotFound(new { message = "Audit log not found" });
        }

        return Ok(new AuditLogDTO
        {
            Id = log.Id,
            UserId = log.UserId,
            StudentId = log.StudentId,
            StaffId = log.StaffId,
            UserName = log.User != null ? log.User.Username :
                      log.Student != null ? log.Student.EnrollmentId :
                      log.Staff != null ? log.Staff.Email : null,
            FullName = log.Student != null ? log.Student.FullName :
                      log.Staff != null ? log.Staff.FullName : null,
            Action = log.Action,
            ActionType = log.ActionType,
            EntityType = log.EntityType,
            EntityId = log.EntityId,
            Description = log.Description,
            Details = log.Details,
            IpAddress = log.IpAddress,
            UserAgent = log.UserAgent,
            Success = log.Success,
            ErrorMessage = log.ErrorMessage,
            Timestamp = log.Timestamp
        });
    }
}

public class AuditLogsResponse
{
    public List<AuditLogDTO> Logs { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class AuditLogDTO
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public int? StudentId { get; set; }
    public int? StaffId { get; set; }
    public string? UserName { get; set; }
    public string? FullName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public string? Description { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime Timestamp { get; set; }
}

public class AuditStatsDTO
{
    public int TotalLogs { get; set; }
    public int SuccessfulActions { get; set; }
    public int FailedActions { get; set; }
    public List<ActionTypeCount> ActionTypeCounts { get; set; } = new();
    public List<AuditLogDTO> RecentFailures { get; set; } = new();
}

public class ActionTypeCount
{
    public string ActionType { get; set; } = string.Empty;
    public int Count { get; set; }
}
