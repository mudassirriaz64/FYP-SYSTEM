namespace FYPSystem.API.DTOs;

public class StaffDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string StaffType { get; set; } = string.Empty;
    
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? DepartmentCode { get; set; }
    
    public bool IsHOD { get; set; }
    public bool IsFYPCoordinator { get; set; }
    public bool IsSupervisor { get; set; }
    public bool IsCommitteeMember { get; set; }
    
    public int? UserId { get; set; }
    public bool HasLoginAccount { get; set; }
    public string? Username { get; set; }
    
    public string? Designation { get; set; }
    public string? Qualification { get; set; }
    public string? Specialization { get; set; }
    
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateStaffRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string StaffType { get; set; } = "Teacher";
    public int? DepartmentId { get; set; }
    public string? Designation { get; set; }
    public string? Qualification { get; set; }
    public string? Specialization { get; set; }
    
    // Login account creation
    public bool CreateLoginAccount { get; set; } = false;
    public string? Username { get; set; }
    public string? Password { get; set; }
}

public class UpdateStaffRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string StaffType { get; set; } = "Teacher";
    public int? DepartmentId { get; set; }
    public string? Designation { get; set; }
    public string? Qualification { get; set; }
    public string? Specialization { get; set; }
    public bool IsActive { get; set; }
}

public class AssignDepartmentRoleRequest
{
    public bool IsHOD { get; set; }
    public bool IsFYPCoordinator { get; set; }
    public bool IsSupervisor { get; set; }
    public bool IsCommitteeMember { get; set; }
}

public class StaffListResponse
{
    public List<StaffDto> Staff { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class DepartmentStaffSummary
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public int TotalStaff { get; set; }
    public StaffDto? HOD { get; set; }
    public List<StaffDto> FYPCoordinators { get; set; } = new();
    public int SupervisorCount { get; set; }
}

