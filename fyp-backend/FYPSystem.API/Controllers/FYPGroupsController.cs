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
public class FYPGroupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public FYPGroupsController(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    // GET: api/fypgroups - Get all groups (for coordinators/admins)
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator,HOD")]
    public async Task<ActionResult<FYPGroupListResponse>> GetGroups(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] int? departmentId = null,
        [FromQuery] int? supervisorId = null,
        [FromQuery] string? search = null)
    {
        var query = _context.FYPGroups
            .Include(g => g.Department)
            .Include(g => g.Supervisor)
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(g => g.Status == status);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(g => g.DepartmentId == departmentId);
        }

        if (supervisorId.HasValue)
        {
            query = query.Where(g => g.SupervisorId == supervisorId);
        }

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(g =>
                g.GroupName.ToLower().Contains(search) ||
                (g.ProjectTitle != null && g.ProjectTitle.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var groups = await query
            .OrderByDescending(g => g.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var groupDtos = groups.Select(g => MapToDto(g)).ToList();

        return Ok(new FYPGroupListResponse
        {
            Groups = groupDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET: api/fypgroups/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<FYPGroupDTO>> GetGroup(int id)
    {
        var group = await _context.FYPGroups
            .Include(g => g.Department)
            .Include(g => g.Supervisor)
            .Include(g => g.CoSupervisor)
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (group == null)
        {
            return NotFound(new { message = "Group not found" });
        }

        return Ok(MapToDto(group));
    }

    // POST: api/fypgroups - Create a new group (Student creates)
    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<FYPGroupDTO>> CreateGroup([FromBody] CreateGroupRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var studentId = int.Parse(userIdClaim.Value);

        // Find the student (JWT contains Student.Id directly for student logins)
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.Id == studentId);

        if (student == null)
        {
            return BadRequest(new { message = "Student profile not found" });
        }

        // Check if student is already in a group
        var existingMembership = await _context.GroupMembers
            .AnyAsync(gm => gm.StudentId == student.Id &&
                           (gm.Status == MemberStatuses.Accepted || gm.Status == MemberStatuses.Pending));

        if (existingMembership)
        {
            return BadRequest(new { message = "You are already in a group or have a pending invitation" });
        }

        // Validate department
        var department = await _context.Departments.FindAsync(request.DepartmentId);
        if (department == null)
        {
            return BadRequest(new { message = "Department not found" });
        }

        // Validate supervisor if provided
        if (request.SupervisorId.HasValue)
        {
            var supervisor = await _context.Staff.FindAsync(request.SupervisorId);
            if (supervisor == null || supervisor.StaffType != StaffTypes.Teacher)
            {
                return BadRequest(new { message = "Invalid supervisor" });
            }
        }

        // Generate group name
        var groupCount = await _context.FYPGroups.CountAsync(g => g.DepartmentId == request.DepartmentId);
        var groupName = $"{department.Code}-FYP-{DateTime.Now.Year}-{(groupCount + 1):D3}";

        // Create the group
        var group = new FYPGroup
        {
            GroupName = groupName,
            ProjectTitle = request.ProjectTitle,
            ProjectDescription = request.ProjectDescription,
            DegreeLevel = request.DegreeLevel,
            DegreeProgram = request.DegreeProgram,
            DepartmentId = request.DepartmentId,
            SupervisorId = request.SupervisorId,
            SupervisorStatus = request.SupervisorId.HasValue ? SupervisorStatuses.Pending : SupervisorStatuses.Pending,
            Status = GroupStatuses.Forming,
            CreatedAt = DateTime.UtcNow
        };

        _context.FYPGroups.Add(group);
        await _context.SaveChangesAsync();

        // Add creator as group manager
        var creatorMember = new GroupMember
        {
            GroupId = group.Id,
            StudentId = student.Id,
            IsGroupManager = true,
            Role = MemberRoles.Manager,
            Status = MemberStatuses.Accepted,
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.GroupMembers.Add(creatorMember);

        // Invite other members
        foreach (var memberId in request.MemberStudentIds.Where(id => id != student.Id))
        {
            var memberStudent = await _context.Students.FindAsync(memberId);
            if (memberStudent != null)
            {
                var memberInvite = new GroupMember
                {
                    GroupId = group.Id,
                    StudentId = memberId,
                    IsGroupManager = false,
                    Role = MemberRoles.Member,
                    Status = MemberStatuses.Pending,
                    CreatedAt = DateTime.UtcNow
                };
                _context.GroupMembers.Add(memberInvite);
            }
        }

        await _context.SaveChangesAsync();

        // Log group creation
        await _auditLogService.LogGroupManagementAsync(
            AuditActions.CreateGroup,
            null,
            studentId,
            group.Id,
            $"Created group {group.GroupName}",
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        // Reload with includes
        var createdGroup = await _context.FYPGroups
            .Include(g => g.Department)
            .Include(g => g.Supervisor)
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .FirstOrDefaultAsync(g => g.Id == group.Id);

        return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, MapToDto(createdGroup!));
    }

    // PUT: api/fypgroups/{id} - Update group (Group manager or coordinator)
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<FYPGroupDTO>> UpdateGroup(int id, [FromBody] UpdateGroupRequest request)
    {
        var group = await _context.FYPGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (group == null)
        {
            return NotFound(new { message = "Group not found" });
        }

        // Check authorization (coordinator or group manager)
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (userRole != "SuperAdmin" && userRole != "Admin" && userRole != "FYPCoordinator" && userRole != "Coordinator")
        {
            // Must be group manager
            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            var studentId = int.Parse(userIdClaim.Value);
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == studentId);
            if (student == null)
            {
                return Unauthorized();
            }

            var isManager = group.Members.Any(m => m.StudentId == student.Id && m.IsGroupManager);
            if (!isManager)
            {
                return Forbid();
            }
        }

        if (request.ProjectTitle != null)
        {
            group.ProjectTitle = request.ProjectTitle;
        }

        if (request.ProjectDescription != null)
        {
            group.ProjectDescription = request.ProjectDescription;
        }

        if (request.SupervisorId.HasValue && request.SupervisorId != group.SupervisorId)
        {
            var supervisor = await _context.Staff.FindAsync(request.SupervisorId);
            if (supervisor == null || supervisor.StaffType != StaffTypes.Teacher)
            {
                return BadRequest(new { message = "Invalid supervisor" });
            }
            group.SupervisorId = request.SupervisorId;
            group.SupervisorStatus = SupervisorStatuses.Pending;
        }

        group.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Reload
        var updatedGroup = await _context.FYPGroups
            .Include(g => g.Department)
            .Include(g => g.Supervisor)
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .FirstOrDefaultAsync(g => g.Id == id);

        return Ok(MapToDto(updatedGroup!));
    }

    // POST: api/fypgroups/{id}/invite - Invite a student to group
    [HttpPost("{id}/invite")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> InviteMember(int id, [FromBody] InviteMemberRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var studentId = int.Parse(userIdClaim.Value);
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == studentId);
        if (student == null)
        {
            return BadRequest(new { message = "Student profile not found" });
        }

        var group = await _context.FYPGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (group == null)
        {
            return NotFound(new { message = "Group not found" });
        }

        // Check if requester is group manager
        var isManager = group.Members.Any(m => m.StudentId == student.Id && m.IsGroupManager);
        if (!isManager)
        {
            return Forbid();
        }

        // Check group size limit (max 3)
        var currentMembers = group.Members.Count(m => m.Status == MemberStatuses.Accepted || m.Status == MemberStatuses.Pending);
        if (currentMembers >= 3)
        {
            return BadRequest(new { message = "Group already has maximum members (3)" });
        }

        // Check if student exists and is not in another group
        var invitedStudent = await _context.Students.FindAsync(request.StudentId);
        if (invitedStudent == null)
        {
            return BadRequest(new { message = "Student not found" });
        }

        var existingMembership = await _context.GroupMembers
            .AnyAsync(gm => gm.StudentId == request.StudentId &&
                           (gm.Status == MemberStatuses.Accepted || gm.Status == MemberStatuses.Pending));
        if (existingMembership)
        {
            return BadRequest(new { message = "Student is already in a group or has a pending invitation" });
        }

        var invitation = new GroupMember
        {
            GroupId = id,
            StudentId = request.StudentId,
            IsGroupManager = false,
            Role = MemberRoles.Member,
            Status = MemberStatuses.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.GroupMembers.Add(invitation);
        await _context.SaveChangesAsync();

        // Log member invitation (invitedStudent already loaded above)
        await _auditLogService.LogGroupManagementAsync(
            AuditActions.InviteMember,
            null,
            studentId,
            id,
            $"Invited {invitedStudent?.FullName ?? "student"} to group {group.GroupName}",
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        return Ok(new { message = "Invitation sent successfully" });
    }

    // POST: api/fypgroups/{id}/respond - Accept/Decline invitation
    [HttpPost("{id}/respond")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> RespondToInvite(int id, [FromBody] RespondToInviteRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var studentId = int.Parse(userIdClaim.Value);
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == studentId);
        if (student == null)
        {
            return BadRequest(new { message = "Student profile not found" });
        }

        var membership = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == id && gm.StudentId == student.Id && gm.Status == MemberStatuses.Pending);

        if (membership == null)
        {
            return NotFound(new { message = "No pending invitation found" });
        }

        if (request.Accept)
        {
            membership.Status = MemberStatuses.Accepted;
            membership.JoinedAt = DateTime.UtcNow;
        }
        else
        {
            membership.Status = MemberStatuses.Declined;
        }

        membership.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Log invitation response
        var groupName = await _context.FYPGroups
            .Where(g => g.Id == id)
            .Select(g => g.GroupName)
            .FirstOrDefaultAsync();
        await _auditLogService.LogGroupManagementAsync(
            request.Accept ? AuditActions.JoinGroup : AuditActions.LeaveGroup,
            null,
            studentId,
            id,
            request.Accept ? $"Accepted invitation to group {groupName}" : $"Declined invitation to group {groupName}",
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        return Ok(new { message = request.Accept ? "Invitation accepted" : "Invitation declined" });
    }

    // PUT: api/fypgroups/{id}/supervisor - Coordinator assigns supervisor
    [HttpPut("{id}/supervisor")]
    [Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
    public async Task<IActionResult> AssignSupervisor(int id, [FromBody] AssignSupervisorRequest request)
    {
        var group = await _context.FYPGroups.FindAsync(id);
        if (group == null)
        {
            return NotFound(new { message = "Group not found" });
        }

        var supervisor = await _context.Staff.FindAsync(request.SupervisorId);
        if (supervisor == null || supervisor.StaffType != StaffTypes.Teacher)
        {
            return BadRequest(new { message = "Invalid supervisor" });
        }

        group.SupervisorId = request.SupervisorId;
        group.SupervisorStatus = SupervisorStatuses.Accepted; // Coordinator assignment = auto-accepted
        group.SupervisorResponseAt = DateTime.UtcNow;
        group.SupervisorRemarks = "Assigned by coordinator";
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Supervisor assigned successfully",
            supervisorName = supervisor.FullName
        });
    }

    // POST: api/fypgroups/{id}/supervisor-response - Supervisor accepts/rejects group
    [HttpPost("{id}/supervisor-response")]
    [Authorize(Roles = "Supervisor,Teacher")]
    public async Task<IActionResult> SupervisorResponse(int id, [FromQuery] bool accept, [FromQuery] string? remarks = null)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var userId = int.Parse(userIdClaim.Value);

        // Find staff by user ID
        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        var group = await _context.FYPGroups.FindAsync(id);
        if (group == null)
        {
            return NotFound(new { message = "Group not found" });
        }

        if (group.SupervisorId != staff.Id)
        {
            return Forbid();
        }

        group.SupervisorStatus = accept ? SupervisorStatuses.Accepted : SupervisorStatuses.Rejected;
        group.SupervisorResponseAt = DateTime.UtcNow;
        group.SupervisorRemarks = remarks;

        if (accept)
        {
            // Check if all members have joined
            var allJoined = await _context.GroupMembers
                .Where(gm => gm.GroupId == id)
                .AllAsync(gm => gm.Status == MemberStatuses.Accepted);

            if (allJoined)
            {
                group.Status = GroupStatuses.Active;
            }
        }

        group.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = accept ? "Supervision accepted" : "Supervision rejected" });
    }

    private static FYPGroupDTO MapToDto(FYPGroup g)
    {
        var acceptedMembers = g.Members?.Where(m => m.Status == MemberStatuses.Accepted).ToList() ?? new List<GroupMember>();
        var allMembers = g.Members?.ToList() ?? new List<GroupMember>();

        return new FYPGroupDTO
        {
            Id = g.Id,
            GroupName = g.GroupName,
            ProjectTitle = g.ProjectTitle,
            ProjectDescription = g.ProjectDescription,
            DegreeLevel = g.DegreeLevel,
            DegreeProgram = g.DegreeProgram,
            DepartmentId = g.DepartmentId,
            DepartmentName = g.Department?.Name,
            SupervisorId = g.SupervisorId,
            SupervisorName = g.Supervisor?.FullName,
            SupervisorStatus = g.SupervisorStatus,
            CoSupervisorId = g.CoSupervisorId,
            CoSupervisorName = g.CoSupervisor?.FullName,
            Status = g.Status,
            CreatedAt = g.CreatedAt,
            MemberCount = acceptedMembers.Count,
            AllMembersJoined = allMembers.All(m => m.Status == MemberStatuses.Accepted),
            Members = allMembers.Select(m => new GroupMemberDTO
            {
                Id = m.Id,
                GroupId = m.GroupId,
                StudentId = m.StudentId,
                StudentName = m.Student?.FullName ?? "",
                EnrollmentId = m.Student?.EnrollmentId ?? "",
                Email = m.Student?.Email,
                Phone = m.Student?.Phone,
                IsGroupManager = m.IsGroupManager,
                Role = m.Role,
                Status = m.Status,
                JoinedAt = m.JoinedAt,
                ProposalMarks = m.ProposalMarks,
                MidEvalMarks = m.MidEvalMarks,
                FinalEvalMarks = m.FinalEvalMarks,
                SupervisorMarks = m.SupervisorMarks,
                TotalMarks = m.TotalMarks,
                Grade = m.Grade
            }).ToList()
        };
    }
}

