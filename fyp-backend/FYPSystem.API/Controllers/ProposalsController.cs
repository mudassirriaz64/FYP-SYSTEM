using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProposalsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProposalsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/proposals - Get all proposals (for coordinators/admins)
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator,HOD")]
    public async Task<ActionResult<ProposalListResponse>> GetProposals(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? formType = null,
        [FromQuery] string? status = null,
        [FromQuery] int? departmentId = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Proposals
            .Include(p => p.Group)
                .ThenInclude(g => g.Department)
            .Include(p => p.Group)
                .ThenInclude(g => g.Supervisor)
            .Include(p => p.Group)
                .ThenInclude(g => g.Members)
                    .ThenInclude(m => m.Student)
            .Include(p => p.StudentSubmissions)
                .ThenInclude(ss => ss.Student)
            .Include(p => p.ReviewedBy)
            .AsQueryable();

        if (!string.IsNullOrEmpty(formType))
        {
            query = query.Where(p => p.FormType == formType);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(p => p.Status == status);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(p => p.Group!.DepartmentId == departmentId);
        }

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(p =>
                p.Group!.GroupName.ToLower().Contains(search) ||
                (p.Group.ProjectTitle != null && p.Group.ProjectTitle.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var proposals = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var proposalDtos = proposals.Select(p => MapToDto(p)).ToList();

        return Ok(new ProposalListResponse
        {
            Proposals = proposalDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET: api/proposals/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ProposalDTO>> GetProposal(int id)
    {
        var proposal = await _context.Proposals
            .Include(p => p.Group)
                .ThenInclude(g => g.Department)
            .Include(p => p.Group)
                .ThenInclude(g => g.Supervisor)
            .Include(p => p.Group)
                .ThenInclude(g => g.Members)
                    .ThenInclude(m => m.Student)
            .Include(p => p.StudentSubmissions)
                .ThenInclude(ss => ss.Student)
            .Include(p => p.ReviewedBy)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null)
        {
            return NotFound(new { message = "Proposal not found" });
        }

        return Ok(MapToDto(proposal));
    }

    // PUT: api/proposals/{id}/review - Review a proposal (Coordinator only)
    [HttpPut("{id}/review")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<IActionResult> ReviewProposal(int id, [FromBody] ReviewProposalRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var userId = int.Parse(userIdClaim.Value);

        var proposal = await _context.Proposals
            .Include(p => p.Group)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null)
        {
            return NotFound(new { message = "Proposal not found" });
        }

        if (proposal.Status != ProposalStatuses.Submitted)
        {
            return BadRequest(new { message = "Only submitted proposals can be reviewed" });
        }

        // Normalize status - frontend might send "RevisionRequired" instead of "Revision"
        var normalizedStatus = request.Status;
        if (normalizedStatus == "RevisionRequired")
        {
            normalizedStatus = ProposalStatuses.Revision;
        }
        
        var validStatuses = new[] { ProposalStatuses.Approved, ProposalStatuses.Rejected, ProposalStatuses.Revision };
        if (!validStatuses.Contains(normalizedStatus))
        {
            return BadRequest(new { message = "Invalid review status" });
        }
        
        request.Status = normalizedStatus;

        proposal.Status = request.Status;
        proposal.ReviewedById = userId;
        proposal.ReviewedAt = DateTime.UtcNow;
        proposal.ReviewRemarks = request.Remarks ?? request.ReviewRemarks; // Support both field names
        proposal.UpdatedAt = DateTime.UtcNow;

        // Update group status based on form approval
        if (request.Status == ProposalStatuses.Approved)
        {
            if (proposal.FormType == FormTypes.FormA)
            {
                // Form-A approved - group is now Active and can proceed to Form-B
                proposal.Group!.Status = GroupStatuses.Active;
                proposal.Group.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Proposal reviewed successfully" });
    }

    // GET: api/proposals/pending
    [HttpGet("pending")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<IActionResult> GetPendingCount([FromQuery] int? departmentId = null)
    {
        var query = _context.Proposals
            .Include(p => p.Group)
            .Where(p => p.Status == ProposalStatuses.Submitted);

        if (departmentId.HasValue)
        {
            query = query.Where(p => p.Group!.DepartmentId == departmentId);
        }

        var count = await query.CountAsync();

        return Ok(new { count });
    }

    // GET: api/proposals/by-group/{groupId}
    [HttpGet("by-group/{groupId}")]
    public async Task<ActionResult<List<ProposalDTO>>> GetProposalsByGroup(int groupId)
    {
        var proposals = await _context.Proposals
            .Include(p => p.Group)
                .ThenInclude(g => g.Department)
            .Include(p => p.StudentSubmissions)
                .ThenInclude(ss => ss.Student)
            .Include(p => p.ReviewedBy)
            .Where(p => p.GroupId == groupId)
            .OrderBy(p => p.FormType)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(proposals.Select(p => MapToDto(p)).ToList());
    }

    private static ProposalDTO MapToDto(Proposal p)
    {
        var totalMembers = p.Group?.Members?.Count(m => m.Status == MemberStatuses.Accepted) ?? 0;
        var submittedCount = p.StudentSubmissions?.Count(ss => ss.IsSubmitted) ?? 0;

        return new ProposalDTO
        {
            Id = p.Id,
            GroupId = p.GroupId,
            GroupName = p.Group?.GroupName,
            ProjectTitle = p.Group?.ProjectTitle,
            ProjectDescription = p.Group?.ProjectDescription,
            DegreeLevel = p.Group?.DegreeLevel,
            DegreeProgram = p.Group?.DegreeProgram,
            DepartmentName = p.Group?.Department?.Name,
            SupervisorName = p.Group?.Supervisor?.FullName,
            FormType = p.FormType,
            Status = p.Status,
            SubmittedAt = p.SubmittedAt,
            ReviewedById = p.ReviewedById,
            ReviewedByName = p.ReviewedBy?.FullName,
            ReviewedAt = p.ReviewedAt,
            ReviewRemarks = p.ReviewRemarks,
            RevisionNumber = p.RevisionNumber,
            CreatedAt = p.CreatedAt,
            TotalMembers = totalMembers,
            SubmittedCount = submittedCount,
            AllMembersSubmitted = submittedCount >= totalMembers && totalMembers > 0,
            StudentSubmissions = p.StudentSubmissions?.Select(ss => new StudentFormSubmissionDTO
            {
                Id = ss.Id,
                ProposalId = ss.ProposalId,
                StudentId = ss.StudentId,
                FullName = ss.FullName,
                EnrollmentNumber = ss.EnrollmentNumber,
                CellNumber = ss.CellNumber,
                Email = ss.Email,
                PostalAddress = ss.PostalAddress,
                IsGroupManager = ss.IsGroupManager,
                IsSubmitted = ss.IsSubmitted,
                SubmittedAt = ss.SubmittedAt
            }).ToList() ?? new List<StudentFormSubmissionDTO>()
        };
    }
}

