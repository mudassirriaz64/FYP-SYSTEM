namespace FYPSystem.API.DTOs;

public class LoginRequestDTO
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDTO
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public UserDTO? User { get; set; }
}

public class UserDTO
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // Primary/current role (for backward compatibility)
    public List<string> Roles { get; set; } = new List<string>(); // All roles user has access to
}

public class ForgotPasswordRequestDTO
{
    public string Username { get; set; } = string.Empty; // Can be enrollment ID for students or username for staff
    public string Email { get; set; } = string.Empty;
}

public class ForgotPasswordResponseDTO
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ResetToken { get; set; } // For development/testing - remove in production
}

public class ResetPasswordRequestDTO
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ResetPasswordResponseDTO
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ChangePasswordRequestDTO
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ChangePasswordResponseDTO
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class CredentialsInfoDTO
{
    public string Username { get; set; } = string.Empty; // For staff: username, For students: enrollment ID
    public string EnrollmentId { get; set; } = string.Empty; // Only for students
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool CanChangeUsername { get; set; } = false; // Username/Enrollment ID cannot be changed
}

public class AdminResetPasswordRequestDTO
{
    public int? UserId { get; set; }
    public int? StaffId { get; set; }
    public int? StudentId { get; set; }
    public string? Username { get; set; }
    public string NewPassword { get; set; } = string.Empty;
}

public class AdminResetPasswordResponseDTO
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

