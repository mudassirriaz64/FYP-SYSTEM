using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;
using FYPSystem.API.Services;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public NotificationsController(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    // GET: api/notifications - Get all notifications (with filters)
    [HttpGet]
    public async Task<ActionResult<NotificationListResponse>> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? type = null,
        [FromQuery] bool? activeOnly = true,
        [FromQuery] int? departmentId = null)
    {
        var query = _context.Notifications
            .Include(n => n.Department)
            .Include(n => n.CreatedBy)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(n => n.IsActive);
        }

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(n => n.Type == type);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(n => n.DepartmentId == departmentId || n.DepartmentId == null);
        }

        var totalCount = await query.CountAsync();

        var notifications = await query
            .OrderByDescending(n => n.Priority)
            .ThenByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => MapToDto(n))
            .ToListAsync();

        return Ok(new NotificationListResponse
        {
            Notifications = notifications,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET: api/notifications/active-forms - Get forms that are currently available for submission
    [HttpGet("active-forms")]
    public async Task<ActionResult<List<NotificationDTO>>> GetActiveFormNotifications(
        [FromQuery] int? departmentId = null)
    {
        var now = DateTime.UtcNow;

        var query = _context.Notifications
            .Include(n => n.Department)
            .Include(n => n.CreatedBy)
            .Where(n => n.IsActive &&
                        n.Type == NotificationTypes.FormRelease &&
                        n.FormAvailableFrom <= now &&
                        n.FormDeadline > now);

        if (departmentId.HasValue)
        {
            query = query.Where(n => n.DepartmentId == departmentId || n.DepartmentId == null);
        }

        var notifications = await query
            .OrderBy(n => n.FormDeadline)
            .Select(n => MapToDto(n))
            .ToListAsync();

        return Ok(notifications);
    }

    // GET: api/notifications/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationDTO>> GetNotification(int id)
    {
        var notification = await _context.Notifications
            .Include(n => n.Department)
            .Include(n => n.CreatedBy)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (notification == null)
        {
            return NotFound(new { message = "Notification not found" });
        }

        return Ok(MapToDto(notification));
    }

    // POST: api/notifications/release-form - Release a form to students (simplified endpoint)
    [HttpPost("release-form")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<ActionResult<NotificationDTO>> ReleaseForm([FromBody] ReleaseFormRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var userId = int.Parse(userIdClaim.Value);

        if (string.IsNullOrEmpty(request.FormType))
        {
            return BadRequest(new { message = "FormType is required" });
        }

        if (request.DaysAvailable <= 0)
        {
            return BadRequest(new { message = "DaysAvailable must be greater than 0" });
        }

        var now = DateTime.UtcNow;
        var formAvailableFrom = now;
        var formDeadline = now.AddDays(request.DaysAvailable);

        var notification = new Notification
        {
            Title = request.Title ?? $"{request.FormType} - Submission Open",
            Message = request.Message ?? $"Please complete and submit {request.FormType} within {request.DaysAvailable} days.",
            Type = NotificationTypes.FormRelease,
            RelatedFormType = request.FormType,
            FormAvailableFrom = formAvailableFrom,
            FormDeadline = formDeadline,
            TargetAudience = "Students",
            DepartmentId = request.DepartmentId,
            CreatedById = userId,
            Priority = request.Priority == "High" ? 2 : (request.Priority == "Medium" ? 1 : 0),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Reload with includes
        await _context.Entry(notification).Reference(n => n.Department).LoadAsync();
        await _context.Entry(notification).Reference(n => n.CreatedBy).LoadAsync();

        return CreatedAtAction(nameof(GetNotification), new { id = notification.Id }, MapToDto(notification));
    }

    // POST: api/notifications - Create notification (Coordinator/Admin only)
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<ActionResult<NotificationDTO>> CreateNotification([FromBody] CreateNotificationRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var userId = int.Parse(userIdClaim.Value);

        // Validate department if specified
        if (request.DepartmentId.HasValue)
        {
            var deptExists = await _context.Departments.AnyAsync(d => d.Id == request.DepartmentId);
            if (!deptExists)
            {
                return BadRequest(new { message = "Department not found" });
            }
        }

        // Validate form release notification
        if (request.Type == NotificationTypes.FormRelease)
        {
            if (!request.FormAvailableFrom.HasValue || !request.FormDeadline.HasValue)
            {
                return BadRequest(new { message = "Form release notifications require FormAvailableFrom and FormDeadline" });
            }

            if (string.IsNullOrEmpty(request.RelatedFormType))
            {
                return BadRequest(new { message = "Form release notifications require RelatedFormType" });
            }

            if (request.FormDeadline <= request.FormAvailableFrom)
            {
                return BadRequest(new { message = "FormDeadline must be after FormAvailableFrom" });
            }
        }

        var notification = new Notification
        {
            Title = request.Title,
            Message = request.Message,
            Type = request.Type,
            RelatedFormType = request.RelatedFormType,
            FormAvailableFrom = request.FormAvailableFrom,
            FormDeadline = request.FormDeadline,
            TargetAudience = request.TargetAudience,
            DepartmentId = request.DepartmentId,
            CreatedById = userId,
            Priority = request.Priority,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Reload with includes
        await _context.Entry(notification).Reference(n => n.Department).LoadAsync();
        await _context.Entry(notification).Reference(n => n.CreatedBy).LoadAsync();

        return CreatedAtAction(nameof(GetNotification), new { id = notification.Id }, MapToDto(notification));
    }

    // PUT: api/notifications/{id} - Update notification
    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<ActionResult<NotificationDTO>> UpdateNotification(int id, [FromBody] CreateNotificationRequest request)
    {
        var notification = await _context.Notifications.FindAsync(id);

        if (notification == null)
        {
            return NotFound(new { message = "Notification not found" });
        }

        notification.Title = request.Title;
        notification.Message = request.Message;
        notification.Type = request.Type;
        notification.RelatedFormType = request.RelatedFormType;
        notification.FormAvailableFrom = request.FormAvailableFrom;
        notification.FormDeadline = request.FormDeadline;
        notification.TargetAudience = request.TargetAudience;
        notification.DepartmentId = request.DepartmentId;
        notification.Priority = request.Priority;

        await _context.SaveChangesAsync();

        await _context.Entry(notification).Reference(n => n.Department).LoadAsync();
        await _context.Entry(notification).Reference(n => n.CreatedBy).LoadAsync();

        return Ok(MapToDto(notification));
    }

    // DELETE: api/notifications/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);

        if (notification == null)
        {
            return NotFound(new { message = "Notification not found" });
        }

        var notificationInfo = $"{notification.Title} (Type: {notification.Type})";

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        // Log notification deletion
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        int? performedByUserId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : null;
        await _auditLogService.LogSystemConfigAsync(
            "DeleteNotification",
            performedByUserId,
            $"Deleted notification: {notificationInfo}",
            null,
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        return Ok(new { message = "Notification deleted successfully" });
    }

    // POST: api/notifications/{id}/deactivate
    [HttpPost("{id}/deactivate")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<IActionResult> DeactivateNotification(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);

        if (notification == null)
        {
            return NotFound(new { message = "Notification not found" });
        }

        var notificationInfo = $"{notification.Title} (Type: {notification.Type})";

        notification.IsActive = false;
        await _context.SaveChangesAsync();

        // Log notification deactivation
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        int? performedByUserId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : null;
        await _auditLogService.LogSystemConfigAsync(
            "DeactivateNotification",
            performedByUserId,
            $"Deactivated notification: {notificationInfo}",
            null,
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        return Ok(new { message = "Notification deactivated successfully" });
    }

    private static NotificationDTO MapToDto(Notification n)
    {
        var now = DateTime.UtcNow;
        var isFormAvailable = n.Type == NotificationTypes.FormRelease &&
                              n.FormAvailableFrom.HasValue &&
                              n.FormDeadline.HasValue &&
                              n.FormAvailableFrom <= now &&
                              n.FormDeadline > now;

        int? daysRemaining = null;
        if (n.FormDeadline.HasValue && n.FormDeadline > now)
        {
            daysRemaining = (int)(n.FormDeadline.Value - now).TotalDays;
        }

        return new NotificationDTO
        {
            Id = n.Id,
            Title = n.Title,
            Message = n.Message,
            Type = n.Type,
            RelatedFormType = n.RelatedFormType,
            FormAvailableFrom = n.FormAvailableFrom,
            FormDeadline = n.FormDeadline,
            TargetAudience = n.TargetAudience,
            DepartmentId = n.DepartmentId,
            DepartmentName = n.Department?.Name,
            CreatedById = n.CreatedById,
            CreatedByName = n.CreatedBy?.FullName,
            CreatedAt = n.CreatedAt,
            IsActive = n.IsActive,
            Priority = n.Priority,
            IsFormAvailable = isFormAvailable,
            DaysRemaining = daysRemaining
        };
    }
}

