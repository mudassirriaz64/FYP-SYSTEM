namespace FYPSystem.API.Models;

/// <summary>
/// Controls which document types are available for submission by students.
/// Coordinator unlocks documents when they want students to submit them.
/// </summary>
public class DocumentSubmissionControl
{
    public int Id { get; set; }
    public string DocumentType { get; set; } = string.Empty; // SRS, SDS, LogForm1-8, etc.
    public bool IsUnlocked { get; set; } = false; // False = Locked, True = Unlocked
    public DateTime? UnlockedAt { get; set; }
    public DateTime? LockedAt { get; set; }
    public DateTime? DeadlineDate { get; set; } // Optional deadline for submission
    
    // Who unlocked/locked it
    public int? UnlockedById { get; set; }
    public Staff? UnlockedBy { get; set; }
    public int? LockedById { get; set; }
    public Staff? LockedBy { get; set; }
    
    // Notification message when unlocked
    public string? UnlockMessage { get; set; }
    public string? Instructions { get; set; }
    
    // Department scope (null = all departments)
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    // Semester/Phase tracking
    public string? Phase { get; set; } // "PreMidTerm", "PostMidTerm", "Final"
    public int? Semester { get; set; } // 7 or 8
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public static class DocumentPhases
{
    public const string PreMidTerm = "PreMidTerm"; // After initial defense, before mid-term (LogForm1-4)
    public const string PostMidTerm = "PostMidTerm"; // After mid-term, before final (LogForm5-8)
    public const string Final = "Final"; // Final documents (Thesis, FinalReport, etc.)
}

