using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using FYPSystem.API.DTOs;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
public class DeadlinesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DeadlinesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/deadlines
    [HttpGet]
    public async Task<IActionResult> GetDeadlines([FromQuery] string? type = null, [FromQuery] bool? active = null)
    {
        var query = _context.Deadlines
            .Include(d => d.Department)
            .AsQueryable();

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(d => d.Type == type);
        }

        if (active.HasValue)
        {
            query = query.Where(d => d.IsActive == active.Value);
        }

        var deadlines = await query
            .OrderBy(d => d.DeadlineDate)
            .Select(d => new DeadlineDTO
            {
                Id = d.Id,
                Title = d.Title,
                Type = d.Type,
                Deadline = d.DeadlineDate,
                Description = d.Description,
                NotifyStudents = d.NotifyStudents,
                NotifySupervisors = d.NotifySupervisors,
                ReminderDays = d.ReminderDays,
                DepartmentId = d.DepartmentId,
                DepartmentName = d.Department != null ? d.Department.Name : null,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();

        return Ok(new DeadlineListResponse
        {
            Deadlines = deadlines,
            TotalCount = deadlines.Count
        });
    }

    // GET: api/deadlines/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDeadline(int id)
    {
        var deadline = await _context.Deadlines
            .Include(d => d.Department)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (deadline == null)
        {
            return NotFound(new { message = "Deadline not found" });
        }

        return Ok(new DeadlineDTO
        {
            Id = deadline.Id,
            Title = deadline.Title,
            Type = deadline.Type,
            Deadline = deadline.DeadlineDate,
            Description = deadline.Description,
            NotifyStudents = deadline.NotifyStudents,
            NotifySupervisors = deadline.NotifySupervisors,
            ReminderDays = deadline.ReminderDays,
            DepartmentId = deadline.DepartmentId,
            DepartmentName = deadline.Department?.Name,
            IsActive = deadline.IsActive,
            CreatedAt = deadline.CreatedAt
        });
    }

    // POST: api/deadlines
    [HttpPost]
    public async Task<IActionResult> CreateDeadline([FromBody] CreateDeadlineRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        var userId = userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;

        var deadline = new Deadline
        {
            Title = request.Title,
            Type = request.Type,
            DeadlineDate = request.Deadline,
            Description = request.Description,
            NotifyStudents = request.NotifyStudents,
            NotifySupervisors = request.NotifySupervisors,
            ReminderDays = request.ReminderDays,
            DepartmentId = request.DepartmentId,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Deadlines.Add(deadline);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDeadline), new { id = deadline.Id }, new DeadlineDTO
        {
            Id = deadline.Id,
            Title = deadline.Title,
            Type = deadline.Type,
            Deadline = deadline.DeadlineDate,
            Description = deadline.Description,
            NotifyStudents = deadline.NotifyStudents,
            NotifySupervisors = deadline.NotifySupervisors,
            ReminderDays = deadline.ReminderDays,
            IsActive = deadline.IsActive,
            CreatedAt = deadline.CreatedAt
        });
    }

    // PUT: api/deadlines/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDeadline(int id, [FromBody] UpdateDeadlineRequest request)
    {
        var deadline = await _context.Deadlines.FindAsync(id);
        if (deadline == null)
        {
            return NotFound(new { message = "Deadline not found" });
        }

        if (!string.IsNullOrEmpty(request.Title)) deadline.Title = request.Title;
        if (!string.IsNullOrEmpty(request.Type)) deadline.Type = request.Type;
        if (request.Deadline.HasValue) deadline.DeadlineDate = request.Deadline.Value;
        if (request.Description != null) deadline.Description = request.Description;
        if (request.NotifyStudents.HasValue) deadline.NotifyStudents = request.NotifyStudents.Value;
        if (request.NotifySupervisors.HasValue) deadline.NotifySupervisors = request.NotifySupervisors.Value;
        if (request.ReminderDays.HasValue) deadline.ReminderDays = request.ReminderDays.Value;
        if (request.IsActive.HasValue) deadline.IsActive = request.IsActive.Value;
        
        deadline.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Deadline updated successfully" });
    }

    // DELETE: api/deadlines/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDeadline(int id)
    {
        var deadline = await _context.Deadlines.FindAsync(id);
        if (deadline == null)
        {
            return NotFound(new { message = "Deadline not found" });
        }

        _context.Deadlines.Remove(deadline);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Deadline deleted successfully" });
    }
}

