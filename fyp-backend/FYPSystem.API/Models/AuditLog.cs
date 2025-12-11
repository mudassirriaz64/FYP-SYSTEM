namespace FYPSystem.API.Models;

public class AuditLog
{
    public int Id { get; set; }

    // User who performed the action
    public int? UserId { get; set; }
    public User? User { get; set; }

    public int? StudentId { get; set; }
    public Student? Student { get; set; }

    public int? StaffId { get; set; }
    public Staff? Staff { get; set; }

    // Action details
    public required string Action { get; set; } // e.g., "Login", "PasswordChange", "CreateGroup", "SubmitForm"
    public required string ActionType { get; set; } // e.g., "Authentication", "UserManagement", "FormSubmission"
    public string? EntityType { get; set; } // e.g., "Student", "Staff", "FYPGroup", "Form"
    public int? EntityId { get; set; } // ID of the affected entity

    // Additional details
    public string? Description { get; set; } // Human-readable description
    public string? Details { get; set; } // JSON string with additional data

    // Request information
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    // Result
    public bool Success { get; set; } = true;
    public string? ErrorMessage { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public static class AuditActionTypes
{
    public const string Authentication = "Authentication";
    public const string UserManagement = "UserManagement";
    public const string FormSubmission = "FormSubmission";
    public const string GroupManagement = "GroupManagement";
    public const string DocumentManagement = "DocumentManagement";
    public const string GradeManagement = "GradeManagement";
    public const string SystemConfiguration = "SystemConfiguration";
    public const string DataAccess = "DataAccess";
}

public static class AuditActions
{
    // Authentication
    public const string Login = "Login";
    public const string LoginFailed = "LoginFailed";
    public const string Logout = "Logout";
    public const string PasswordChange = "PasswordChange";
    public const string PasswordReset = "PasswordReset";
    public const string PasswordResetRequest = "PasswordResetRequest";

    // User Management
    public const string CreateUser = "CreateUser";
    public const string UpdateUser = "UpdateUser";
    public const string DeleteUser = "DeleteUser";
    public const string CreateStudent = "CreateStudent";
    public const string UpdateStudent = "UpdateStudent";
    public const string DeleteStudent = "DeleteStudent";
    public const string CreateStaff = "CreateStaff";
    public const string UpdateStaff = "UpdateStaff";
    public const string DeleteStaff = "DeleteStaff";

    // Group Management
    public const string CreateGroup = "CreateGroup";
    public const string UpdateGroup = "UpdateGroup";
    public const string DeleteGroup = "DeleteGroup";
    public const string JoinGroup = "JoinGroup";
    public const string LeaveGroup = "LeaveGroup";
    public const string InviteMember = "InviteMember";
    public const string RemoveMember = "RemoveMember";

    // Form Submissions
    public const string SubmitFormA = "SubmitFormA";
    public const string SubmitFormB = "SubmitFormB";
    public const string SubmitFormC = "SubmitFormC";
    public const string SubmitFormD = "SubmitFormD";
    public const string ApproveForm = "ApproveForm";
    public const string RejectForm = "RejectForm";

    // System Configuration
    public const string UpdateSystemSettings = "UpdateSystemSettings";
    public const string CreateDepartment = "CreateDepartment";
    public const string UpdateDepartment = "UpdateDepartment";
    public const string DeleteDepartment = "DeleteDepartment";
}
