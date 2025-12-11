using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;
using System.Security.Cryptography;

namespace FYPSystem.API.Controllers;

/// <summary>
/// Controller for SuperAdmin to manage committee requests and create logins.
/// </summary>
[Route("api/admin/committee")]
[ApiController]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminCommitteeController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SuperAdminCommitteeController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all pending committee requests
    /// </summary>
    [HttpGet("requests")]
    public async Task<IActionResult> GetCommitteeRequests()
    {
        var committees = await _context.ProposalCommittees
            .Include(c => c.Members)
                .ThenInclude(m => m.Staff)
            .Include(c => c.Department)
            .Include(c => c.CreatedBy)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var result = committees.Select(c => new
        {
            c.Id,
            c.Name,
            c.Status,
            c.CreatedAt,
            c.ApprovedAt,
            HasLogin = c.UserId != null,
            Department = c.Department?.Name,
            DepartmentCode = c.Department?.Code,
            CreatedByName = c.CreatedBy?.FullName,
            MemberCount = c.Members.Count,
            Members = c.Members.Select(m => new
            {
                m.Id,
                m.StaffId,
                StaffFullName = m.Staff?.FullName,
                StaffEmail = m.Staff?.Email,
                StaffDesignation = m.Staff?.Designation
            })
        });

        return Ok(new
        {
            committees = result,
            pendingCount = committees.Count(c => c.Status == CommitteeStatuses.Pending),
            activeCount = committees.Count(c => c.Status == CommitteeStatuses.Active)
        });
    }

    /// <summary>
    /// Approve a committee request and create shared login
    /// </summary>
    [HttpPost("requests/{id}/approve")]
    public async Task<IActionResult> ApproveCommittee(int id, [FromBody] ApproveCommitteeRequest request)
    {
        var committee = await _context.ProposalCommittees
            .Include(c => c.Department)
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (committee == null)
        {
            return NotFound(new { message = "Committee not found" });
        }

        if (committee.Status == CommitteeStatuses.Active && committee.UserId != null)
        {
            return BadRequest(new { message = "This committee already has an active login" });
        }

        // Generate login credentials
        var username = request.Username ?? $"committee_{committee.Department?.Code?.ToLower()}";
        var password = request.Password ?? GenerateRandomPassword();

        // Check if username already exists
        if (await _context.Users.AnyAsync(u => u.Username == username))
        {
            return BadRequest(new { message = $"Username '{username}' already exists. Please choose a different one." });
        }

        // Create user account for the committee
        var user = new User
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            FullName = committee.Name,
            Email = request.Email ?? $"{username}@fyp.edu.pk",
            Role = "Committee",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Link user to committee
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(userIdClaim, out var approvedById);

        committee.UserId = user.Id;
        committee.Status = CommitteeStatuses.Active;
        committee.ApprovedAt = DateTime.UtcNow;
        committee.ApprovedById = approvedById;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Committee approved and login created successfully",
            committeeId = committee.Id,
            login = new
            {
                username,
                password, // Return the generated password for first-time use
                email = user.Email
            }
        });
    }

    /// <summary>
    /// Reject a committee request
    /// </summary>
    [HttpPost("requests/{id}/reject")]
    public async Task<IActionResult> RejectCommittee(int id, [FromBody] RejectCommitteeRequest request)
    {
        var committee = await _context.ProposalCommittees.FindAsync(id);

        if (committee == null)
        {
            return NotFound(new { message = "Committee not found" });
        }

        committee.Status = CommitteeStatuses.Rejected;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Committee request rejected", reason = request.Reason });
    }

    /// <summary>
    /// Deactivate a committee (disable login)
    /// </summary>
    [HttpPost("requests/{id}/deactivate")]
    public async Task<IActionResult> DeactivateCommittee(int id)
    {
        var committee = await _context.ProposalCommittees
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (committee == null)
        {
            return NotFound(new { message = "Committee not found" });
        }

        if (committee.User != null)
        {
            committee.User.IsActive = false;
        }

        committee.Status = CommitteeStatuses.Inactive;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Committee deactivated" });
    }

    /// <summary>
    /// Reset committee password
    /// </summary>
    [HttpPost("requests/{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id)
    {
        var committee = await _context.ProposalCommittees
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (committee == null)
        {
            return NotFound(new { message = "Committee not found" });
        }

        if (committee.User == null)
        {
            return BadRequest(new { message = "This committee does not have a login account" });
        }

        var newPassword = GenerateRandomPassword();
        committee.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Password reset successfully",
            newPassword
        });
    }

    private static string GenerateRandomPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 10).Select(s => s[random.Next(s.Length)]).ToArray());
    }
}

public class ApproveCommitteeRequest
{
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? Email { get; set; }
}

public class RejectCommitteeRequest
{
    public string? Reason { get; set; }
}
