namespace FYPSystem.API.Models;

public class Staff
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }

    // Staff Type: Teacher, FinanceOfficer
    public string StaffType { get; set; } = "Teacher";

    // Department relationship (nullable for Finance Officers who don't belong to a specific department)
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    // Department Roles (only applicable if DepartmentId is set)
    public bool IsHOD { get; set; } = false;
    public bool IsFYPCoordinator { get; set; } = false;
    public bool IsSupervisor { get; set; } = false; // Can supervise FYP projects
    public bool IsCommitteeMember { get; set; } = false; // Evaluation committee member - can be assigned as evaluator

    // Account linking (for login credentials)
    public int? UserId { get; set; }
    public User? User { get; set; }

    // Direct username/password storage (alternative to User link)
    public string? Username { get; set; }
    public string? PasswordHash { get; set; }

    public string? Designation { get; set; } // e.g., Professor, Assistant Professor, Lecturer
    public string? Qualification { get; set; } // e.g., PhD, MS
    public string? Specialization { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

// Staff Types as constants
public static class StaffTypes
{
    public const string Teacher = "Teacher";
    public const string FinanceOfficer = "FinanceOfficer";

    public static readonly string[] All = { Teacher, FinanceOfficer };
}

