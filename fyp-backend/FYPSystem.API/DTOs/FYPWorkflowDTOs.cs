namespace FYPSystem.API.DTOs;

// ==================== Notification DTOs ====================
public class NotificationDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? RelatedFormType { get; set; }
    public DateTime? FormAvailableFrom { get; set; }
    public DateTime? FormDeadline { get; set; }
    public string TargetAudience { get; set; } = "All";
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
    public int Priority { get; set; }
    public bool IsFormAvailable { get; set; } // Computed: if form is currently available
    public int? DaysRemaining { get; set; } // Computed: days until deadline
}

public class CreateNotificationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "General";
    public string? RelatedFormType { get; set; }
    public DateTime? FormAvailableFrom { get; set; }
    public DateTime? FormDeadline { get; set; }
    public string TargetAudience { get; set; } = "All";
    public int? DepartmentId { get; set; }
    public int Priority { get; set; } = 0;
}

public class ReleaseFormRequest
{
    public string FormType { get; set; } = string.Empty;
    public int DaysAvailable { get; set; }
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string Priority { get; set; } = "Normal";
    public int? DepartmentId { get; set; }
}

// ==================== FYP Group DTOs ====================
public class FYPGroupDTO
{
    public int Id { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? ProjectTitle { get; set; }
    public string? ProjectDescription { get; set; }
    public string DegreeLevel { get; set; } = string.Empty;
    public string DegreeProgram { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int? SupervisorId { get; set; }
    public string? SupervisorName { get; set; }
    public string SupervisorStatus { get; set; } = string.Empty;
    public int? CoSupervisorId { get; set; }
    public string? CoSupervisorName { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<GroupMemberDTO> Members { get; set; } = new();
    public int MemberCount { get; set; }
    public bool AllMembersJoined { get; set; }
}

public class CreateGroupRequest
{
    public string? ProjectTitle { get; set; }
    public string? ProjectDescription { get; set; }
    public string DegreeLevel { get; set; } = "Bachelor";
    public string DegreeProgram { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public int? SupervisorId { get; set; }
    public List<int> MemberStudentIds { get; set; } = new(); // Student IDs to invite
}

public class UpdateGroupRequest
{
    public string? ProjectTitle { get; set; }
    public string? ProjectDescription { get; set; }
    public int? SupervisorId { get; set; }
}

// ==================== Group Member DTOs ====================
public class GroupMemberDTO
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string EnrollmentId { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsGroupManager { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? JoinedAt { get; set; }

    // Individual marks
    public decimal? ProposalMarks { get; set; }
    public decimal? MidEvalMarks { get; set; }
    public decimal? FinalEvalMarks { get; set; }
    public decimal? SupervisorMarks { get; set; }
    public decimal? TotalMarks { get; set; }
    public string? Grade { get; set; }
}

public class InviteMemberRequest
{
    public int StudentId { get; set; }
}

public class RespondToInviteRequest
{
    public bool Accept { get; set; }
}

// ==================== Proposal DTOs ====================
public class ProposalDTO
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string? GroupName { get; set; }
    public string? ProjectTitle { get; set; }
    public string? ProjectDescription { get; set; }
    public string? DegreeLevel { get; set; }
    public string? DegreeProgram { get; set; }
    public string? DepartmentName { get; set; }
    public string? SupervisorName { get; set; }
    public string FormType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }
    public int? ReviewedById { get; set; }
    public string? ReviewedByName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewRemarks { get; set; }
    public int RevisionNumber { get; set; }
    public DateTime CreatedAt { get; set; }

    // Student submissions
    public List<StudentFormSubmissionDTO> StudentSubmissions { get; set; } = new();
    public int TotalMembers { get; set; }
    public int SubmittedCount { get; set; }
    public bool AllMembersSubmitted { get; set; }
}

public class ReviewProposalRequest
{
    public string Status { get; set; } = string.Empty; // Approved, Rejected, RevisionRequired
    public string? Remarks { get; set; } // Frontend sends 'remarks'
    public string? ReviewRemarks { get; set; } // Backend compatibility
}

// ==================== Student Form Submission DTOs ====================
public class StudentFormSubmissionDTO
{
    public int Id { get; set; }
    public int ProposalId { get; set; }
    public int StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string EnrollmentNumber { get; set; } = string.Empty;
    public string CellNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PostalAddress { get; set; } = string.Empty;
    public bool IsGroupManager { get; set; }
    public bool IsSubmitted { get; set; }
    public DateTime? SubmittedAt { get; set; }
}

public class SubmitFormARequest
{
    public string FullName { get; set; } = string.Empty;
    public string EnrollmentNumber { get; set; } = string.Empty;
    public string CellNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PostalAddress { get; set; } = string.Empty;
    public bool IsGroupManager { get; set; } = false;
}

public class SubmitFormBRequest
{
    // Section 7 - Degree Project Type
    public string DegreeProjectType { get; set; } = "Project"; // Thesis or Project
    public string? ThesisDomain { get; set; } // ResearchThesis or ResearchPaper
    public string? ProjectDomain { get; set; } // Hardware, Software, HardwareSoftware

    // Section 8 - Project Source
    public string ProjectSource { get; set; } = "SelfDefined"; // Industrial or SelfDefined
    public bool IndustrialNotificationAttached { get; set; }
    public string? IndustrialReferenceList { get; set; }

    // Section 9-17
    public string WorkArea { get; set; } = string.Empty;
    public string ProblemStatement { get; set; } = string.Empty;
    public string Objectives { get; set; } = string.Empty;
    public string? Methodology { get; set; }
    public string? ProjectScope { get; set; }
    public string? Timeline { get; set; }
    public string? BudgetDescription { get; set; }
    public bool FundingRequired { get; set; }
    public string? ToolsSoftwareHardware { get; set; }

    // Supervisor selection
    public int SupervisorId { get; set; }

    // Agreement
    public bool AgreementAccepted { get; set; }
}

public class SubmitFormBWithTranscriptRequest
{
    // All FormB fields
    public string DegreeProjectType { get; set; } = "Project";
    public string? ThesisDomain { get; set; }
    public string? ProjectDomain { get; set; }
    public string ProjectSource { get; set; } = "SelfDefined";
    public bool IndustrialNotificationAttached { get; set; }
    public string? IndustrialReferenceList { get; set; }
    public string WorkArea { get; set; } = string.Empty;
    public string ProblemStatement { get; set; } = string.Empty;
    public string Objectives { get; set; } = string.Empty;
    public string? Methodology { get; set; }
    public string? ProjectScope { get; set; }
    public string? Timeline { get; set; }
    public string? BudgetDescription { get; set; }
    public bool FundingRequired { get; set; }
    public string? ToolsSoftwareHardware { get; set; }
    public int SupervisorId { get; set; }
    public bool AgreementAccepted { get; set; }

    // Transcript file upload
    public IFormFile? TranscriptFile { get; set; }
}

public class AssignSupervisorRequest
{
    public int SupervisorId { get; set; }
}

// ==================== List Response DTOs ====================
public class NotificationListResponse
{
    public List<NotificationDTO> Notifications { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class FYPGroupListResponse
{
    public List<FYPGroupDTO> Groups { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class ProposalListResponse
{
    public List<ProposalDTO> Proposals { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

// ==================== Student Dashboard DTOs ====================
public class StudentDashboardDTO
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string EnrollmentId { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }

    // Group info
    public FYPGroupDTO? CurrentGroup { get; set; }
    public bool HasGroup { get; set; }
    public bool IsGroupManager { get; set; }

    // Pending actions
    public List<NotificationDTO> ActiveNotifications { get; set; } = new();
    public List<PendingFormDTO> PendingForms { get; set; } = new();
    public List<GroupInviteDTO> PendingInvites { get; set; } = new();
}

public class PendingFormDTO
{
    public string FormType { get; set; } = string.Empty;
    public string FormName { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsSubmitted { get; set; }
    public int? ProposalId { get; set; }
}

public class GroupInviteDTO
{
    public int GroupMemberId { get; set; }
    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? ProjectTitle { get; set; }
    public string InvitedByName { get; set; } = string.Empty;
    public DateTime InvitedAt { get; set; }
}

