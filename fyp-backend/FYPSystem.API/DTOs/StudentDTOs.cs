namespace FYPSystem.API.DTOs;

public class StudentDto
{
    public int Id { get; set; }
    public string EnrollmentId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? DepartmentCode { get; set; }
    
    public string? Batch { get; set; }
    public string? Semester { get; set; }
    public string? CGPA { get; set; }
    
    public int? UserId { get; set; }
    public bool HasLoginAccount { get; set; }
    
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateStudentRequest
{
    public string EnrollmentId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public int? DepartmentId { get; set; }
    public string? Batch { get; set; }
    public string? Semester { get; set; }
    public string? CGPA { get; set; }
    
    // Optional: Create login account
    public bool CreateLoginAccount { get; set; } = false;
    public string? Username { get; set; }
    public string? Password { get; set; }
}

public class UpdateStudentRequest
{
    public string EnrollmentId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public int? DepartmentId { get; set; }
    public string? Batch { get; set; }
    public string? Semester { get; set; }
    public string? CGPA { get; set; }
    public bool IsActive { get; set; }
}

public class StudentListResponse
{
    public List<StudentDto> Students { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

