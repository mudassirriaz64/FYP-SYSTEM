namespace FYPSystem.API.Models;

public class Student
{
    public int Id { get; set; }
    public string EnrollmentId { get; set; } = string.Empty; // Format: XX-XXXXXX-XXX
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    
    // Department relationship
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    // Academic info
    public string? Batch { get; set; } // e.g., "2021", "2022"
    public string? Semester { get; set; } // e.g., "Fall 2024", "Spring 2025"
    public string? CGPA { get; set; }
    
    // Login credentials (stored directly like Staff)
    public string? Username { get; set; } // Same as EnrollmentId
    public string? PasswordHash { get; set; }
    
    // Account linking (optional, for legacy support)
    public int? UserId { get; set; }
    public User? User { get; set; }
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

