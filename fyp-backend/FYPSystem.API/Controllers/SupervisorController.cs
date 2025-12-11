using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;
using FYPSystem.API.Services;
using System.Security.Claims;
using System.IO;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/supervisor")]
[Authorize(Roles = "Supervisor,Teacher,FYPCoordinator,HOD")]
public class SupervisorController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public SupervisorController(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    // GET: api/supervisor/debug - Debug endpoint to diagnose ID matching issues
    [HttpGet("debug")]
    public async Task<IActionResult> GetDebugInfo()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        var staffIdClaim = User.FindFirst("StaffId");

        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        int? staffIdFromJwt = staffIdClaim != null ? int.Parse(staffIdClaim.Value) : null;

        // Use the helper method to find staff correctly
        var staff = await GetStaffFromClaimsAsync();

        // Get all groups with pending supervisor status
        var pendingGroups = await _context.FYPGroups
            .Where(g => g.SupervisorStatus == SupervisorStatuses.Pending && g.SupervisorId != null)
            .Select(g => new { g.Id, g.GroupName, g.SupervisorId, g.SupervisorStatus })
            .ToListAsync();

        // Get all staff with name containing 'sadaf' or 'farhan' for debugging
        var relatedStaff = await _context.Staff
            .Where(s => s.FullName.ToLower().Contains("sadaf") || s.FullName.ToLower().Contains("farhan"))
            .Select(s => new { s.Id, s.FullName, s.UserId, s.IsSupervisor, s.Username })
            .ToListAsync();

        return Ok(new
        {
            jwtUserId = userId,
            jwtStaffId = staffIdFromJwt,
            staffFoundViaLookup = staff != null,
            staffId = staff?.Id,
            staffUserId = staff?.UserId,
            staffName = staff?.FullName,
            pendingGroupsInDb = pendingGroups,
            relatedStaffInDb = relatedStaff,
            matchingLogic = staff != null ? $"Looking for SupervisorId = {staff.Id}" : "No staff found"
        });
    }

    // Helper method to get staff from JWT claims
    private async Task<Staff?> GetStaffFromClaimsAsync()
    {
        // First try to get StaffId directly from JWT claim (most reliable)
        var staffIdClaim = User.FindFirst("StaffId");
        if (staffIdClaim != null && int.TryParse(staffIdClaim.Value, out int staffId))
        {
            return await _context.Staff.FirstOrDefaultAsync(s => s.Id == staffId);
        }

        // Fallback: Use User ID and look up Staff by UserId (prioritize UserId match)
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return null;

        var userId = int.Parse(userIdClaim.Value);

        // IMPORTANT: First try to find by UserId (the correct linkage)
        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);
        if (staff != null) return staff;

        // Only fall back to Id match if no UserId match found (legacy support)
        return await _context.Staff.FirstOrDefaultAsync(s => s.Id == userId);
    }

    // GET: api/supervisor/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        // Get assigned groups (match by Staff.Id)
        var groups = await _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Include(g => g.Department)
            .Where(g => g.SupervisorId == staff.Id && g.SupervisorStatus == SupervisorStatuses.Accepted)
            .ToListAsync();

        // Get pending requests
        var pendingRequests = await _context.FYPGroups
            .Where(g => g.SupervisorId == staff.Id && g.SupervisorStatus == SupervisorStatuses.Pending)
            .CountAsync();

        // Groups needing Form-D
        var pendingFormD = groups.Count(g =>
            g.Status == GroupStatuses.Active &&
            !_context.Proposals.Any(p => p.GroupId == g.Id && p.FormType == FormTypes.FormD && p.Status == ProposalStatuses.Submitted));

        // Groups needing grading
        var pendingGrading = groups.Count(g =>
            g.Members.Any(m => m.SupervisorMarks == null));

        return Ok(new
        {
            totalGroups = groups.Count,
            pendingRequests,
            pendingFormD,
            pendingGrading,
            groups = groups.Take(5).Select(g => new
            {
                g.Id,
                g.GroupName,
                g.ProjectTitle,
                g.Status,
                memberCount = g.Members.Count(m => m.Status == MemberStatuses.Accepted),
                acceptedAt = g.UpdatedAt
            }).ToList(),
            recentActivities = new List<object>()
        });
    }

    // GET: api/supervisor/requests
    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests()
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        var requests = await _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Include(g => g.Department)
            .Where(g => g.SupervisorId == staff.Id)
            .OrderByDescending(g => g.UpdatedAt)
            .Select(g => new
            {
                groupId = g.Id,
                g.GroupName,
                g.ProjectTitle,
                g.ProjectDescription,
                g.DegreeLevel,
                g.DegreeProgram,
                departmentName = g.Department != null ? g.Department.Name : null,
                memberCount = g.Members.Count(m => m.Status == MemberStatuses.Accepted),
                members = g.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Select(m => new
                    {
                        studentName = m.Student != null ? m.Student.FullName : "",
                        enrollmentId = m.Student != null ? m.Student.EnrollmentId : "",
                        m.IsGroupManager
                    }).ToList(),
                status = g.SupervisorStatus,
                requestedAt = g.UpdatedAt,
                respondedAt = g.SupervisorStatus != SupervisorStatuses.Pending ? g.UpdatedAt : (DateTime?)null
            })
            .ToListAsync();

        return Ok(new { requests });
    }

    // GET: api/supervisor/submissions - View submissions for supervised groups
    [HttpGet("submissions")]
    public async Task<IActionResult> GetSubmissions()
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return Unauthorized(new { message = "Staff profile not found" });
        }

        var groups = await _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Include(g => g.Department)
            .Where(g => g.SupervisorId == staff.Id && g.SupervisorStatus == SupervisorStatuses.Accepted)
            .ToListAsync();

        var groupIds = groups.Select(g => g.Id).ToList();

        var proposals = await _context.Proposals
            .Include(p => p.StudentSubmissions)
                .ThenInclude(ss => ss.Student)
            .Where(p => groupIds.Contains(p.GroupId))
            .ToListAsync();

        var documents = await _context.StudentDocuments
            .Include(d => d.Student)
            .Where(d => groupIds.Contains(d.GroupId))
            .ToListAsync();

        var result = groups.Select(g => new
        {
            GroupId = g.Id,
            GroupName = g.GroupName,
            ProjectTitle = g.ProjectTitle,
            DepartmentName = g.Department?.Name,
            Members = g.Members
                .Where(m => m.Status == MemberStatuses.Accepted)
                .Select(m => new
                {
                    m.StudentId,
                    StudentName = m.Student?.FullName,
                    EnrollmentId = m.Student?.EnrollmentId,
                    m.IsGroupManager
                })
                .ToList(),
            Documents = documents
                .Where(d => d.GroupId == g.Id)
                .Select(d => new
                {
                    d.Id,
                    d.DocumentType,
                    d.FileName,
                    d.FileSize,
                    d.Status,
                    d.WorkflowStatus,
                    d.UploadedAt,
                    StudentName = d.Student?.FullName
                })
                .ToList(),
            Proposals = proposals
                .Where(p => p.GroupId == g.Id)
                .Select(p => new
                {
                    p.Id,
                    p.FormType,
                    p.Status,
                    p.SubmittedAt,
                    p.ReviewRemarks
                })
                .ToList()
        }).ToList();

        return Ok(new { groups = result });
    }

    // GET: api/supervisor/submissions/document/{documentId}/download
    [HttpGet("submissions/document/{documentId}/download")]
    public async Task<IActionResult> DownloadSupervisorDocument(int documentId)
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return Unauthorized(new { message = "Staff profile not found" });
        }

        var document = await _context.StudentDocuments
            .Include(d => d.Group)
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null || document.Group == null || document.Group.SupervisorId != staff.Id)
        {
            return NotFound(new { message = "Document not found" });
        }

        if (!System.IO.File.Exists(document.FilePath))
        {
            return NotFound(new { message = "File not found on server" });
        }

        var memory = new MemoryStream();
        using (var stream = new FileStream(document.FilePath, FileMode.Open))
        {
            await stream.CopyToAsync(memory);
        }
        memory.Position = 0;

        return File(memory, document.ContentType ?? "application/octet-stream", document.FileName);
    }

    // POST: api/supervisor/requests/{groupId}/respond
    [HttpPost("requests/{groupId}/respond")]
    public async Task<IActionResult> RespondToRequest(int groupId, [FromBody] SupervisorResponseRequest request)
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        var group = await _context.FYPGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId && (g.SupervisorId == staff.Id || g.SupervisorId == staff.UserId));

        if (group == null)
        {
            return NotFound(new { message = "Request not found" });
        }

        if (group.SupervisorStatus != SupervisorStatuses.Pending)
        {
            return BadRequest(new { message = "Request has already been responded to" });
        }

        group.SupervisorStatus = request.Accept ? SupervisorStatuses.Accepted : SupervisorStatuses.Rejected;
        group.UpdatedAt = DateTime.UtcNow;

        // If accepted, automatically grant 7-day window for Form-D submission
        if (request.Accept)
        {
            // Update Form-B proposal status to Approved when supervisor accepts
            var formBProposal = await _context.Proposals
                .FirstOrDefaultAsync(p => p.GroupId == groupId && p.FormType == FormTypes.FormB);

            if (formBProposal != null)
            {
                formBProposal.Status = ProposalStatuses.Approved;
                formBProposal.ReviewedById = staff.Id;
                formBProposal.ReviewedAt = DateTime.UtcNow;
                formBProposal.ReviewRemarks = $"Supervisor accepted the supervision request. {request.Remarks ?? ""}".Trim();
                formBProposal.UpdatedAt = DateTime.UtcNow;
            }

            // If all members have joined, set group to Active (will be official after Form-D)
            if (group.Members.All(m => m.Status == MemberStatuses.Accepted))
            {
                group.Status = GroupStatuses.Active;
            }

            // Automatically create Form-D availability window (7 days from now)
            var formDDeadline = DateTime.UtcNow.AddDays(7);
            var formDNotification = new Notification
            {
                Title = "Form-D Submission Required",
                Message = $"You have 7 days to submit Form-D for group {group.GroupName}. This form is required to officially register the group.",
                Type = NotificationTypes.FormRelease,
                RelatedFormType = FormTypes.FormD,
                FormAvailableFrom = DateTime.UtcNow,
                FormDeadline = formDDeadline,
                TargetAudience = "Supervisor",
                DepartmentId = group.DepartmentId,
                Priority = 2, // Urgent
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(formDNotification);
        }

        // If rejected, clear supervisor
        if (!request.Accept)
        {
            group.SupervisorId = null;
        }

        // Create notification for students
        var notification = new Notification
        {
            Title = request.Accept ? "Supervisor Accepted" : "Supervisor Rejected",
            Message = request.Accept
                ? $"Your supervision request has been accepted by {staff.FullName}. The supervisor will submit Form-D within 7 days to officially register your group."
                : $"Your supervision request has been rejected. {request.Remarks ?? "Please find another supervisor."}",
            Type = NotificationTypes.Announcement,
            TargetAudience = "Group",
            DepartmentId = group.DepartmentId,
            Priority = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();

        return Ok(new { message = request.Accept ? "Request accepted successfully. You have 7 days to submit Form-D." : "Request rejected" });
    }

    // GET: api/supervisor/groups
    [HttpGet("groups")]
    public async Task<IActionResult> GetGroups([FromQuery] bool needsFormD = false)
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        var query = _context.FYPGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .Include(g => g.Department)
            .Where(g => g.SupervisorId == staff.Id && g.SupervisorStatus == SupervisorStatuses.Accepted);

        var groups = await query.ToListAsync();

        // Get proposals for each group to determine progress
        var groupIds = groups.Select(g => g.Id).ToList();
        var proposals = await _context.Proposals
            .Where(p => groupIds.Contains(p.GroupId))
            .ToListAsync();

        var defenses = await _context.Defenses
            .Where(d => groupIds.Contains(d.GroupId))
            .ToListAsync();

        var result = groups.Select(g =>
        {
            var groupProposals = proposals.Where(p => p.GroupId == g.Id).ToList();
            var groupDefenses = defenses.Where(d => d.GroupId == g.Id).ToList();

            return new
            {
                g.Id,
                g.GroupName,
                g.ProjectTitle,
                g.ProjectDescription,
                g.DegreeLevel,
                g.DegreeProgram,
                departmentName = g.Department?.Name,
                g.Status,
                memberCount = g.Members.Count(m => m.Status == MemberStatuses.Accepted),
                acceptedAt = g.UpdatedAt,
                members = g.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Select(m => new
                    {
                        m.Id,
                        studentName = m.Student?.FullName ?? "",
                        enrollmentId = m.Student?.EnrollmentId ?? "",
                        email = m.Student?.Email,
                        phone = m.Student?.Phone,
                        m.IsGroupManager,
                        m.SupervisorMarks
                    }).ToList(),
                // Progress flags
                formASubmitted = groupProposals.Any(p => p.FormType == FormTypes.FormA && p.Status == ProposalStatuses.Approved),
                formBSubmitted = groupProposals.Any(p => p.FormType == FormTypes.FormB && p.Status == ProposalStatuses.Approved),
                supervisorAccepted = true,
                proposalApproved = groupDefenses.Any(d => d.Type == DefenseTypes.Proposal && d.Result == DefenseResults.Accepted),
                formCSubmitted = groupProposals.Any(p => p.FormType == FormTypes.FormC && p.Status == ProposalStatuses.Approved),
                formDSubmitted = groupProposals.Any(p => p.FormType == FormTypes.FormD && (p.Status == ProposalStatuses.Submitted || p.Status == ProposalStatuses.Approved)),
                midTermCompleted = groupDefenses.Any(d => d.Type == DefenseTypes.MidTerm && d.Result == DefenseResults.Accepted),
                finalCompleted = groupDefenses.Any(d => d.Type == DefenseTypes.Final && d.Result == DefenseResults.Accepted)
            };
        }).ToList();

        // Filter for groups needing Form-D if requested
        if (needsFormD)
        {
            result = result.Where(g => !g.formDSubmitted).ToList();
        }

        return Ok(new { groups = result });
    }

    // GET: api/supervisor/form-d/status - Check if Form-D is available
    [HttpGet("form-d/status")]
    public async Task<IActionResult> GetFormDStatus()
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        var now = DateTime.UtcNow;
        var formDNotification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.IsActive &&
                                     n.Type == NotificationTypes.FormRelease &&
                                     n.RelatedFormType == FormTypes.FormD &&
                                     n.FormAvailableFrom <= now &&
                                     n.FormDeadline > now &&
                                     (n.TargetAudience == "All" || n.TargetAudience == "Supervisor" || n.TargetAudience == "Teacher") &&
                                     (n.DepartmentId == null || n.DepartmentId == staff.DepartmentId));

        return Ok(new
        {
            isAvailable = formDNotification != null,
            availableFrom = formDNotification?.FormAvailableFrom,
            deadline = formDNotification?.FormDeadline,
            message = formDNotification?.Message,
            daysRemaining = formDNotification != null ? (int)(formDNotification.FormDeadline!.Value - now).TotalDays : 0
        });
    }

    // POST: api/supervisor/form-d/submit
    [HttpPost("form-d/submit")]
    public async Task<IActionResult> SubmitFormD([FromBody] SubmitFormDRequest request)
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        var group = await _context.FYPGroups
            .FirstOrDefaultAsync(g => g.Id == request.GroupId && g.SupervisorId == staff.Id);

        if (group == null)
        {
            return NotFound(new { message = "Group not found or you are not the supervisor" });
        }

        // Check if supervisor status is accepted
        if (group.SupervisorStatus != SupervisorStatuses.Accepted)
        {
            return BadRequest(new { message = "You must accept the supervision request first before submitting Form-D." });
        }

        // Check if within 7-day window since accepting the supervision request
        var now = DateTime.UtcNow;
        var acceptanceDate = group.UpdatedAt ?? DateTime.UtcNow;
        var daysSinceAcceptance = (now - acceptanceDate).TotalDays;

        if (daysSinceAcceptance > 7)
        {
            return BadRequest(new { message = "Form-D submission window has expired. You had 7 days after accepting the supervision request." });
        }        // Check if Form-D already submitted
        var existingFormD = await _context.Proposals
            .FirstOrDefaultAsync(p => p.GroupId == request.GroupId && p.FormType == FormTypes.FormD);

        if (existingFormD != null && (existingFormD.Status == ProposalStatuses.Submitted || existingFormD.Status == ProposalStatuses.Approved))
        {
            return BadRequest(new { message = "Form-D has already been submitted for this group" });
        }

        // Create or update Form-D proposal
        if (existingFormD == null)
        {
            existingFormD = new Proposal
            {
                GroupId = request.GroupId,
                FormType = FormTypes.FormD,
                CreatedAt = DateTime.UtcNow
            };
            _context.Proposals.Add(existingFormD);
        }

        var formDData = new
        {
            request.ProjectTitle,
            request.SupervisorName,
            request.TelephoneNo,
            request.CellNo,
            request.EmailContact,
            request.FacultyType,
            request.Department,
            request.IsExternalSupervisor,
            request.CompanyLetterPath,
            request.WorkplaceAddress,
            request.Designation,
            request.SupervisorComments,
            request.SignatureData,
            request.SignatureDate,
            SubmittedById = staff.Id,
            SubmittedByName = staff.FullName,
            SubmittedAt = DateTime.UtcNow
        };

        existingFormD.FormData = System.Text.Json.JsonSerializer.Serialize(formDData);
        existingFormD.Status = ProposalStatuses.Submitted;
        existingFormD.SubmittedAt = DateTime.UtcNow;
        existingFormD.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Log Form-D submission
        await _auditLogService.LogFormSubmissionAsync(
            AuditActions.SubmitFormD,
            null,
            "FormD",
            existingFormD.Id,
            true,
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        // Notify coordinator
        var notification = new Notification
        {
            Title = "Form-D Submitted",
            Message = $"Supervisor {staff.FullName} has submitted Form-D endorsement for group {group.GroupName}.",
            Type = NotificationTypes.Announcement,
            TargetAudience = "Coordinator",
            DepartmentId = group.DepartmentId,
            Priority = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Form-D submitted successfully" });
    }

    // POST: api/supervisor/groups/{groupId}/marks
    [HttpPost("groups/{groupId}/marks")]
    public async Task<IActionResult> SubmitMarks(int groupId, [FromBody] SupervisorMarksRequest request)
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        var group = await _context.FYPGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId && g.SupervisorId == staff.Id);

        if (group == null)
        {
            return NotFound(new { message = "Group not found or you are not the supervisor" });
        }

        foreach (var memberMarks in request.Marks)
        {
            var member = group.Members.FirstOrDefault(m => m.Id == memberMarks.MemberId);
            if (member != null)
            {
                member.SupervisorMarks = memberMarks.SupervisorMarks;
                member.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Marks saved successfully" });
    }

    // GET: api/supervisor/groups/{groupId}/logs
    [HttpGet("groups/{groupId}/logs")]
    public async Task<IActionResult> GetGroupLogs(int groupId)
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null)
        {
            return BadRequest(new { message = "Staff profile not found" });
        }

        // Verify supervisor owns this group
        var group = await _context.FYPGroups
            .FirstOrDefaultAsync(g => g.Id == groupId && g.SupervisorId == staff.Id);

        if (group == null)
        {
            return NotFound(new { message = "Group not found or you are not the supervisor" });
        }

        // For now, return empty list - log forms need separate table
        // In future, implement StudentMeetingLogs table
        return Ok(new { logs = new List<object>() });
    }

    // POST: api/supervisor/logs/{logId}/review
    [HttpPost("logs/{logId}/review")]
    public async Task<IActionResult> ReviewLog(int logId, [FromBody] LogReviewRequest request)
    {
        // Placeholder for log review - needs StudentMeetingLogs table
        return Ok(new { message = request.Approved ? "Log approved" : "Log rejected" });
    }

    // GET: api/supervisor/documents/pending - Get pending log forms for review
    [HttpGet("documents/pending")]
    public async Task<IActionResult> GetPendingDocuments()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var staff = await GetStaffFromClaimsAsync();
        if (staff == null) return Unauthorized();

        // Get groups supervised by this staff
        var groupIds = await _context.FYPGroups
            .Where(g => g.SupervisorId == staff.Id && g.SupervisorStatus == SupervisorStatuses.Accepted)
            .Select(g => g.Id)
            .ToListAsync();

        // Get log forms (including already reviewed ones for history)
        var pendingDocuments = await _context.StudentDocuments
            .Include(d => d.Group)
            .Include(d => d.Student)
            .Where(d => groupIds.Contains(d.GroupId) &&
                       d.DocumentType.StartsWith("LogForm"))
            .OrderByDescending(d => d.UploadedAt)
            .Select(d => new
            {
                d.Id,
                d.DocumentType,
                d.FileName,
                d.FileSize,
                d.UploadedAt,
                d.Status,
                d.WorkflowStatus,
                d.SupervisorRemarks,
                GroupId = d.GroupId,
                GroupName = d.Group != null ? d.Group.GroupName : "",
                ProjectTitle = d.Group != null ? d.Group.ProjectTitle : "",
                StudentName = d.Student != null ? d.Student.FullName : "",
                StudentEnrollmentId = d.Student != null ? d.Student.EnrollmentId : ""
            })
            .ToListAsync();

        return Ok(new { documents = pendingDocuments });
    }

    // POST: api/supervisor/documents/{documentId}/review - Review log form
    [HttpPost("documents/{documentId}/review")]
    public async Task<IActionResult> ReviewDocument(int documentId, [FromBody] DocumentReviewRequest request)
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null) return Unauthorized();

        var document = await _context.StudentDocuments
            .Include(d => d.Group)
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null)
        {
            return NotFound(new { message = "Document not found" });
        }

        // Verify supervisor is assigned to this group
        if (document.Group == null || document.Group.SupervisorId != staff.Id)
        {
            return Forbid("You are not the supervisor for this group");
        }

        // Verify it's a log form and in correct workflow status
        if (!document.DocumentType.StartsWith("LogForm"))
        {
            return BadRequest(new { message = "Only log forms require supervisor review" });
        }

        if (document.WorkflowStatus != WorkflowStatuses.StudentSubmitted)
        {
            return BadRequest(new { message = "Document is not in correct status for supervisor review" });
        }

        // Update document with supervisor review
        document.SupervisorReviewedById = staff.Id;
        document.SupervisorReviewedAt = DateTime.UtcNow;
        document.SupervisorRemarks = request.Remarks;

        if (request.Approved)
        {
            document.WorkflowStatus = WorkflowStatuses.SupervisorReviewed;
            document.Status = DocumentStatuses.Approved;
        }
        else
        {
            document.WorkflowStatus = WorkflowStatuses.SupervisorRejected;
            document.Status = DocumentStatuses.RevisionRequired;
        }

        document.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = request.Approved ? "Document approved and forwarded to coordinator" : "Document rejected",
            document = new
            {
                document.Id,
                document.WorkflowStatus,
                document.Status,
                document.SupervisorRemarks
            }
        });
    }

    // GET: api/supervisor/documents/{documentId}/download - Download log form
    [HttpGet("documents/{documentId}/download")]
    public async Task<IActionResult> DownloadDocument(int documentId)
    {
        var staff = await GetStaffFromClaimsAsync();
        if (staff == null) return Unauthorized();

        var document = await _context.StudentDocuments
            .Include(d => d.Group)
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null) return NotFound(new { message = "Document not found" });

        // Verify supervisor is assigned to this group
        if (document.Group == null || document.Group.SupervisorId != staff.Id)
        {
            return Forbid("You are not the supervisor for this group");
        }

        var filePath = document.FilePath;
        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "File not found on server" });
        }

        var memory = new MemoryStream();
        using (var stream = new FileStream(filePath, FileMode.Open))
        {
            await stream.CopyToAsync(memory);
        }
        memory.Position = 0;

        return File(memory, document.ContentType ?? "application/octet-stream", document.FileName);
    }
}

