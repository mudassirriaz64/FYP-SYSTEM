using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

/// <summary>
/// Controller for Coordinator to manage Proposal Defense Committee.
/// </summary>
[Route("api/coordinator/committee")]
[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
public class CoordinatorCommitteeController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CoordinatorCommitteeController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get list of staff members without assigned roles (available for committee)
    /// </summary>
    [HttpGet("available-staff")]
    public async Task<IActionResult> GetAvailableStaff()
    {
        // Get user from claims to find their department
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);
        var departmentId = staff?.DepartmentId;

        // Get staff in the department who don't have assigned login roles
        // (StaffType = Teacher but no User account or role)
        var availableStaff = await _context.Staff
            .Where(s => s.DepartmentId == departmentId &&
                        s.StaffType == "Teacher" &&
                        s.IsActive)
            .Select(s => new
            {
                s.Id,
                s.FullName,
                s.Email,
                s.Designation,
                s.Qualification,
                HasLogin = s.UserId != null,
                IsCommitteeMember = s.IsCommitteeMember
            })
            .ToListAsync();

        return Ok(new { staff = availableStaff });
    }

    /// <summary>
    /// Get current proposal committee for the coordinator's department
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProposalCommittee()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);
        var departmentId = staff?.DepartmentId;

        var committee = await _context.ProposalCommittees
            .Include(c => c.Members)
                .ThenInclude(m => m.Staff)
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.DepartmentId == departmentId);

        if (committee == null)
        {
            return Ok(new { committee = (object?)null, message = "No committee formed yet" });
        }

        return Ok(new
        {
            committee = new
            {
                committee.Id,
                committee.Name,
                committee.Status,
                committee.CreatedAt,
                committee.ApprovedAt,
                HasLogin = committee.UserId != null,
                LoginEmail = committee.User?.Email,
                Members = committee.Members.Select(m => new
                {
                    m.Id,
                    m.StaffId,
                    StaffFullName = m.Staff?.FullName,
                    StaffEmail = m.Staff?.Email,
                    StaffDesignation = m.Staff?.Designation,
                    m.AddedAt
                })
            }
        });
    }

    /// <summary>
    /// Create or update a proposal committee with selected members.
    /// This sends a request to SuperAdmin for login creation.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateOrUpdateCommittee([FromBody] CreateCommitteeRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);
        var departmentId = staff?.DepartmentId;

        if (!departmentId.HasValue)
        {
            return BadRequest(new { message = "Could not determine your department" });
        }

        if (request.StaffIds == null || request.StaffIds.Count < 2)
        {
            return BadRequest(new { message = "Please select at least 2 staff members for the committee" });
        }

        // Check if a committee already exists
        var existingCommittee = await _context.ProposalCommittees
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.DepartmentId == departmentId);

        if (existingCommittee != null)
        {
            // Update existing committee - remove old members, add new ones
            _context.ProposalCommitteeMembers.RemoveRange(existingCommittee.Members);
            
            foreach (var staffId in request.StaffIds)
            {
                existingCommittee.Members.Add(new ProposalCommitteeMember
                {
                    CommitteeId = existingCommittee.Id,
                    StaffId = staffId,
                    AddedAt = DateTime.UtcNow
                });
            }

            // Reset to pending if it was rejected or inactive
            if (existingCommittee.Status != CommitteeStatuses.Active)
            {
                existingCommittee.Status = CommitteeStatuses.Pending;
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Committee updated successfully. Awaiting SuperAdmin approval for login creation.",
                committeeId = existingCommittee.Id
            });
        }

        // Create new committee
        var committee = new ProposalCommittee
        {
            Name = request.Name ?? "Proposal Defense Committee",
            DepartmentId = departmentId.Value,
            Status = CommitteeStatuses.Pending,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var staffId in request.StaffIds)
        {
            committee.Members.Add(new ProposalCommitteeMember
            {
                StaffId = staffId,
                AddedAt = DateTime.UtcNow
            });
        }

        _context.ProposalCommittees.Add(committee);
        await _context.SaveChangesAsync();

        return Ok(new { 
            message = "Committee created successfully. Request sent to SuperAdmin for login creation.",
            committeeId = committee.Id
        });
    }

    /// <summary>
    /// Remove a member from the committee
    /// </summary>
    [HttpDelete("member/{memberId}")]
    public async Task<IActionResult> RemoveMember(int memberId)
    {
        var member = await _context.ProposalCommitteeMembers
            .Include(m => m.Committee)
            .FirstOrDefaultAsync(m => m.Id == memberId);

        if (member == null)
        {
            return NotFound(new { message = "Member not found" });
        }

        _context.ProposalCommitteeMembers.Remove(member);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Member removed from committee" });
    }
}

public class CreateCommitteeRequest
{
    public string? Name { get; set; }
    public List<int> StaffIds { get; set; } = new();
}
