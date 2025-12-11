namespace FYPSystem.API.Models;

public class GroupMember
{
    public int Id { get; set; }
    
    // Group reference
    public int GroupId { get; set; }
    public FYPGroup? Group { get; set; }
    
    // Student reference
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    
    // Role in group
    public bool IsGroupManager { get; set; } = false; // The leader/manager of the group
    public string Role { get; set; } = MemberRoles.Member; // Manager, Member
    
    // Join status
    public string Status { get; set; } = MemberStatuses.Pending; // Pending, Accepted, Declined
    public DateTime? JoinedAt { get; set; }
    
    // Individual marks/grades (can be different per student)
    public decimal? ProposalMarks { get; set; }
    public decimal? MidEvalMarks { get; set; }
    public decimal? FinalEvalMarks { get; set; }
    public decimal? SupervisorMarks { get; set; }
    public decimal? TotalMarks { get; set; }
    public string? Grade { get; set; }
    public string? FinalResult { get; set; } // Approved, Deferred, Failed
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public static class MemberRoles
{
    public const string Manager = "Manager"; // Group manager/leader
    public const string Member = "Member"; // Regular member
}

public static class MemberStatuses
{
    public const string Pending = "Pending"; // Invitation sent, waiting for response
    public const string Accepted = "Accepted"; // Accepted invitation
    public const string Declined = "Declined"; // Declined invitation
}

