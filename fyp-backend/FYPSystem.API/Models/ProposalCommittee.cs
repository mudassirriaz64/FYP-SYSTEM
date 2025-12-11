namespace FYPSystem.API.Models;

/// <summary>
/// Represents a Proposal Defense Committee at the department level.
/// This is a shared committee that evaluates all proposal defenses.
/// </summary>
public class ProposalCommittee
{
    public int Id { get; set; }
    public string Name { get; set; } = "Proposal Defense Committee";
    public int DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    // Status: Pending (awaiting SuperAdmin approval), Active, Inactive
    public string Status { get; set; } = CommitteeStatuses.Pending;
    
    // Shared login account (created by SuperAdmin upon approval)
    public int? UserId { get; set; }
    public User? User { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public int CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public int? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    
    // Navigation
    public ICollection<ProposalCommitteeMember> Members { get; set; } = new List<ProposalCommitteeMember>();
}

/// <summary>
/// Represents a member of the Proposal Defense Committee.
/// These are senior teachers/staff who evaluate proposals.
/// </summary>
public class ProposalCommitteeMember
{
    public int Id { get; set; }
    public int CommitteeId { get; set; }
    public ProposalCommittee? Committee { get; set; }
    public int StaffId { get; set; }
    public Staff? Staff { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}

public static class CommitteeStatuses
{
    public const string Pending = "Pending";
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Rejected = "Rejected";
}
