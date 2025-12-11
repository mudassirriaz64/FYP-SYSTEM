namespace FYPSystem.API.Models;

public class Notification
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = NotificationTypes.General; // FormRelease, Deadline, Announcement, etc.

    // Form availability settings
    public string? RelatedFormType { get; set; } // FormA, FormB, FormC, FormD
    public DateTime? FormAvailableFrom { get; set; }
    public DateTime? FormDeadline { get; set; }

    // Target audience
    public string TargetAudience { get; set; } = "All"; // All, Students, Supervisors, Specific Department
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    // Metadata
    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 0; // 0 = Normal, 1 = Important, 2 = Urgent
}

public static class NotificationTypes
{
    public const string General = "General";
    public const string FormRelease = "FormRelease";
    public const string Deadline = "Deadline";
    public const string Announcement = "Announcement";
    public const string DefenseSchedule = "DefenseSchedule";
    public const string DefenseScheduled = "DefenseScheduled"; // For evaluators
    public const string GradeRelease = "GradeRelease";
    public const string DocumentSubmission = "DocumentSubmission";
}

public static class FormTypes
{
    public const string FormA = "FormA"; // Project Registration (Student fills)
    public const string FormB = "FormB"; // Supervisor Selection
    public const string FormC = "FormC"; // Progress Evaluation
    public const string FormD = "FormD"; // Final Defense/Completion
}

