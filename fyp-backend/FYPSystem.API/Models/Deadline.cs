namespace FYPSystem.API.Models;

public class Deadline
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // FormA, FormB, SRS, Thesis, ProposalDefense, etc.
    public DateTime DeadlineDate { get; set; }
    public string? Description { get; set; }
    public bool NotifyStudents { get; set; } = true;
    public bool NotifySupervisors { get; set; } = true;
    public int ReminderDays { get; set; } = 3;
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public int CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class Defense
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public FYPGroup? Group { get; set; }
    public string Type { get; set; } = DefenseTypes.Initial; // Initial, MidTerm, Final
    public DateTime DateTime { get; set; }
    public string? Venue { get; set; }
    public TimeSpan? Duration { get; set; } // Duration in hours/minutes
    public string Status { get; set; } = DefenseStatuses.Scheduled; // Scheduled, InProgress, Completed, Cancelled
    public string? Notes { get; set; }
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public int CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Defense Result (after defense is held)
    public string? Result { get; set; } // Accepted, Deferred, Rejected
    public string? ResultRemarks { get; set; }
    public DateTime? ResultEnteredAt { get; set; }
    public int? ResultEnteredById { get; set; }

    // Navigation
    public ICollection<DefenseEvaluator> Evaluators { get; set; } = new List<DefenseEvaluator>();
    public ICollection<DefenseMarks> Marks { get; set; } = new List<DefenseMarks>();
}

public static class DefenseResults
{
    public const string Accepted = "Accepted";
    public const string Deferred = "Deferred";
    public const string Rejected = "Rejected";
}

public class DefenseEvaluator
{
    public int Id { get; set; }
    public int DefenseId { get; set; }
    public Defense? Defense { get; set; }
    public int StaffId { get; set; }
    public Staff? Staff { get; set; }
    public bool IsExternal { get; set; } = false;
    public string Role { get; set; } = "Internal"; // Internal, External, Chairman
    public bool IsNotified { get; set; } = false;
    public DateTime? NotifiedAt { get; set; }
    public bool HasSubmittedMarks { get; set; } = false;
    public DateTime? MarksSubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class DefenseMarks
{
    public int Id { get; set; }

    public int DefenseId { get; set; }
    public Defense? Defense { get; set; }

    public int EvaluatorId { get; set; }
    public Staff? Evaluator { get; set; }

    // Marks breakdown based on defense type
    public decimal? PresentationMarks { get; set; }
    public decimal? TechnicalMarks { get; set; }
    public decimal? DocumentationMarks { get; set; }
    public decimal? QAMarks { get; set; }
    public decimal TotalMarks { get; set; }

    public string? Comments { get; set; }
    public string? Feedback { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

// Project evaluation tracking - Overall marks for entire project lifecycle
public class ProjectEvaluation
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public FYPGroup? Group { get; set; }

    // Marks breakdown (Total: 100)
    // 1. Following Timeline/Deadlines/Open House - Project Coordinator (10 marks)
    public decimal? CoordinatorTimelineMarks { get; set; }
    public int? CoordinatorEvaluatedById { get; set; }
    public Staff? CoordinatorEvaluatedBy { get; set; }
    public DateTime? CoordinatorEvaluatedAt { get; set; }
    public string? CoordinatorRemarks { get; set; }

    // 2. Regular Monthly Progress Reports - Supervisor (30 marks)
    public decimal? SupervisorProgressMarks { get; set; }
    public int? SupervisorEvaluatedById { get; set; }
    public Staff? SupervisorEvaluatedBy { get; set; }
    public DateTime? SupervisorEvaluatedAt { get; set; }
    public string? SupervisorRemarks { get; set; }

    // 3. Initial Project Defense - Evaluation Committee (15 marks)
    public decimal? InitialDefenseMarks { get; set; }
    public int? InitialDefenseId { get; set; }
    public Defense? InitialDefense { get; set; }

    // 4. Midterm Project Defense - Evaluation Committee (15 marks)
    public decimal? MidDefenseMarks { get; set; }
    public int? MidDefenseId { get; set; }
    public Defense? MidDefense { get; set; }

    // 5. Final Defense (Thesis/Demo/Viva) - Internal and External Examiner (30 marks)
    public decimal? FinalDefenseMarks { get; set; }
    public int? FinalDefenseId { get; set; }
    public Defense? FinalDefense { get; set; }

    // Calculated totals
    public decimal TotalMarks { get; set; }
    public decimal Percentage { get; set; }
    public string? Grade { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public static class DefenseTypes
{
    public const string Proposal = "Proposal"; // After Form-D approval
    public const string Initial = "Initial"; // Mid-semester 1 (15 marks)
    public const string MidTerm = "MidTerm"; // End of semester 1 (15 marks)
    public const string Final = "Final"; // End of semester 2 (30 marks)
}

public static class DefenseStatuses
{
    public const string Scheduled = "Scheduled";
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

