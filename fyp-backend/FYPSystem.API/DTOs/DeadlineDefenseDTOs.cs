namespace FYPSystem.API.DTOs;

// ==================== Deadline DTOs ====================
public class DeadlineDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public string? Description { get; set; }
    public bool NotifyStudents { get; set; }
    public bool NotifySupervisors { get; set; }
    public int ReminderDays { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDeadlineRequest
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public string? Description { get; set; }
    public bool NotifyStudents { get; set; } = true;
    public bool NotifySupervisors { get; set; } = true;
    public int ReminderDays { get; set; } = 3;
    public int? DepartmentId { get; set; }
}

public class UpdateDeadlineRequest
{
    public string? Title { get; set; }
    public string? Type { get; set; }
    public DateTime? Deadline { get; set; }
    public string? Description { get; set; }
    public bool? NotifyStudents { get; set; }
    public bool? NotifySupervisors { get; set; }
    public int? ReminderDays { get; set; }
    public bool? IsActive { get; set; }
}

public class DeadlineListResponse
{
    public List<DeadlineDTO> Deadlines { get; set; } = new();
    public int TotalCount { get; set; }
}

// ==================== Defense DTOs ====================
public class DefenseDTO
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string? GroupName { get; set; }
    public string? ProjectTitle { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime DateTime { get; set; }
    public string? Venue { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public List<DefenseEvaluatorDTO> InternalEvaluators { get; set; } = new();
    public DefenseEvaluatorDTO? ExternalEvaluator { get; set; }
    public int? ExternalEvaluatorId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Result fields
    public string? Result { get; set; } // Accepted, Deferred, Rejected
    public string? ResultRemarks { get; set; }
    public DateTime? ResultEnteredAt { get; set; }
}

public class DefenseEvaluatorDTO
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public bool IsExternal { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class CreateDefenseRequest
{
    public int GroupId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime DateTime { get; set; }
    public string? Venue { get; set; }
    public string? Notes { get; set; }
    public bool NotifyParticipants { get; set; } = true;
    public List<int>? InternalEvaluatorIds { get; set; }
    public int? ExternalEvaluatorId { get; set; }
}

public class UpdateDefenseRequest
{
    public int? GroupId { get; set; }
    public string? Type { get; set; }
    public DateTime? DateTime { get; set; }
    public string? Venue { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
}

public class AllocatePanelRequest
{
    public List<int> InternalEvaluatorIds { get; set; } = new();
    public int? ExternalEvaluatorId { get; set; }
}

public class DefenseListResponse
{
    public List<DefenseDTO> Defenses { get; set; } = new();
    public int TotalCount { get; set; }
}

public class EnterDefenseResultsRequest
{
    public string Result { get; set; } = string.Empty; // Accepted, Deferred, Rejected
    public string? Remarks { get; set; }
    public Dictionary<int, MemberMarksEntry>? MemberMarks { get; set; }
}

public class MemberMarksEntry
{
    public decimal? Marks { get; set; }
    public string? Comments { get; set; }
}

// ==================== Results DTOs ====================
public class ResultsGroupDTO
{
    public int Id { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? ProjectTitle { get; set; }
    public int MemberCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsCompiled { get; set; }
    public bool IsPublished { get; set; }
    public decimal? AvgProposalMarks { get; set; }
    public decimal? AvgMidEvalMarks { get; set; }
    public decimal? AvgFinalEvalMarks { get; set; }
    public decimal? AvgSupervisorMarks { get; set; }
    public decimal? AvgTotalMarks { get; set; }
    public List<ResultsMemberDTO> Members { get; set; } = new();
}

public class ResultsMemberDTO
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string EnrollmentId { get; set; } = string.Empty;
    public decimal? ProposalMarks { get; set; }
    public decimal? MidEvalMarks { get; set; }
    public decimal? FinalEvalMarks { get; set; }
    public decimal? SupervisorMarks { get; set; }
    public decimal? TotalMarks { get; set; }
    public string? Grade { get; set; }
    public string? FinalResult { get; set; } // Approved, Deferred, Failed
}

public class UpdateMemberResultRequest
{
    public string? FinalResult { get; set; }
    public decimal? ProposalMarks { get; set; }
    public decimal? MidEvalMarks { get; set; }
    public decimal? FinalEvalMarks { get; set; }
    public decimal? SupervisorMarks { get; set; }
}

public class ResultsListResponse
{
    public List<ResultsGroupDTO> Groups { get; set; } = new();
    public int TotalCount { get; set; }
}

