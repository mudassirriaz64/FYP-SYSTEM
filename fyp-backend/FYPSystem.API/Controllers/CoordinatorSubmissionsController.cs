using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.Models;
using System.Security.Claims;
using System.Linq;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/coordinator/submissions")]
[Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator,Coordinator")]
public class CoordinatorSubmissionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CoordinatorSubmissionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/coordinator/submissions/all - Get all submissions (proposals + documents)
    [HttpGet("all")]
    public async Task<IActionResult> GetAllSubmissions([FromQuery] int? departmentId = null)
    {
        try
        {
            // Start with a simpler query to avoid potential navigation property issues
            var query = _context.FYPGroups.AsQueryable();

            if (departmentId.HasValue)
            {
                query = query.Where(g => g.DepartmentId == departmentId);
            }

            // Load groups with related data separately to avoid complex Include chains
            var groups = await query
                .Include(g => g.Department)
                .Include(g => g.Supervisor)
                .ToListAsync();

            // Load members separately for each group to avoid potential issues
            foreach (var group in groups)
            {
                await _context.Entry(group)
                    .Collection(g => g.Members)
                    .Query()
                    .Include(m => m.Student)
                    .LoadAsync();
            }

            // Fetch all proposals and documents in bulk to avoid N+1 queries
            var groupIds = groups.Select(g => g.Id).ToList();

            // Handle empty groupIds case
            List<Proposal> allProposals = new List<Proposal>();
            List<StudentDocument> allDocuments = new List<StudentDocument>();

            if (groupIds.Any())
            {
                allProposals = await _context.Proposals
                    .Include(p => p.StudentSubmissions)
                        .ThenInclude(ss => ss.Student)
                    .Where(p => groupIds.Contains(p.GroupId))
                    .ToListAsync();

                allDocuments = await _context.StudentDocuments
                    .Include(d => d.Student)
                    .Include(d => d.SupervisorReviewedBy)
                    .Where(d => groupIds.Contains(d.GroupId))
                    .ToListAsync();
            }

            var result = groups.Select(g => new
            {
                GroupId = g.Id,
                GroupName = g.GroupName,
                ProjectTitle = g.ProjectTitle,
                DepartmentId = g.DepartmentId,
                DepartmentName = g.Department != null ? g.Department.Name : null,
                SupervisorName = g.Supervisor != null ? g.Supervisor.FullName : null,
                Members = g.Members
                    .Where(m => m.Status == MemberStatuses.Accepted)
                    .Select(m => new
                    {
                        m.Id,
                        StudentName = m.Student != null ? m.Student.FullName : "",
                        EnrollmentId = m.Student != null ? m.Student.EnrollmentId : "",
                        IsGroupManager = m.IsGroupManager
                    })
                    .ToList(),

                // Proposals (Forms) - Filter from pre-loaded collection
                Proposals = allProposals
                    .Where(p => p.GroupId == g.Id)
                    .Select(p =>
                    {
                        string? submittedByName = null;
                        if (p.StudentSubmissions != null && p.StudentSubmissions.Any())
                        {
                            var firstSubmission = p.StudentSubmissions.FirstOrDefault();
                            if (firstSubmission != null)
                            {
                                submittedByName = firstSubmission.Student != null
                                    ? firstSubmission.Student.FullName
                                    : firstSubmission.FullName;
                            }
                        }

                        return new
                        {
                            Id = p.Id,
                            Type = "Proposal",
                            FormType = p.FormType,
                            DocumentType = p.FormType,
                            Status = p.Status,
                            SubmittedAt = p.SubmittedAt,
                            SubmittedByName = submittedByName,
                            HasAttachment = !string.IsNullOrEmpty(p.AttachmentPath),
                            FormData = p.FormData,
                            ReviewRemarks = p.ReviewRemarks,
                            // Individual student submissions for Form-A and Form-B
                            StudentSubmissions = p.StudentSubmissions
                                .Select(ss => new
                                {
                                    ss.Id,
                                    ss.StudentId,
                                    StudentName = ss.Student != null ? ss.Student.FullName : ss.FullName,
                                    ss.EnrollmentNumber,
                                    ss.CellNumber,
                                    ss.Email,
                                    ss.PostalAddress,
                                    ss.IsGroupManager,
                                    ss.IsSubmitted,
                                    ss.SubmittedAt,
                                    ss.AdditionalData,
                                    ss.TranscriptFileName,
                                    HasTranscript = !string.IsNullOrEmpty(ss.TranscriptPath)
                                })
                                .ToList()
                        };
                    })
                    .ToList(),

                // Documents (StudentDocuments) - Filter from pre-loaded collection
                Documents = allDocuments
                    .Where(d => d.GroupId == g.Id)
                    .Select(d => new
                    {
                        d.Id,
                        Type = "Document",
                        DocumentType = d.DocumentType,
                        FormType = d.DocumentType, // For compatibility
                        Status = d.Status,
                        WorkflowStatus = d.WorkflowStatus,
                        SubmittedAt = d.UploadedAt,
                        SubmittedByName = d.Student != null ? d.Student.FullName : null,
                        SupervisorName = d.SupervisorReviewedBy != null ? d.SupervisorReviewedBy.FullName : null,
                        SupervisorReviewedAt = d.SupervisorReviewedAt,
                        SupervisorRemarks = d.SupervisorRemarks,
                        CoordinatorFinalizedAt = d.CoordinatorFinalizedAt,
                        CoordinatorRemarks = d.CoordinatorRemarks,
                        d.FileName,
                        d.FileSize
                    })
                    .ToList()
            }).ToList();

            return Ok(new { groups = result });
        }
        catch (Exception ex)
        {
            // Log the full exception for debugging
            var errorDetails = new
            {
                message = "An error occurred while fetching submissions",
                error = ex.Message,
                innerException = ex.InnerException?.Message,
                stackTrace = ex.StackTrace
            };

            // Return detailed error in development, simplified in production
            return StatusCode(500, new { message = "An error occurred while fetching submissions", error = ex.Message, details = errorDetails });
        }
    }

    // GET: api/coordinator/submissions/document/{documentId}/download
    [HttpGet("document/{documentId}/download")]
    public async Task<IActionResult> DownloadDocument(int documentId)
    {
        var document = await _context.StudentDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null) return NotFound(new { message = "Document not found" });

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

    // GET: api/coordinator/submissions/proposal/{proposalId}/download
    [HttpGet("proposal/{proposalId}/download")]
    public async Task<IActionResult> DownloadProposal(int proposalId)
    {
        var proposal = await _context.Proposals
            .FirstOrDefaultAsync(p => p.Id == proposalId);

        if (proposal == null) return NotFound(new { message = "Proposal not found" });

        // Proposals might have file attachments - check if attachment path exists
        if (string.IsNullOrEmpty(proposal.AttachmentPath) || !System.IO.File.Exists(proposal.AttachmentPath))
        {
            return BadRequest(new { message = "Proposal file not available. Proposals are stored as form data, not files." });
        }

        var memory = new MemoryStream();
        using (var stream = new FileStream(proposal.AttachmentPath, FileMode.Open))
        {
            await stream.CopyToAsync(memory);
        }
        memory.Position = 0;

        return File(memory, "application/pdf", $"{proposal.FormType}_{proposalId}.pdf");
    }

    // GET: api/coordinator/submissions/proposal/{proposalId}/student/{studentSubmissionId}
    [HttpGet("proposal/{proposalId}/student/{studentSubmissionId}")]
    public async Task<IActionResult> GetStudentSubmission(int proposalId, int studentSubmissionId)
    {
        var submission = await _context.Set<StudentFormSubmission>()
            .Include(s => s.Student)
            .Include(s => s.Proposal)
            .FirstOrDefaultAsync(s => s.Id == studentSubmissionId && s.ProposalId == proposalId);

        if (submission == null)
        {
            return NotFound(new { message = "Student submission not found" });
        }

        return Ok(new
        {
            submission.Id,
            submission.StudentId,
            StudentName = submission.Student?.FullName ?? submission.FullName,
            submission.EnrollmentNumber,
            submission.CellNumber,
            submission.Email,
            submission.PostalAddress,
            submission.IsGroupManager,
            submission.IsSubmitted,
            submission.SubmittedAt,
            submission.AdditionalData,
            submission.TranscriptFileName,
            HasTranscript = !string.IsNullOrEmpty(submission.TranscriptPath),
            FormType = submission.Proposal?.FormType
        });
    }

    // GET: api/coordinator/submissions/student/{studentSubmissionId}/transcript
    [HttpGet("student/{studentSubmissionId}/transcript")]
    public async Task<IActionResult> DownloadTranscript(int studentSubmissionId)
    {
        var submission = await _context.Set<StudentFormSubmission>()
            .FirstOrDefaultAsync(s => s.Id == studentSubmissionId);

        if (submission == null)
        {
            return NotFound(new { message = "Student submission not found" });
        }

        if (string.IsNullOrEmpty(submission.TranscriptPath) || !System.IO.File.Exists(submission.TranscriptPath))
        {
            return NotFound(new { message = "Transcript not found" });
        }

        var memory = new MemoryStream();
        using (var stream = new FileStream(submission.TranscriptPath, FileMode.Open))
        {
            await stream.CopyToAsync(memory);
        }
        memory.Position = 0;

        return File(memory, "application/pdf", submission.TranscriptFileName ?? "transcript.pdf");
    }
}

