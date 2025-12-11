using FYPSystem.API.Data;
using FYPSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace FYPSystem.API.Services;

public interface IAuditLogService
{
    Task LogAsync(AuditLog auditLog);
    Task LogAuthenticationAsync(string action, int? userId, int? studentId, int? staffId, bool success, string? errorMessage = null, string? ipAddress = null, string? userAgent = null);
    Task LogUserManagementAsync(string action, int? performedByUserId, string entityType, int? entityId, string description, string? ipAddress = null);
    Task LogFormSubmissionAsync(string action, int? studentId, string formType, int? formId, bool success, string? ipAddress = null);
    Task LogGroupManagementAsync(string action, int? userId, int? studentId, int groupId, string description, string? ipAddress = null);
    Task LogSystemConfigAsync(string action, int? userId, string description, string? details = null, string? ipAddress = null);
}

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;

    public AuditLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(AuditLog auditLog)
    {
        try
        {
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Log to console if database logging fails
            Console.WriteLine($"Failed to write audit log: {ex.Message}");
        }
    }

    public async Task LogAuthenticationAsync(string action, int? userId, int? studentId, int? staffId, bool success, string? errorMessage = null, string? ipAddress = null, string? userAgent = null)
    {
        var auditLog = new AuditLog
        {
            Action = action,
            ActionType = AuditActionTypes.Authentication,
            UserId = userId,
            StudentId = studentId,
            StaffId = staffId,
            Success = success,
            ErrorMessage = errorMessage,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Description = success
                ? $"User successfully {action.ToLower()}"
                : $"Failed {action.ToLower()} attempt",
            Timestamp = DateTime.UtcNow
        };

        await LogAsync(auditLog);
    }

    public async Task LogUserManagementAsync(string action, int? performedByUserId, string entityType, int? entityId, string description, string? ipAddress = null)
    {
        int? staffId = null;
        
        // Check if the user is actually a Staff member
        if (performedByUserId.HasValue)
        {
            var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == performedByUserId.Value);
            if (staff != null)
            {
                staffId = staff.Id;
            }
        }
        
        var auditLog = new AuditLog
        {
            Action = action,
            ActionType = AuditActionTypes.UserManagement,
            UserId = performedByUserId,
            StaffId = staffId,
            EntityType = entityType,
            EntityId = entityId,
            Description = description,
            IpAddress = ipAddress,
            Success = true,
            Timestamp = DateTime.UtcNow
        };

        await LogAsync(auditLog);
    }

    public async Task LogFormSubmissionAsync(string action, int? studentId, string formType, int? formId, bool success, string? ipAddress = null)
    {
        var auditLog = new AuditLog
        {
            Action = action,
            ActionType = AuditActionTypes.FormSubmission,
            StudentId = studentId,
            EntityType = formType,
            EntityId = formId,
            Description = $"Student submitted {formType}",
            Success = success,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        };

        await LogAsync(auditLog);
    }

    public async Task LogGroupManagementAsync(string action, int? userId, int? studentId, int groupId, string description, string? ipAddress = null)
    {
        var auditLog = new AuditLog
        {
            Action = action,
            ActionType = AuditActionTypes.GroupManagement,
            UserId = userId,
            StudentId = studentId,
            EntityType = "FYPGroup",
            EntityId = groupId,
            Description = description,
            IpAddress = ipAddress,
            Success = true,
            Timestamp = DateTime.UtcNow
        };

        await LogAsync(auditLog);
    }

    public async Task LogSystemConfigAsync(string action, int? userId, string description, string? details = null, string? ipAddress = null)
    {
        var auditLog = new AuditLog
        {
            Action = action,
            ActionType = AuditActionTypes.SystemConfiguration,
            UserId = userId,
            Description = description,
            Details = details,
            IpAddress = ipAddress,
            Success = true,
            Timestamp = DateTime.UtcNow
        };

        await LogAsync(auditLog);
    }
}
