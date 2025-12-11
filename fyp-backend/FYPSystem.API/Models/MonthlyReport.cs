namespace FYPSystem.API.Models;

public class MonthlyReport
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public int StudentId { get; set; }

    // Month tracking (1-8 for 8 monthly reports instead of calendar months)
    public int MonthNumber { get; set; } // 1-8
    public int Month { get; set; } // 1-12 (calendar month for reference)
    public int Year { get; set; }

    // Weekly meeting attendance tracking
    public int WeeklyMeetingsCompleted { get; set; } = 0; // Count of completed meetings (0-4)
    public bool CanSubmit { get; set; } = false; // True when 4 meetings are marked

    public string? ReportFilePath { get; set; }
    public string Status { get; set; } = ReportStatuses.Pending;
    public string? Summary { get; set; }
    public string? ChallengesFaced { get; set; }
    public string? NextMonthPlan { get; set; }
    public int? ProgressPercentage { get; set; }

    // Submission by Supervisor (not student - supervisor maintains and submits)
    public int? SubmittedById { get; set; }  // Supervisor who submitted
    public DateTime? SubmittedAt { get; set; }

    // Grading/Evaluation by Supervisor
    public decimal? SupervisorMarks { get; set; } // 0-10 scale per month
    public string? SupervisorRemarks { get; set; }
    public int? GradedById { get; set; }
    public DateTime? GradedAt { get; set; }

    // Coordinator Finalization (final approval)
    public bool IsFinalized { get; set; } = false;
    public int? FinalizedById { get; set; }
    public DateTime? FinalizedAt { get; set; }
    public string? CoordinatorRemarks { get; set; }

    // Escalation tracking
    public bool IsEscalated { get; set; }
    public DateTime? EscalatedAt { get; set; }
    public string? EscalationReason { get; set; }
    public bool HODWarningIssued { get; set; }
    public DateTime? HODWarningIssuedAt { get; set; }
    public string? HODWarningRemarks { get; set; }

    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public FYPGroup? Group { get; set; }
    public Student? Student { get; set; }
    public Staff? SubmittedBy { get; set; }
    public Staff? GradedBy { get; set; }
    public Staff? FinalizedBy { get; set; }
}

public static class ReportStatuses
{
    public const string Pending = "Pending"; // Waiting for 4 meetings
    public const string SubmittedBySupervisor = "SubmittedBySupervisor"; // Supervisor submitted
    public const string FinalizedByCoordinator = "FinalizedByCoordinator"; // Coordinator approved
    public const string Late = "Late";
    public const string Missing = "Missing";
}

// Model for tracking escalations
public class Escalation
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string Type { get; set; } = string.Empty; // MissedReports, Disciplinary, Other
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = EscalationStatuses.Open;
    public string Severity { get; set; } = EscalationSeverities.Warning; // Warning, Serious, Critical

    public int? ReportedById { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;

    public int? ResolvedById { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionNotes { get; set; }

    public int DepartmentId { get; set; }

    // Navigation
    public FYPGroup? Group { get; set; }
    public Staff? ReportedBy { get; set; }
    public Staff? ResolvedBy { get; set; }
    public Department? Department { get; set; }
}

public static class EscalationTypes
{
    public const string MissedReports = "MissedReports";
    public const string Disciplinary = "Disciplinary";
    public const string AcademicIntegrity = "AcademicIntegrity";
    public const string Other = "Other";
}

public static class EscalationStatuses
{
    public const string Open = "Open";
    public const string UnderReview = "UnderReview";
    public const string WarningIssued = "WarningIssued";
    public const string Resolved = "Resolved";
    public const string Closed = "Closed";
}

public static class EscalationSeverities
{
    public const string Warning = "Warning";
    public const string Serious = "Serious";
    public const string Critical = "Critical";
}

