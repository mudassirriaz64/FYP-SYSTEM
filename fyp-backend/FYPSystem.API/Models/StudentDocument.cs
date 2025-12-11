namespace FYPSystem.API.Models;

public class StudentDocument
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public int StudentId { get; set; }
    public string DocumentType { get; set; } = string.Empty; // SRS, SDS, LogForm1-8, MonthlyReport, etc.
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
    public string Status { get; set; } = DocumentStatuses.Submitted; // Submitted, Approved, Rejected
    public string WorkflowStatus { get; set; } = WorkflowStatuses.StudentSubmitted; // StudentSubmitted, SupervisorReviewed, CoordinatorFinalized
    public string? ReviewRemarks { get; set; }
    public int? ReviewedById { get; set; }
    public DateTime? ReviewedAt { get; set; }
    
    // Supervisor Review (for Log Forms)
    public int? SupervisorReviewedById { get; set; }
    public Staff? SupervisorReviewedBy { get; set; }
    public DateTime? SupervisorReviewedAt { get; set; }
    public string? SupervisorRemarks { get; set; } // Supervisor can add comments/feedback
    
    // Coordinator Finalization
    public int? CoordinatorFinalizedById { get; set; }
    public Staff? CoordinatorFinalizedBy { get; set; }
    public DateTime? CoordinatorFinalizedAt { get; set; }
    public string? CoordinatorRemarks { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public FYPGroup? Group { get; set; }
    public Student? Student { get; set; }
    public Staff? ReviewedBy { get; set; }
}

public static class DocumentTypes
{
    public const string SRS = "SRS";
    public const string SDS = "SDS";
    public const string LogForm1 = "LogForm1";
    public const string LogForm2 = "LogForm2";
    public const string LogForm3 = "LogForm3";
    public const string LogForm4 = "LogForm4";
    public const string LogForm5 = "LogForm5";
    public const string LogForm6 = "LogForm6";
    public const string LogForm7 = "LogForm7";
    public const string LogForm8 = "LogForm8";
    public const string MonthlyReport = "MonthlyReport";
    public const string MidTermReport = "MidTermReport";
    public const string FinalReport = "FinalReport";
    public const string Thesis = "Thesis";
    public const string PlagiarismReport = "PlagiarismReport";
    public const string SourceCode = "SourceCode";
    public const string Poster = "Poster";
    public const string DemoVideo = "DemoVideo";
}

public static class DocumentStatuses
{
    public const string Submitted = "Submitted";
    public const string UnderReview = "UnderReview";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string RevisionRequired = "RevisionRequired";
}

public static class WorkflowStatuses
{
    public const string StudentSubmitted = "StudentSubmitted"; // Student uploaded, awaiting supervisor review
    public const string SupervisorReviewed = "SupervisorReviewed"; // Supervisor reviewed and approved, awaiting coordinator
    public const string CoordinatorFinalized = "CoordinatorFinalized"; // Coordinator finalized/locked
    public const string SupervisorRejected = "SupervisorRejected"; // Supervisor rejected, student needs to resubmit
}

