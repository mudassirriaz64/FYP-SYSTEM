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
[Route("api/student")]
[Authorize(Roles = "Student")]
public class StudentDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public StudentDashboardController(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    // GET: api/student/dashboard - Get student's dashboard data
    [HttpGet("dashboard")]
    public async Task<ActionResult<StudentDashboardDTO>> GetDashboard()
    {
        var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (studentIdClaim == null)
        {
            return Unauthorized();
        }

        var studentId = int.Parse(studentIdClaim.Value);

        // Find student by ID (JWT contains Student.Id directly for student logins)
        var student = await _context.Students
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => s.Id == studentId);

        if (student == null)
        {
            return BadRequest(new { message = "Student profile not found" });
        }

        // Get current group membership
        var groupMembership = await _context.GroupMembers
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Department)
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Supervisor)
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Members)
                    .ThenInclude(m => m.Student)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id &&
                                       (gm.Status == MemberStatuses.Accepted));

        // Get pending invitations
        var pendingInvites = await _context.GroupMembers
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Members)
                    .ThenInclude(m => m.Student)
            .Where(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Pending)
            .Select(gm => new GroupInviteDTO
            {
                GroupMemberId = gm.Id,
                GroupId = gm.GroupId,
                GroupName = gm.Group!.GroupName,
                ProjectTitle = gm.Group.ProjectTitle,
                InvitedByName = gm.Group.Members
                    .Where(m => m.IsGroupManager)
                    .Select(m => m.Student!.FullName)
                    .FirstOrDefault() ?? "Unknown",
                InvitedAt = gm.CreatedAt
            })
            .ToListAsync();

        // Get active notifications
        var now = DateTime.UtcNow;
        var activeNotifications = await _context.Notifications
            .Include(n => n.Department)
            .Include(n => n.CreatedBy)
            .Where(n => n.IsActive &&
                       (n.TargetAudience == "All" || n.TargetAudience == "Students") &&
                       (n.DepartmentId == null || n.DepartmentId == student.DepartmentId))
            .OrderByDescending(n => n.Priority)
            .ThenByDescending(n => n.CreatedAt)
            .Take(5)
            .ToListAsync();

        // Get pending forms (forms available but not yet submitted by this student)
        var pendingForms = new List<PendingFormDTO>();

        if (groupMembership != null)
        {
            // Get form notifications that are currently active
            var activeFormNotifications = await _context.Notifications
                .Where(n => n.IsActive &&
                           n.Type == NotificationTypes.FormRelease &&
                           n.FormAvailableFrom <= now &&
                           n.FormDeadline > now &&
                           (n.DepartmentId == null || n.DepartmentId == student.DepartmentId))
                .ToListAsync();

            foreach (var formNotif in activeFormNotifications)
            {
                // Check if student has already submitted this form
                var proposal = await _context.Proposals
                    .Include(p => p.StudentSubmissions)
                    .FirstOrDefaultAsync(p => p.GroupId == groupMembership.GroupId &&
                                              p.FormType == formNotif.RelatedFormType);

                var studentSubmission = proposal?.StudentSubmissions
                    .FirstOrDefault(ss => ss.StudentId == student.Id);

                pendingForms.Add(new PendingFormDTO
                {
                    FormType = formNotif.RelatedFormType!,
                    FormName = GetFormName(formNotif.RelatedFormType!),
                    Deadline = formNotif.FormDeadline!.Value,
                    DaysRemaining = (int)(formNotif.FormDeadline!.Value - now).TotalDays,
                    IsSubmitted = studentSubmission?.IsSubmitted ?? false,
                    ProposalId = proposal?.Id
                });
            }
        }

        // Build dashboard DTO
        var dashboard = new StudentDashboardDTO
        {
            StudentId = student.Id,
            StudentName = student.FullName,
            EnrollmentId = student.EnrollmentId,
            DepartmentName = student.Department?.Name,
            HasGroup = groupMembership != null,
            IsGroupManager = groupMembership?.IsGroupManager ?? false,
            CurrentGroup = groupMembership != null ? MapGroupToDto(groupMembership.Group!) : null,
            PendingInvites = pendingInvites,
            PendingForms = pendingForms,
            ActiveNotifications = activeNotifications.Select(n => new NotificationDTO
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                RelatedFormType = n.RelatedFormType,
                FormAvailableFrom = n.FormAvailableFrom,
                FormDeadline = n.FormDeadline,
                CreatedAt = n.CreatedAt,
                Priority = n.Priority,
                IsFormAvailable = n.Type == NotificationTypes.FormRelease &&
                                  n.FormAvailableFrom <= now &&
                                  n.FormDeadline > now,
                DaysRemaining = n.FormDeadline.HasValue && n.FormDeadline > now
                    ? (int)(n.FormDeadline.Value - now).TotalDays
                    : null
            }).ToList()
        };

        return Ok(dashboard);
    }

    // GET: api/student/my-group - Get student's current group
    [HttpGet("my-group")]
    public async Task<ActionResult<FYPGroupDTO>> GetMyGroup()
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

        var groupMembership = await _context.GroupMembers
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Department)
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Supervisor)
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Members)
                    .ThenInclude(m => m.Student)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMembership == null)
        {
            return NotFound(new { message = "You are not part of any group" });
        }

        return Ok(MapGroupToDto(groupMembership.Group!));
    }

    // GET: api/student/invitations - Get pending invitations
    [HttpGet("invitations")]
    public async Task<ActionResult<List<GroupInviteDTO>>> GetPendingInvitations()
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

        var invitations = await _context.GroupMembers
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Members)
                    .ThenInclude(m => m.Student)
            .Where(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Pending)
            .Select(gm => new GroupInviteDTO
            {
                GroupMemberId = gm.Id,
                GroupId = gm.GroupId,
                GroupName = gm.Group!.GroupName,
                ProjectTitle = gm.Group.ProjectTitle,
                InvitedByName = gm.Group.Members
                    .Where(m => m.IsGroupManager)
                    .Select(m => m.Student!.FullName)
                    .FirstOrDefault() ?? "Unknown",
                InvitedAt = gm.CreatedAt
            })
            .ToListAsync();

        return Ok(invitations);
    }

    // POST: api/student/forms/{formType}/submit - Submit individual form
    [HttpPost("forms/{formType}/submit")]
    public async Task<IActionResult> SubmitForm(string formType, [FromBody] SubmitFormARequest request)
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

        // Get student's group
        var groupMembership = await _context.GroupMembers
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMembership == null)
        {
            return BadRequest(new { message = "You must be in a group to submit forms" });
        }

        var group = groupMembership.Group!;

        // Check if form is available
        var now = DateTime.UtcNow;
        var formNotification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.IsActive &&
                                     n.Type == NotificationTypes.FormRelease &&
                                     n.RelatedFormType == formType &&
                                     n.FormAvailableFrom <= now &&
                                     n.FormDeadline > now &&
                                     (n.DepartmentId == null || n.DepartmentId == group.DepartmentId));

        if (formNotification == null)
        {
            return BadRequest(new { message = "This form is not currently available for submission" });
        }

        // Get or create proposal for this form
        var proposal = await _context.Proposals
            .Include(p => p.StudentSubmissions)
            .FirstOrDefaultAsync(p => p.GroupId == group.Id && p.FormType == formType);

        if (proposal == null)
        {
            proposal = new Proposal
            {
                GroupId = group.Id,
                FormType = formType,
                Status = ProposalStatuses.Draft,
                RevisionNumber = 1,
                CreatedAt = DateTime.UtcNow
            };
            _context.Proposals.Add(proposal);
            await _context.SaveChangesAsync();
        }

        // Check if already submitted
        var existingSubmission = proposal.StudentSubmissions
            .FirstOrDefault(ss => ss.StudentId == student.Id);

        if (existingSubmission != null && existingSubmission.IsSubmitted)
        {
            return BadRequest(new { message = "You have already submitted this form" });
        }

        // Create or update submission
        if (existingSubmission == null)
        {
            existingSubmission = new StudentFormSubmission
            {
                ProposalId = proposal.Id,
                StudentId = student.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.StudentFormSubmissions.Add(existingSubmission);
        }

        existingSubmission.FullName = request.FullName;
        existingSubmission.EnrollmentNumber = request.EnrollmentNumber;
        existingSubmission.CellNumber = request.CellNumber;
        existingSubmission.Email = request.Email;
        existingSubmission.PostalAddress = request.PostalAddress;
        existingSubmission.IsGroupManager = request.IsGroupManager;
        existingSubmission.IsSubmitted = true;
        existingSubmission.SubmittedAt = DateTime.UtcNow;
        existingSubmission.UpdatedAt = DateTime.UtcNow;

        // Update group manager status if claimed
        if (request.IsGroupManager)
        {
            groupMembership.IsGroupManager = true;
            groupMembership.Role = MemberRoles.Manager;
        }

        await _context.SaveChangesAsync();

        // Log form submission
        await _auditLogService.LogFormSubmissionAsync(
            AuditActions.SubmitFormA,
            studentId,
            "FormA",
            proposal.Id,
            true,
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        // Check if all group members have submitted
        var groupMembers = await _context.GroupMembers
            .Where(gm => gm.GroupId == group.Id && gm.Status == MemberStatuses.Accepted)
            .CountAsync();

        var submittedCount = await _context.StudentFormSubmissions
            .Where(ss => ss.ProposalId == proposal.Id && ss.IsSubmitted)
            .CountAsync();

        if (submittedCount >= groupMembers)
        {
            proposal.Status = ProposalStatuses.Submitted;
            proposal.SubmittedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            message = "Form submitted successfully",
            allMembersSubmitted = submittedCount >= groupMembers,
            submittedCount,
            totalMembers = groupMembers
        });
    }

    // POST: api/student/forms/FormB/submit-with-transcript - Submit Form-B with transcript upload
    [HttpPost("forms/FormB/submit-with-transcript")]
    public async Task<IActionResult> SubmitFormBWithTranscript([FromForm] SubmitFormBWithTranscriptRequest request)
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

        // Get student's group
        var groupMembership = await _context.GroupMembers
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMembership == null)
        {
            return BadRequest(new { message = "You must be in a group to submit forms" });
        }

        var group = groupMembership.Group!;

        // Get or create Form-B proposal
        var proposal = await _context.Proposals
            .Include(p => p.StudentSubmissions)
            .FirstOrDefaultAsync(p => p.GroupId == group.Id && p.FormType == FormTypes.FormB);

        if (proposal == null)
        {
            proposal = new Proposal
            {
                GroupId = group.Id,
                FormType = FormTypes.FormB,
                Status = ProposalStatuses.Draft,
                CreatedAt = DateTime.UtcNow
            };
            _context.Proposals.Add(proposal);
            await _context.SaveChangesAsync();
        }

        // Handle transcript file upload if provided
        string? transcriptPath = null;
        string? transcriptFileName = null;

        if (request.TranscriptFile != null && request.TranscriptFile.Length > 0)
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "transcripts");
            Directory.CreateDirectory(uploadsFolder);

            transcriptFileName = $"{student.EnrollmentId}_{DateTime.Now.Ticks}_{request.TranscriptFile.FileName}";
            transcriptPath = Path.Combine(uploadsFolder, transcriptFileName);

            using (var fileStream = new FileStream(transcriptPath, FileMode.Create))
            {
                await request.TranscriptFile.CopyToAsync(fileStream);
            }
        }

        // Store Form-B data
        var formBData = new
        {
            request.DegreeProjectType,
            request.ThesisDomain,
            request.ProjectDomain,
            request.ProjectSource,
            request.IndustrialNotificationAttached,
            request.IndustrialReferenceList,
            request.WorkArea,
            request.ProblemStatement,
            request.Objectives,
            request.Methodology,
            request.ProjectScope,
            request.Timeline,
            request.BudgetDescription,
            request.FundingRequired,
            request.ToolsSoftwareHardware
        };

        proposal.FormData = System.Text.Json.JsonSerializer.Serialize(formBData);
        proposal.SelectedSupervisorId = request.SupervisorId;
        proposal.UpdatedAt = DateTime.UtcNow;

        // Create/update student submission
        var existingSubmission = proposal.StudentSubmissions.FirstOrDefault(ss => ss.StudentId == student.Id);

        if (existingSubmission == null)
        {
            existingSubmission = new StudentFormSubmission
            {
                ProposalId = proposal.Id,
                StudentId = student.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.StudentFormSubmissions.Add(existingSubmission);
        }

        existingSubmission.FullName = student.FullName;
        existingSubmission.EnrollmentNumber = student.EnrollmentId;
        existingSubmission.Email = student.Email ?? "";
        existingSubmission.IsSubmitted = true;
        existingSubmission.SubmittedAt = DateTime.UtcNow;
        existingSubmission.UpdatedAt = DateTime.UtcNow;
        existingSubmission.TranscriptPath = transcriptPath;
        existingSubmission.TranscriptFileName = transcriptFileName;

        // Check if all members submitted
        var groupMembers = await _context.GroupMembers
            .Where(gm => gm.GroupId == group.Id && gm.Status == MemberStatuses.Accepted)
            .CountAsync();

        var submittedCount = await _context.StudentFormSubmissions
            .Where(ss => ss.ProposalId == proposal.Id && ss.IsSubmitted)
            .CountAsync();

        group.SupervisorId = request.SupervisorId;
        group.SupervisorStatus = SupervisorStatuses.Pending;
        group.UpdatedAt = DateTime.UtcNow;

        if (submittedCount >= groupMembers)
        {
            proposal.Status = ProposalStatuses.Submitted;
            proposal.SubmittedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Log form submission
        await _auditLogService.LogFormSubmissionAsync(
            AuditActions.SubmitFormB,
            studentId,
            "FormB",
            proposal.Id,
            true,
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        return Ok(new
        {
            message = "Form-B submitted successfully with transcript",
            allMembersSubmitted = submittedCount >= groupMembers,
            submittedCount,
            totalMembers = groupMembers
        });
    }

    // POST: api/student/forms/FormB/submit - Submit Form-B (legacy without transcript)
    [HttpPost("forms/FormB/submit")]
    public async Task<IActionResult> SubmitFormB([FromBody] SubmitFormBRequest request)
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

        // Get student's group
        var groupMembership = await _context.GroupMembers
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMembership == null)
        {
            return BadRequest(new { message = "You must be in a group to submit forms" });
        }

        var group = groupMembership.Group!;

        // Check if Form-A was approved
        var formAProposal = await _context.Proposals
            .FirstOrDefaultAsync(p => p.GroupId == group.Id && p.FormType == FormTypes.FormA);

        if (formAProposal == null || formAProposal.Status != ProposalStatuses.Approved)
        {
            return BadRequest(new { message = "Form-A must be approved before submitting Form-B" });
        }

        // Check if Form-B is available
        var now = DateTime.UtcNow;
        var formNotification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.IsActive &&
                                     n.Type == NotificationTypes.FormRelease &&
                                     n.RelatedFormType == FormTypes.FormB &&
                                     n.FormAvailableFrom <= now &&
                                     n.FormDeadline > now &&
                                     (n.DepartmentId == null || n.DepartmentId == group.DepartmentId));

        if (formNotification == null)
        {
            return BadRequest(new { message = "Form-B is not currently available for submission" });
        }

        // Validate supervisor
        var supervisor = await _context.Staff
            .FirstOrDefaultAsync(s => s.Id == request.SupervisorId && s.StaffType == StaffTypes.Teacher);

        if (supervisor == null)
        {
            return BadRequest(new { message = "Invalid supervisor selected" });
        }

        // Get or create Form-B proposal
        var proposal = await _context.Proposals
            .Include(p => p.StudentSubmissions)
            .FirstOrDefaultAsync(p => p.GroupId == group.Id && p.FormType == FormTypes.FormB);

        if (proposal == null)
        {
            proposal = new Proposal
            {
                GroupId = group.Id,
                FormType = FormTypes.FormB,
                Status = ProposalStatuses.Draft,
                RevisionNumber = 1,
                CreatedAt = DateTime.UtcNow
            };
            _context.Proposals.Add(proposal);
            await _context.SaveChangesAsync();
        }

        // Store Form-B data as JSON
        var formBData = new
        {
            request.DegreeProjectType,
            request.ThesisDomain,
            request.ProjectDomain,
            request.ProjectSource,
            request.IndustrialNotificationAttached,
            request.IndustrialReferenceList,
            request.WorkArea,
            request.ProblemStatement,
            request.Objectives,
            request.Methodology,
            request.ProjectScope,
            request.Timeline,
            request.BudgetDescription,
            request.FundingRequired,
            request.ToolsSoftwareHardware
        };

        proposal.FormData = System.Text.Json.JsonSerializer.Serialize(formBData);
        proposal.SelectedSupervisorId = request.SupervisorId;
        proposal.UpdatedAt = DateTime.UtcNow;

        // Create student submission record (acknowledgment)
        var existingSubmission = proposal.StudentSubmissions
            .FirstOrDefault(ss => ss.StudentId == student.Id);

        if (existingSubmission != null && existingSubmission.IsSubmitted)
        {
            return BadRequest(new { message = "You have already submitted Form-B" });
        }

        if (existingSubmission == null)
        {
            existingSubmission = new StudentFormSubmission
            {
                ProposalId = proposal.Id,
                StudentId = student.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.StudentFormSubmissions.Add(existingSubmission);
        }

        existingSubmission.FullName = student.FullName;
        existingSubmission.EnrollmentNumber = student.EnrollmentId;
        existingSubmission.Email = student.Email ?? "";
        existingSubmission.IsSubmitted = true;
        existingSubmission.SubmittedAt = DateTime.UtcNow;
        existingSubmission.UpdatedAt = DateTime.UtcNow;
        existingSubmission.AdditionalData = System.Text.Json.JsonSerializer.Serialize(new { request.AgreementAccepted });

        await _context.SaveChangesAsync();

        // Check if all group members have submitted
        var groupMembers = await _context.GroupMembers
            .Where(gm => gm.GroupId == group.Id && gm.Status == MemberStatuses.Accepted)
            .CountAsync();

        var submittedCount = await _context.StudentFormSubmissions
            .Where(ss => ss.ProposalId == proposal.Id && ss.IsSubmitted)
            .CountAsync();

        // Always register the supervisor request so the supervisor can respond
        group.SupervisorId = request.SupervisorId;
        group.SupervisorStatus = SupervisorStatuses.Pending;
        group.UpdatedAt = DateTime.UtcNow;

        if (submittedCount >= groupMembers)
        {
            proposal.Status = ProposalStatuses.Submitted;
            proposal.SubmittedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Form-B submitted successfully",
            allMembersSubmitted = submittedCount >= groupMembers,
            submittedCount,
            totalMembers = groupMembers
        });
    }

    // GET: api/student/forms/{formType}/status - Get form submission status
    [HttpGet("forms/{formType}/status")]
    public async Task<IActionResult> GetFormStatus(string formType)
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

        var groupMembership = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMembership == null)
        {
            return BadRequest(new { message = "You must be in a group to view form status" });
        }

        var proposal = await _context.Proposals
            .Include(p => p.StudentSubmissions)
                .ThenInclude(ss => ss.Student)
            .FirstOrDefaultAsync(p => p.GroupId == groupMembership.GroupId && p.FormType == formType);

        if (proposal == null)
        {
            return Ok(new
            {
                exists = false,
                message = "No submission found for this form"
            });
        }

        var groupMembers = await _context.GroupMembers
            .Include(gm => gm.Student)
            .Where(gm => gm.GroupId == groupMembership.GroupId && gm.Status == MemberStatuses.Accepted)
            .ToListAsync();

        var memberStatuses = groupMembers.Select(gm =>
        {
            var submission = proposal.StudentSubmissions.FirstOrDefault(ss => ss.StudentId == gm.StudentId);
            return new
            {
                studentId = gm.StudentId,
                studentName = gm.Student?.FullName,
                enrollmentId = gm.Student?.EnrollmentId,
                isSubmitted = submission?.IsSubmitted ?? false,
                submittedAt = submission?.SubmittedAt
            };
        }).ToList();

        return Ok(new
        {
            exists = true,
            proposalId = proposal.Id,
            proposalStatus = proposal.Status,
            submittedAt = proposal.SubmittedAt,
            memberStatuses,
            allSubmitted = memberStatuses.All(m => m.isSubmitted)
        });
    }

    private static string GetFormName(string formType)
    {
        return formType switch
        {
            FormTypes.FormA => "Form-A (Project Registration)",
            FormTypes.FormB => "Form-B (Supervisor Selection)",
            FormTypes.FormC => "Form-C (Progress Evaluation)",
            FormTypes.FormD => "Form-D (Final Defense)",
            _ => formType
        };
    }

    // GET: api/student/defenses - Get student's scheduled defenses
    [HttpGet("defenses")]
    public async Task<IActionResult> GetDefenses()
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

        // Get student's group
        var groupMembership = await _context.GroupMembers
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMembership == null)
        {
            return Ok(new { defenses = new List<object>(), groupStatus = (string?)null });
        }

        var group = groupMembership.Group!;

        // Get defenses for this group
        var defenses = await _context.Defenses
            .Include(d => d.Evaluators)
                .ThenInclude(e => e.Staff)
            .Where(d => d.GroupId == group.Id)
            .OrderBy(d => d.DateTime)
            .Select(d => new
            {
                d.Id,
                d.Type,
                d.DateTime,
                d.Venue,
                d.Status,
                d.Notes,
                d.Result,
                d.ResultRemarks,
                d.ResultEnteredAt,
                InternalEvaluators = d.Evaluators
                    .Where(e => !e.IsExternal)
                    .Select(e => new
                    {
                        e.Id,
                        e.StaffId,
                        FullName = e.Staff != null ? e.Staff.FullName : ""
                    }).ToList()
            })
            .ToListAsync();

        return Ok(new { defenses, groupStatus = group.Status });
    }

    // GET: api/student/progress - Get student's FYP progress
    [HttpGet("progress")]
    public async Task<IActionResult> GetProgress()
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

        // Get student's group
        var groupMembership = await _context.GroupMembers
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Supervisor)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMembership == null)
        {
            return Ok(new
            {
                hasGroup = false,
                stages = new List<object>(),
                marks = (object?)null
            });
        }

        var group = groupMembership.Group!;

        // Get all proposals for this group
        var proposals = await _context.Proposals
            .Include(p => p.StudentSubmissions)
            .Where(p => p.GroupId == group.Id)
            .ToListAsync();

        // Get defenses
        var defenses = await _context.Defenses
            .Where(d => d.GroupId == group.Id)
            .ToListAsync();

        // Build progress stages
        var formAProposal = proposals.FirstOrDefault(p => p.FormType == FormTypes.FormA);
        var formBProposal = proposals.FirstOrDefault(p => p.FormType == FormTypes.FormB);
        var formCProposal = proposals.FirstOrDefault(p => p.FormType == FormTypes.FormC);
        var proposalDefense = defenses.FirstOrDefault(d => d.Type == DefenseTypes.Proposal);
        var midTermDefense = defenses.FirstOrDefault(d => d.Type == DefenseTypes.MidTerm);
        var finalDefense = defenses.FirstOrDefault(d => d.Type == DefenseTypes.Final);

        var stages = new List<object>
        {
            new
            {
                id = 1,
                name = "Group Formation",
                description = "Form your FYP group with 2-3 members",
                status = "completed"
            },
            new
            {
                id = 2,
                name = "Form-A Submission",
                description = "Submit project registration form",
                status = formAProposal?.Status == ProposalStatuses.Approved ? "completed" :
                         formAProposal?.Status == ProposalStatuses.Submitted || formAProposal?.Status == ProposalStatuses.Draft ? "in_progress" :
                         "pending"
            },
            new
            {
                id = 3,
                name = "Form-B Submission",
                description = "Select and confirm your supervisor",
                status = formBProposal?.Status == ProposalStatuses.Approved || formBProposal?.Status == ProposalStatuses.Submitted ? "completed" :
                         formBProposal?.Status == ProposalStatuses.Draft ? "in_progress" :
                         formAProposal?.Status == ProposalStatuses.Approved ? "pending" : "pending"
            },
            new
            {
                id = 4,
                name = "Supervisor Approval",
                description = "Waiting for supervisor confirmation",
                status = group.SupervisorStatus == SupervisorStatuses.Accepted ? "completed" :
                         group.SupervisorStatus == SupervisorStatuses.Rejected ? "failed" :
                         group.SupervisorId != null ? "in_progress" : "pending"
            },
            new
            {
                id = 5,
                name = "Proposal Defense",
                description = "Present your proposal to the panel",
                status = proposalDefense?.Result == DefenseResults.Accepted ? "completed" :
                         proposalDefense?.Result == DefenseResults.Deferred ? "revision_needed" :
                         proposalDefense?.Result == DefenseResults.Rejected ? "failed" :
                         proposalDefense != null ? "in_progress" : "pending"
            },
            new
            {
                id = 6,
                name = "Form-C Submission",
                description = "UN SDGs and Complex Problem Analysis",
                status = formCProposal?.Status == ProposalStatuses.Approved ? "completed" :
                         formCProposal?.Status == ProposalStatuses.Submitted || formCProposal?.Status == ProposalStatuses.Draft ? "in_progress" :
                         "pending"
            },
            new
            {
                id = 7,
                name = "Mid-Term Defense",
                description = "Present 50-60% progress",
                status = midTermDefense?.Result == DefenseResults.Accepted ? "completed" :
                         midTermDefense?.Result == DefenseResults.Deferred ? "revision_needed" :
                         midTermDefense != null ? "in_progress" : "pending"
            },
            new
            {
                id = 8,
                name = "Final Defense",
                description = "Present your completed project",
                status = finalDefense?.Result == DefenseResults.Accepted ? "completed" :
                         finalDefense?.Result == DefenseResults.Deferred ? "revision_needed" :
                         finalDefense != null ? "in_progress" : "pending"
            },
            new
            {
                id = 9,
                name = "Project Completion",
                description = "Submit all final deliverables",
                status = group.Status == GroupStatuses.Completed ? "completed" : "pending"
            }
        };

        // Get marks
        object? marks = null;
        var member = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == group.Id && gm.StudentId == student.Id);

        if (member != null)
        {
            marks = new
            {
                proposalMarks = member.ProposalMarks,
                midEvalMarks = member.MidEvalMarks,
                supervisorMarks = member.SupervisorMarks,
                finalEvalMarks = member.FinalEvalMarks,
                totalMarks = member.TotalMarks,
                grade = member.Grade,
                finalResult = member.FinalResult
            };
        }

        return Ok(new
        {
            hasGroup = true,
            groupStatus = group.Status,
            supervisorStatus = group.SupervisorStatus,
            stages,
            marks
        });
    }

    // GET: api/student/documents - Get student's uploaded documents
    [HttpGet("documents")]
    public async Task<IActionResult> GetDocuments()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var studentId = int.Parse(userIdClaim.Value);
        var student = await _context.Students
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => s.Id == studentId);

        if (student == null)
        {
            return BadRequest(new { message = "Student profile not found" });
        }

        // Get student's group
        var groupMember = await _context.GroupMembers
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMember?.Group == null)
        {
            return Ok(new
            {
                documents = new List<object>(),
                availableUploads = new List<string>(),
                unlockedDocuments = new List<object>()
            });
        }

        var group = groupMember.Group;

        // Get uploaded documents for this group
        var documents = await _context.StudentDocuments
            .Include(d => d.SupervisorReviewedBy)
            .Include(d => d.CoordinatorFinalizedBy)
            .Where(d => d.GroupId == group.Id)
            .OrderByDescending(d => d.UploadedAt)
            .Select(d => new
            {
                d.Id,
                d.DocumentType,
                d.FileName,
                d.FileSize,
                d.Status,
                d.WorkflowStatus,
                d.UploadedAt,
                d.ReviewRemarks,
                d.SupervisorRemarks,
                d.SupervisorReviewedAt,
                SupervisorName = d.SupervisorReviewedBy != null ? d.SupervisorReviewedBy.FullName : null,
                d.CoordinatorFinalizedAt,
                CoordinatorName = d.CoordinatorFinalizedBy != null ? d.CoordinatorFinalizedBy.FullName : null
            })
            .ToListAsync();

        // Get unlocked documents (department-specific or global)
        var nowUtc = DateTime.UtcNow;
        var unlockedControls = await _context.DocumentSubmissionControls
            .Where(c => c.IsUnlocked &&
                       c.DeadlineDate.HasValue && c.DeadlineDate >= nowUtc &&
                       (c.DepartmentId == null || c.DepartmentId == group.DepartmentId))
            .Select(c => new
            {
                c.DocumentType,
                c.DeadlineDate,
                c.UnlockMessage,
                c.Instructions,
                c.Phase,
                c.Semester
            })
            .ToListAsync();

        var unlockedTypes = unlockedControls.Select(c => c.DocumentType).ToList();

        return Ok(new
        {
            documents,
            availableUploads = unlockedTypes, // Only unlocked documents can be uploaded
            unlockedDocuments = unlockedControls
        });
    }

    // GET: api/student/documents/{documentId}/download - Download an uploaded document
    [HttpGet("documents/{documentId}/download")]
    public async Task<IActionResult> DownloadDocument(int documentId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var studentId = int.Parse(userIdClaim.Value);

        // Confirm student and group membership
        var groupMember = await _context.GroupMembers
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.StudentId == studentId && gm.Status == MemberStatuses.Accepted);

        if (groupMember?.Group == null)
        {
            return BadRequest(new { message = "You must be part of a group to download documents" });
        }

        var document = await _context.StudentDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.GroupId == groupMember.GroupId);

        if (document == null)
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

    // POST: api/student/documents/upload
    [HttpPost("documents/upload")]
    public async Task<IActionResult> UploadDocument([FromForm] IFormFile file, [FromForm] string documentType)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var studentId = int.Parse(userIdClaim.Value);
        var student = await _context.Students
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => s.Id == studentId);

        if (student == null)
        {
            return BadRequest(new { message = "Student profile not found" });
        }

        // Get student's group
        var groupMember = await _context.GroupMembers
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMember?.Group == null)
        {
            return BadRequest(new { message = "You must be part of an active group to upload documents" });
        }

        var group = groupMember.Group;

        // Check if document type is unlocked
        var control = await _context.DocumentSubmissionControls
            .FirstOrDefaultAsync(c => c.DocumentType == documentType &&
                                      (c.DepartmentId == null || c.DepartmentId == group.DepartmentId));
        if (control == null || !control.IsUnlocked)
        {
            return BadRequest(new { message = $"Document type '{documentType}' is currently locked. Please wait for coordinator to unlock it." });
        }
        if (!control.DeadlineDate.HasValue)
        {
            return BadRequest(new { message = "Submission deadline not set. Please contact coordinator." });
        }
        if (control.DeadlineDate.Value < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Submission deadline has passed; document is locked." });
        }


        // For log forms, check if there's an existing document that's already finalized
        if (documentType.StartsWith("LogForm"))
        {
            var existingFinalized = await _context.StudentDocuments
                .AnyAsync(d => d.GroupId == group.Id &&
                              d.DocumentType == documentType &&
                              d.WorkflowStatus == WorkflowStatuses.CoordinatorFinalized);

            if (existingFinalized)
            {
                return BadRequest(new { message = "This log form has already been finalized by the coordinator and cannot be resubmitted." });
            }
        }

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded" });
        }

        // Validate file size (50MB max)
        if (file.Length > 50 * 1024 * 1024)
        {
            return BadRequest(new { message = "File size must be less than 50MB" });
        }

        // Validate file type
        var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".zip" };
        var fileExtension = Path.GetExtension(file.FileName).ToLower();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return BadRequest(new { message = "Only PDF, DOC, DOCX, and ZIP files are allowed" });
        }

        try
        {
            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "documents");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            // Generate unique filename
            var fileName = $"{group.Id}_{documentType}_{DateTime.UtcNow:yyyyMMddHHmmss}_{file.FileName}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Check if document already exists for this group (allow replacement)
            var existingDoc = await _context.StudentDocuments
                .FirstOrDefaultAsync(d => d.GroupId == group.Id &&
                                         d.DocumentType == documentType &&
                                         d.StudentId == student.Id);

            if (existingDoc != null)
            {
                // Delete old file if exists
                if (System.IO.File.Exists(existingDoc.FilePath))
                {
                    System.IO.File.Delete(existingDoc.FilePath);
                }

                // Update existing document (reset workflow if resubmitting)
                var isLogForm = documentType.StartsWith("LogForm");
                existingDoc.FileName = file.FileName;
                existingDoc.FilePath = filePath;
                existingDoc.FileSize = file.Length;
                existingDoc.ContentType = file.ContentType;
                existingDoc.Status = DocumentStatuses.Submitted;
                // Reset workflow status if resubmitting after rejection
                if (existingDoc.WorkflowStatus == WorkflowStatuses.SupervisorRejected)
                {
                    existingDoc.WorkflowStatus = WorkflowStatuses.StudentSubmitted;
                }
                existingDoc.UploadedAt = DateTime.UtcNow;
                existingDoc.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Determine workflow status based on document type
                // Log Forms go through: Student → Supervisor → Coordinator
                // Other documents: Student → Coordinator (direct)
                var isLogForm = documentType.StartsWith("LogForm");
                var workflowStatus = isLogForm
                    ? WorkflowStatuses.StudentSubmitted  // Log forms need supervisor review first
                    : WorkflowStatuses.StudentSubmitted; // Other docs also start here but can go direct to coordinator

                // Create new document record
                var document = new StudentDocument
                {
                    GroupId = group.Id,
                    StudentId = student.Id,
                    DocumentType = documentType,
                    FileName = file.FileName,
                    FilePath = filePath,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    Status = DocumentStatuses.Submitted,
                    WorkflowStatus = workflowStatus,
                    UploadedAt = DateTime.UtcNow
                };

                _context.StudentDocuments.Add(document);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Document uploaded successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to upload document", error = ex.Message });
        }
    }

    private static FYPGroupDTO MapGroupToDto(FYPGroup g)
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
                JoinedAt = m.JoinedAt
            }).ToList()
        };
    }
}

