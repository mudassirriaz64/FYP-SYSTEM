namespace FYPSystem.API.Models;

/// <summary>
/// Individual student's submission for a form (Form-A, Form-B, etc.)
/// Each student fills their own section of the group form
/// </summary>
public class StudentFormSubmission
{
    public int Id { get; set; }

    // Proposal reference (the group's proposal this belongs to)
    public int ProposalId { get; set; }
    public Proposal? Proposal { get; set; }

    // Student reference
    public int StudentId { get; set; }
    public Student? Student { get; set; }

    // Form-A specific fields (student's individual info)
    public string FullName { get; set; } = string.Empty;
    public string EnrollmentNumber { get; set; } = string.Empty;
    public string CellNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PostalAddress { get; set; } = string.Empty;

    // Is this student the group manager?
    public bool IsGroupManager { get; set; } = false;

    // Submission status
    public bool IsSubmitted { get; set; } = false;
    public DateTime? SubmittedAt { get; set; }

    // Additional form fields (JSON for flexibility with different forms)
    public string? AdditionalData { get; set; } // JSON string for form-specific fields

    // Transcript attachment (for Form-B)
    public string? TranscriptPath { get; set; }
    public string? TranscriptFileName { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

