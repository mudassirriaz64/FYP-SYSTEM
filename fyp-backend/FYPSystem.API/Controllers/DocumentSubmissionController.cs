using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
public class DocumentSubmissionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DocumentSubmissionController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/documentsubmission/controls
    [HttpGet("controls")]
    public async Task<IActionResult> GetDocumentControls([FromQuery] int? departmentId = null)
    {
        var query = _context.DocumentSubmissionControls
            .Include(d => d.Department)
            .Include(d => d.UnlockedBy)
            .Include(d => d.LockedBy)
            .AsQueryable();

        if (departmentId.HasValue)
        {
            query = query.Where(d => d.DepartmentId == null || d.DepartmentId == departmentId);
        }

        var controls = await query
            .OrderBy(d => d.DocumentType)
            .Select(d => new
            {
                d.Id,
                d.DocumentType,
                d.IsUnlocked,
                d.UnlockedAt,
                d.LockedAt,
                d.DeadlineDate,
                d.UnlockMessage,
                d.Instructions,
                d.Phase,
                d.Semester,
                DepartmentId = d.DepartmentId,
                DepartmentName = d.Department != null ? d.Department.Name : "All Departments",
                UnlockedByName = d.UnlockedBy != null ? d.UnlockedBy.FullName : null,
                LockedByName = d.LockedBy != null ? d.LockedBy.FullName : null
            })
            .ToListAsync();

        return Ok(new { controls });
    }

    // POST: api/documentsubmission/unlock
    [HttpPost("unlock")]
    public async Task<IActionResult> UnlockDocument([FromBody] UnlockDocumentRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.UserId == userId || s.Id == userId);

        if (staff == null) return Unauthorized();

        // Find or create control record
        var control = await _context.DocumentSubmissionControls
            .FirstOrDefaultAsync(c => c.DocumentType == request.DocumentType &&
                                     (c.DepartmentId == request.DepartmentId ||
                                      (c.DepartmentId == null && request.DepartmentId == null)));

        if (control == null)
        {
            control = new DocumentSubmissionControl
            {
                DocumentType = request.DocumentType,
                DepartmentId = request.DepartmentId,
                Phase = request.Phase,
                Semester = request.Semester,
                CreatedAt = DateTime.UtcNow
            };
            _context.DocumentSubmissionControls.Add(control);
        }

        control.IsUnlocked = true;
        control.UnlockedAt = DateTime.UtcNow;
        control.UnlockedById = staff.Id;
        control.DeadlineDate = request.DeadlineDate;
        control.UnlockMessage = request.Message;
        control.Instructions = request.Instructions;
        control.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Create notification for students
        if (request.NotifyStudents)
        {
            var groupsQuery = _context.FYPGroups
                .Include(g => g.Department)
                .AsQueryable();

            if (request.DepartmentId.HasValue)
            {
                groupsQuery = groupsQuery.Where(g => g.DepartmentId == request.DepartmentId);
            }

            var groups = await groupsQuery
                .Where(g => g.Status == GroupStatuses.Active)
                .ToListAsync();

            foreach (var group in groups)
            {
                var notification = new Notification
                {
                    Title = $"Document Submission Available: {request.DocumentType}",
                    Message = request.Message ?? $"You can now submit your {request.DocumentType} document.",
                    Type = NotificationTypes.DocumentSubmission,
                    DepartmentId = group.DepartmentId,
                    TargetAudience = "Students",
                    RelatedFormType = request.DocumentType,
                    CreatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };
                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            message = "Document unlocked successfully",
            control = new
            {
                control.Id,
                control.DocumentType,
                control.IsUnlocked,
                control.UnlockedAt,
                control.DeadlineDate
            }
        });
    }

    // POST: api/documentsubmission/lock
    [HttpPost("lock")]
    public async Task<IActionResult> LockDocument([FromBody] LockDocumentRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.UserId == userId || s.Id == userId);

        if (staff == null) return Unauthorized();

        var control = await _context.DocumentSubmissionControls
            .FirstOrDefaultAsync(c => c.DocumentType == request.DocumentType &&
                                     (c.DepartmentId == request.DepartmentId ||
                                      (c.DepartmentId == null && request.DepartmentId == null)));

        if (control == null)
        {
            return NotFound(new { message = "Document control not found" });
        }

        control.IsUnlocked = false;
        control.LockedAt = DateTime.UtcNow;
        control.LockedById = staff.Id;
        control.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Document locked successfully" });
    }

    // GET: api/documentsubmission/available (for students)
    [HttpGet("available")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetAvailableDocuments()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var student = await _context.Students
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => s.UserId == userId || s.Id == userId);

        if (student == null) return Unauthorized();

        // Get student's group
        var groupMember = await _context.GroupMembers
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.StudentId == student.Id && gm.Status == MemberStatuses.Accepted);

        if (groupMember?.Group == null)
        {
            return Ok(new { availableDocuments = new List<string>() });
        }

        // Get unlocked documents (department-specific or global)
        var availableDocuments = await _context.DocumentSubmissionControls
            .Where(c => c.IsUnlocked &&
                       (c.DepartmentId == null || c.DepartmentId == groupMember.Group.DepartmentId))
            .Select(c => c.DocumentType)
            .ToListAsync();

        return Ok(new { availableDocuments });
    }

    // GET: api/documentsubmission/documents/pending - Get documents pending coordinator finalization
    [HttpGet("documents/pending")]
    public async Task<IActionResult> GetPendingDocumentsForFinalization([FromQuery] int? departmentId = null)
    {
        var query = _context.StudentDocuments
            .Include(d => d.Group)
                .ThenInclude(g => g.Department)
            .Include(d => d.Student)
            .Include(d => d.SupervisorReviewedBy)
            .AsQueryable();

        if (departmentId.HasValue)
        {
            query = query.Where(d => d.Group != null && d.Group.DepartmentId == departmentId);
        }

        // Get documents that are supervisor-reviewed (for log forms) or student-submitted (for other docs)
        var pendingDocuments = await query
            .Where(d => d.WorkflowStatus == WorkflowStatuses.SupervisorReviewed ||
                       (d.WorkflowStatus == WorkflowStatuses.StudentSubmitted && !d.DocumentType.StartsWith("LogForm")))
            .OrderBy(d => d.UploadedAt)
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
                StudentEnrollmentId = d.Student != null ? d.Student.EnrollmentId : "",
                SupervisorName = d.SupervisorReviewedBy != null ? d.SupervisorReviewedBy.FullName : null,
                SupervisorReviewedAt = d.SupervisorReviewedAt,
                DepartmentId = d.Group != null ? (int?)d.Group.DepartmentId : null,
                DepartmentName = d.Group != null && d.Group.Department != null ? d.Group.Department.Name : null
            })
            .ToListAsync();

        return Ok(new { documents = pendingDocuments });
    }

    // POST: api/documentsubmission/documents/{documentId}/finalize - Coordinator finalizes/locks document
    [HttpPost("documents/{documentId}/finalize")]
    public async Task<IActionResult> FinalizeDocument(int documentId, [FromBody] FinalizeDocumentRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.UserId == userId || s.Id == userId);

        if (staff == null) return Unauthorized();

        var document = await _context.StudentDocuments
            .Include(d => d.Group)
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null)
        {
            return NotFound(new { message = "Document not found" });
        }

        // Verify document is ready for finalization
        var isLogForm = document.DocumentType.StartsWith("LogForm");
        if (isLogForm && document.WorkflowStatus != WorkflowStatuses.SupervisorReviewed)
        {
            return BadRequest(new { message = "Log form must be reviewed by supervisor first" });
        }

        if (!isLogForm && document.WorkflowStatus != WorkflowStatuses.StudentSubmitted)
        {
            return BadRequest(new { message = "Document is not in correct status for finalization" });
        }

        // Finalize document
        document.CoordinatorFinalizedById = staff.Id;
        document.CoordinatorFinalizedAt = DateTime.UtcNow;
        document.CoordinatorRemarks = request.Remarks;
        document.WorkflowStatus = WorkflowStatuses.CoordinatorFinalized;
        document.Status = DocumentStatuses.Approved;
        document.UpdatedAt = DateTime.UtcNow;

        // If this is Form-D approval, also update the corresponding proposal (Form-B) status
        if (document.DocumentType == "Form-D")
        {
            var proposal = await _context.Proposals
                .FirstOrDefaultAsync(p => p.GroupId == document.GroupId && p.FormType == "Form-B");

            if (proposal != null && proposal.Status != ProposalStatuses.Approved)
            {
                proposal.Status = ProposalStatuses.Approved;
                proposal.ReviewedAt = DateTime.UtcNow;
                proposal.ReviewedById = userId;
                proposal.ReviewRemarks = "Approved via Form-D finalization";
                proposal.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(); return Ok(new
        {
            message = "Document finalized and locked",
            document = new
            {
                document.Id,
                document.WorkflowStatus,
                document.Status,
                document.CoordinatorRemarks
            }
        });
    }
}

public class LockDocumentRequest
{
    public string DocumentType { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
}

public class FinalizeDocumentRequest
{
    public string? Remarks { get; set; }
}
