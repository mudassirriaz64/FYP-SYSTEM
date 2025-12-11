namespace FYPSystem.API.Models;

public class Proposal
{
    public int Id { get; set; }
    
    // Group reference
    public int GroupId { get; set; }
    public FYPGroup? Group { get; set; }
    
    // Form type (Form-A, Form-B, etc.)
    public string FormType { get; set; } = FormTypes.FormA;
    
    // Submission tracking
    public string Status { get; set; } = ProposalStatuses.Draft; // Draft, Submitted, UnderReview, Approved, Rejected, Revision
    public DateTime? SubmittedAt { get; set; }
    
    // Review info
    public int? ReviewedById { get; set; }
    public User? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewRemarks { get; set; }
    
    // Revision tracking
    public int RevisionNumber { get; set; } = 1;
    public int? PreviousVersionId { get; set; }
    public Proposal? PreviousVersion { get; set; }
    
    // File attachments (if any)
    public string? AttachmentPath { get; set; }
    
    // Form-specific data stored as JSON (for Form-B fields like problem statement, objectives, etc.)
    public string? FormData { get; set; }
    
    // Supervisor selection (for Form-B)
    public int? SelectedSupervisorId { get; set; }
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation - Individual student submissions for this proposal
    public ICollection<StudentFormSubmission> StudentSubmissions { get; set; } = new List<StudentFormSubmission>();
}

public static class ProposalStatuses
{
    public const string Draft = "Draft"; // Still being filled
    public const string Submitted = "Submitted"; // Submitted for review
    public const string UnderReview = "UnderReview"; // Being reviewed
    public const string Approved = "Approved"; // Approved by coordinator
    public const string Rejected = "Rejected"; // Rejected
    public const string Revision = "Revision"; // Needs revision
}

