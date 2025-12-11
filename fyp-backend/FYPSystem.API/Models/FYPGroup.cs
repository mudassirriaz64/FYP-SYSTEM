namespace FYPSystem.API.Models;

public class FYPGroup
{
    public int Id { get; set; }
    public string GroupName { get; set; } = string.Empty; // Auto-generated or custom
    public string? ProjectTitle { get; set; }
    public string? ProjectDescription { get; set; }
    
    // Degree info
    public string DegreeLevel { get; set; } = "Bachelor"; // Bachelor, Master
    public string DegreeProgram { get; set; } = string.Empty; // CS, CE, SE, etc.
    
    // Department
    public int DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    // Supervisor
    public int? SupervisorId { get; set; }
    public Staff? Supervisor { get; set; }
    public string SupervisorStatus { get; set; } = SupervisorStatuses.Pending; // Pending, Accepted, Rejected
    public DateTime? SupervisorResponseAt { get; set; }
    public string? SupervisorRemarks { get; set; }
    
    // Co-Supervisor (optional)
    public int? CoSupervisorId { get; set; }
    public Staff? CoSupervisor { get; set; }
    
    // Group Status
    public string Status { get; set; } = GroupStatuses.Forming; // Forming, PendingApproval, Active, Completed, Disbanded
    
    // Results tracking
    public bool ResultsCompiled { get; set; } = false;
    public DateTime? ResultsCompiledAt { get; set; }
    public bool ResultsPublished { get; set; } = false;
    public DateTime? ResultsPublishedAt { get; set; }
    
    // HOD Review
    public bool HODMarksReviewed { get; set; } = false;
    public int? HODReviewedById { get; set; }
    public DateTime? HODReviewedAt { get; set; }
    public string? HODReviewRemarks { get; set; }
    public string HODReviewStatus { get; set; } = HODReviewStatuses.Pending;
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    // Navigation
    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<Proposal> Proposals { get; set; } = new List<Proposal>();
}

public static class GroupStatuses
{
    public const string Forming = "Forming"; // Group is being formed, not all members joined
    public const string PendingApproval = "PendingApproval"; // Waiting for supervisor/coordinator approval
    public const string Active = "Active"; // Approved and working
    public const string Completed = "Completed"; // FYP completed
    public const string Disbanded = "Disbanded"; // Group was dissolved
    public const string Rejected = "Rejected"; // Proposal rejected - needs major revision
    public const string Deferred = "Deferred"; // Deferred - needs resubmission
}

public static class SupervisorStatuses
{
    public const string Pending = "Pending";
    public const string Accepted = "Accepted";
    public const string Rejected = "Rejected";
}

public static class HODReviewStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string NeedsRevision = "NeedsRevision";
    public const string Rejected = "Rejected";
}