// DTOs
public class SupervisorResponseRequest
{
    public bool Accept { get; set; }
    public string? Remarks { get; set; }
}

public class SubmitFormDRequest
{
    public int GroupId { get; set; }

    // 19. Title of Project being supervised
    public string ProjectTitle { get; set; } = string.Empty;

    // 20. Name of Supervisor
    public string SupervisorName { get; set; } = string.Empty;

    // 21. Telephone No & Cell No
    public string? TelephoneNo { get; set; }
    public string CellNo { get; set; } = string.Empty;

    // 22. Email Contact
    public string EmailContact { get; set; } = string.Empty;

    // 23. Supervisor Details
    public string FacultyType { get; set; } = "Permanent"; // Permanent or Visiting

    // 23a. Specify Department
    public string Department { get; set; } = "SE"; // CS, CE, SE, EE

    // 23b. For external Supervisor
    public bool IsExternalSupervisor { get; set; } = false;
    public string? CompanyLetterPath { get; set; } // Path to uploaded CV/letter
    public string? WorkplaceAddress { get; set; }

    // 24. Designation
    public string Designation { get; set; } = string.Empty;

    // 25. Supervisor Comments
    public string? SupervisorComments { get; set; }

    // 26. Supervisor Signature / Date
    public string? SignatureData { get; set; } // Base64 or path
    public DateTime SignatureDate { get; set; } = DateTime.UtcNow;
}

public class SupervisorMarksRequest
{
    public List<MemberMarksDto> Marks { get; set; } = new();
}

public class MemberMarksDto
{
    public int MemberId { get; set; }
    public decimal SupervisorMarks { get; set; }
    public object? Breakdown { get; set; }
    public string? Remarks { get; set; }
}

public class LogReviewRequest
{
    public bool Approved { get; set; }
    public string? Feedback { get; set; }
}

public class DocumentReviewRequest
{
    public bool Approved { get; set; }
    public string? Remarks { get; set; }
}

