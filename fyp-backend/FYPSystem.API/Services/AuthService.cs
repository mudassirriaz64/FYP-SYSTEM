using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;

namespace FYPSystem.API.Services;

public interface IAuthService
{
    Task<LoginResponseDTO> LoginAsync(LoginRequestDTO request);
    Task<ForgotPasswordResponseDTO> ForgotPasswordAsync(ForgotPasswordRequestDTO request);
    Task<ResetPasswordResponseDTO> ResetPasswordAsync(ResetPasswordRequestDTO request);
    Task<ChangePasswordResponseDTO> ChangePasswordAsync(int userId, ChangePasswordRequestDTO request);
    Task<CredentialsInfoDTO> GetCredentialsInfoAsync(int userId);
    Task<AdminResetPasswordResponseDTO> AdminResetPasswordAsync(AdminResetPasswordRequestDTO request);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDTO> LoginAsync(LoginRequestDTO request)
    {
        // Determine if login is for student (Enrollment ID format: XX-XXXXXX-XXX) or staff (username)
        bool isEnrollmentId = System.Text.RegularExpressions.Regex.IsMatch(request.Username, @"^\d{2}-\d{6}-\d{3}$");

        User? user = null;
        Staff? staff = null; // Store staff reference for role collection
        string errorMessage = "Invalid username or password";
        string? actualRole = null; // Will be set based on staff flags if applicable
        List<string>? staffRoles = null; // Store all roles for staff

        if (isEnrollmentId)
        {
            // Student login: Find student by Enrollment ID and verify password directly from Student table
            var student = await _context.Students
                .Include(s => s.Department)
                .FirstOrDefaultAsync(s => s.EnrollmentId.ToUpper() == request.Username.ToUpper());

            if (student == null)
            {
                return new LoginResponseDTO
                {
                    Success = false,
                    Message = "Invalid enrollment ID or password"
                };
            }

            // Check if student is active
            if (!student.IsActive)
            {
                return new LoginResponseDTO
                {
                    Success = false,
                    Message = "Your account has been deactivated"
                };
            }

            // Check if student has login credentials (PasswordHash in Student table)
            if (string.IsNullOrEmpty(student.PasswordHash))
            {
                return new LoginResponseDTO
                {
                    Success = false,
                    Message = "No login credentials found. Please contact administrator."
                };
            }

            // Verify password directly from Student table
            if (!BCrypt.Net.BCrypt.Verify(request.Password, student.PasswordHash))
            {
                return new LoginResponseDTO
                {
                    Success = false,
                    Message = "Invalid enrollment ID or password"
                };
            }

            // Student authenticated successfully - generate token directly
            var studentToken = GenerateStudentJwtToken(student);

            return new LoginResponseDTO
            {
                Success = true,
                Message = "Login successful",
                Token = studentToken,
                User = new UserDTO
                {
                    Id = student.Id,
                    Username = student.EnrollmentId,
                    FullName = student.FullName,
                    Email = student.Email,
                    Role = "Student",
                    Roles = new List<string> { "Student" } // Add Roles array for consistency
                }
            };
        }
        else
        {
            // Staff login: Find user by username
            // First check Staff table for username (staff can have username stored in Staff table)
            staff = await _context.Staff
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Username != null && s.Username.ToLower() == request.Username.ToLower());

            if (staff != null && staff.User != null)
            {
                // Check if staff is active
                if (!staff.IsActive)
                {
                    return new LoginResponseDTO
                    {
                        Success = false,
                        Message = "Your account has been deactivated"
                    };
                }
                user = staff.User;

                // Collect ALL roles from staff flags (multi-role support)
                staffRoles = new List<string>();

                if (staff.IsHOD)
                {
                    staffRoles.Add("HOD");
                }
                if (staff.IsFYPCoordinator)
                {
                    staffRoles.Add("FYPCoordinator");
                    staffRoles.Add("Coordinator"); // Also add Coordinator alias
                }
                if (staff.IsSupervisor)
                {
                    staffRoles.Add("Supervisor");
                    staffRoles.Add("Teacher"); // Also add Teacher alias
                }
                if (staff.IsCommitteeMember)
                {
                    staffRoles.Add("Committee");
                }
                if (staff.StaffType == "FinanceOfficer")
                {
                    staffRoles.Add("Finance");
                }

                // If no roles found, use User table role
                if (staffRoles.Count == 0)
                {
                    staffRoles.Add(user.Role);
                }

                // Determine primary role based on priority: HOD > FYPCoordinator > Supervisor > Finance > User.Role
                if (staff.IsHOD)
                {
                    actualRole = "HOD";
                }
                else if (staff.IsFYPCoordinator)
                {
                    actualRole = "FYPCoordinator";
                }
                else if (staff.IsSupervisor)
                {
                    actualRole = "Supervisor";
                }
                else if (staff.StaffType == "FinanceOfficer")
                {
                    actualRole = "Finance";
                }
                else
                {
                    actualRole = user.Role; // Fallback to User table role
                }
            }
            else
            {
                // Try direct User table lookup (for SuperAdmin, etc. that don't have Staff record)
                user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower());

                // If user found, check if they have a linked Staff record
                if (user != null)
                {
                    staff = await _context.Staff
                        .FirstOrDefaultAsync(s => s.UserId == user.Id);

                    if (staff != null && staff.IsActive)
                    {
                        // Collect ALL roles from staff flags
                        staffRoles = new List<string>();

                        if (staff.IsHOD)
                        {
                            staffRoles.Add("HOD");
                        }
                        if (staff.IsFYPCoordinator)
                        {
                            staffRoles.Add("FYPCoordinator");
                            staffRoles.Add("Coordinator");
                        }
                        if (staff.IsSupervisor)
                        {
                            staffRoles.Add("Supervisor");
                            staffRoles.Add("Teacher");
                        }
                        if (staff.IsCommitteeMember)
                        {
                            staffRoles.Add("Committee");
                        }
                        if (staff.StaffType == "FinanceOfficer")
                        {
                            staffRoles.Add("Finance");
                        }

                        if (staffRoles.Count == 0)
                        {
                            staffRoles.Add(user.Role);
                        }

                        // Determine primary role
                        if (staff.IsHOD)
                        {
                            actualRole = "HOD";
                        }
                        else if (staff.IsFYPCoordinator)
                        {
                            actualRole = "FYPCoordinator";
                        }
                        else if (staff.IsSupervisor)
                        {
                            actualRole = "Supervisor";
                        }
                        else if (staff.StaffType == "FinanceOfficer")
                        {
                            actualRole = "Finance";
                        }
                    }
                }
            }

            if (user == null)
            {
                return new LoginResponseDTO
                {
                    Success = false,
                    Message = errorMessage
                };
            }
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return new LoginResponseDTO
            {
                Success = false,
                Message = errorMessage
            };
        }

        // Check if user is active
        if (!user.IsActive)
        {
            return new LoginResponseDTO
            {
                Success = false,
                Message = "Your account has been deactivated"
            };
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Collect all roles - use staffRoles if available, otherwise single role
        List<string> allRoles = staffRoles ?? new List<string> { user.Role };

        // Use determined role or fall back to user's stored role
        var roleToUse = !string.IsNullOrEmpty(actualRole) ? actualRole : user.Role;

        // Generate JWT token with all roles and staff ID if applicable
        var token = GenerateJwtToken(user, allRoles, staffId: staff?.Id);

        return new LoginResponseDTO
        {
            Success = true,
            Message = "Login successful",
            Token = token,
            User = new UserDTO
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                Role = roleToUse, // Primary role
                Roles = allRoles // All roles
            }
        };
    }

    private string GenerateJwtToken(User user, List<string>? roles = null, string? roleOverride = null, int? staffId = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? "YourSuperSecretKeyHere12345678901234567890"));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Use roles list if provided, otherwise use single role
        var rolesToUse = roles ?? new List<string> { roleOverride ?? user.Role };
        var primaryRole = rolesToUse.FirstOrDefault() ?? user.Role;

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, primaryRole), // Primary role for backward compatibility
            new Claim("FullName", user.FullName),
            new Claim("Email", user.Email ?? ""),
            new Claim("Roles", string.Join(",", rolesToUse)) // All roles as comma-separated string
        };

        // Add Staff ID claim if this is a staff member
        if (staffId.HasValue)
        {
            claims.Add(new Claim("StaffId", staffId.Value.ToString()));
        }

        // Add each role as a separate claim for proper authorization
        foreach (var role in rolesToUse)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var jwtToken = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "FYPSystem",
            audience: _configuration["Jwt:Audience"] ?? "FYPSystem",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(jwtToken);
    }

    private string GenerateStudentJwtToken(Student student)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? "YourSuperSecretKeyHere12345678901234567890"));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, student.Id.ToString()),
            new Claim(ClaimTypes.Name, student.EnrollmentId),
            new Claim(ClaimTypes.Role, "Student"),
            new Claim("FullName", student.FullName),
            new Claim("Email", student.Email ?? "")
        };

        var jwtToken = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "FYPSystem",
            audience: _configuration["Jwt:Audience"] ?? "FYPSystem",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(jwtToken);
    }

    public async Task<ForgotPasswordResponseDTO> ForgotPasswordAsync(ForgotPasswordRequestDTO request)
    {
        // Determine if username is enrollment ID or regular username
        bool isEnrollmentId = System.Text.RegularExpressions.Regex.IsMatch(request.Username, @"^\d{2}-\d{6}-\d{3}$");

        User? user = null;

        if (isEnrollmentId)
        {
            // Student: Find by enrollment ID
            var student = await _context.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.EnrollmentId.ToUpper() == request.Username.ToUpper() &&
                                         s.Email.ToLower() == request.Email.ToLower());

            if (student == null || student.User == null)
            {
                return new ForgotPasswordResponseDTO
                {
                    Success = false,
                    Message = "No account found with the provided Enrollment ID and Email"
                };
            }

            user = student.User;
        }
        else
        {
            // Staff: Find by username and email
            var staff = await _context.Staff
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => (s.Username != null && s.Username.ToLower() == request.Username.ToLower()) ||
                                         s.Email.ToLower() == request.Email.ToLower());

            if (staff != null && staff.User != null)
            {
                // Verify email matches
                if (staff.Email.ToLower() != request.Email.ToLower())
                {
                    return new ForgotPasswordResponseDTO
                    {
                        Success = false,
                        Message = "Email does not match the provided username"
                    };
                }
                user = staff.User;
            }
            else
            {
                // Try direct User lookup
                user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() &&
                                             u.Email.ToLower() == request.Email.ToLower());
            }

            if (user == null)
            {
                return new ForgotPasswordResponseDTO
                {
                    Success = false,
                    Message = "No account found with the provided Username and Email"
                };
            }
        }

        // Check if user is active
        if (!user.IsActive)
        {
            return new ForgotPasswordResponseDTO
            {
                Success = false,
                Message = "Your account has been deactivated. Please contact administrator."
            };
        }

        // Generate reset token (for development, we'll use a simple token)
        // In production, this should be sent via email
        var resetToken = Guid.NewGuid().ToString();
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(24); // Token valid for 24 hours
        await _context.SaveChangesAsync();

        // In production, send email with reset link
        // For development, return token (remove in production)
        return new ForgotPasswordResponseDTO
        {
            Success = true,
            Message = "Password reset instructions have been sent to your email. " +
                     $"For development: Use token {resetToken}",
            ResetToken = resetToken // Remove this in production
        };
    }

    public async Task<ResetPasswordResponseDTO> ResetPasswordAsync(ResetPasswordRequestDTO request)
    {
        if (request.NewPassword != request.ConfirmPassword)
        {
            return new ResetPasswordResponseDTO
            {
                Success = false,
                Message = "New password and confirm password do not match"
            };
        }

        if (request.NewPassword.Length < 6)
        {
            return new ResetPasswordResponseDTO
            {
                Success = false,
                Message = "Password must be at least 6 characters long"
            };
        }

        // Find user by reset token
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token &&
                                     u.PasswordResetTokenExpiry.HasValue &&
                                     u.PasswordResetTokenExpiry.Value > DateTime.UtcNow);

        if (user == null)
        {
            return new ResetPasswordResponseDTO
            {
                Success = false,
                Message = "Invalid or expired reset token"
            };
        }

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await _context.SaveChangesAsync();

        // Also update password in Staff table if exists
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (staff != null && !string.IsNullOrWhiteSpace(staff.Username))
        {
            staff.PasswordHash = user.PasswordHash;
            await _context.SaveChangesAsync();
        }

        return new ResetPasswordResponseDTO
        {
            Success = true,
            Message = "Password has been reset successfully. You can now login with your new password."
        };
    }

    public async Task<ChangePasswordResponseDTO> ChangePasswordAsync(int userId, ChangePasswordRequestDTO request)
    {
        if (request.NewPassword != request.ConfirmPassword)
        {
            return new ChangePasswordResponseDTO
            {
                Success = false,
                Message = "New password and confirm password do not match"
            };
        }

        if (request.NewPassword.Length < 6)
        {
            return new ChangePasswordResponseDTO
            {
                Success = false,
                Message = "Password must be at least 6 characters long"
            };
        }

        // Find user
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return new ChangePasswordResponseDTO
            {
                Success = false,
                Message = "User not found"
            };
        }

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return new ChangePasswordResponseDTO
            {
                Success = false,
                Message = "Current password is incorrect"
            };
        }

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        // Also update password in Staff table if exists
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (staff != null && !string.IsNullOrWhiteSpace(staff.Username))
        {
            staff.PasswordHash = user.PasswordHash;
            await _context.SaveChangesAsync();
        }

        return new ChangePasswordResponseDTO
        {
            Success = true,
            Message = "Password has been changed successfully"
        };
    }

    public async Task<CredentialsInfoDTO> GetCredentialsInfoAsync(int userId)
    {
        // Get user info
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new Exception("User not found");
        }

        // Check if user is a student (username matches enrollment ID format)
        bool isStudent = System.Text.RegularExpressions.Regex.IsMatch(user.Username, @"^\d{2}-\d{6}-\d{3}$");

        string enrollmentId = string.Empty;

        if (isStudent)
        {
            // Get student record to confirm enrollment ID
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student != null)
            {
                enrollmentId = student.EnrollmentId;
            }
            else
            {
                enrollmentId = user.Username; // Fallback
            }
        }

        return new CredentialsInfoDTO
        {
            Username = user.Username,
            EnrollmentId = enrollmentId,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Role = user.Role,
            CanChangeUsername = false // Username/Enrollment ID cannot be changed
        };
    }

    public async Task<AdminResetPasswordResponseDTO> AdminResetPasswordAsync(AdminResetPasswordRequestDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return new AdminResetPasswordResponseDTO
            {
                Success = false,
                Message = "New password is required"
            };
        }

        if (request.NewPassword.Length < 6)
        {
            return new AdminResetPasswordResponseDTO
            {
                Success = false,
                Message = "Password must be at least 6 characters long"
            };
        }

        User? user = null;

        // Priority 1: userId provided
        if (request.UserId.HasValue)
        {
            user = await _context.Users.FindAsync(request.UserId.Value);
            if (user == null)
            {
                return new AdminResetPasswordResponseDTO
                {
                    Success = false,
                    Message = "User not found"
                };
            }
        }
        else if (request.StaffId.HasValue)
        {
            // Priority 2: staffId provided - create user if missing
            var staff = await _context.Staff
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == request.StaffId.Value);

            if (staff == null)
            {
                return new AdminResetPasswordResponseDTO
                {
                    Success = false,
                    Message = "Staff member not found"
                };
            }

            if (staff.User != null)
            {
                user = staff.User;
            }
            else
            {
                // Create a new user for this staff
                var username = !string.IsNullOrWhiteSpace(staff.Username)
                    ? staff.Username
                    : (!string.IsNullOrWhiteSpace(staff.Email) ? staff.Email.Split('@')[0] : $"staff{staff.Id}");

                // Ensure username is unique
                var uniqueUsername = username;
                int suffix = 1;
                while (await _context.Users.AnyAsync(u => u.Username.ToLower() == uniqueUsername.ToLower()))
                {
                    uniqueUsername = $"{username}{suffix++}";
                }

                var newUser = new User
                {
                    Username = uniqueUsername,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword),
                    FullName = staff.FullName,
                    Email = staff.Email,
                    Role = staff.StaffType == StaffTypes.FinanceOfficer ? "Finance" : "Supervisor",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                staff.UserId = newUser.Id;
                staff.Username = uniqueUsername;
                staff.PasswordHash = newUser.PasswordHash;
                await _context.SaveChangesAsync();

                user = newUser;
            }
        }
        else if (request.StudentId.HasValue)
        {
            // Priority 3: studentId provided - store password directly in Student table
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == request.StudentId.Value);

            if (student == null)
            {
                return new AdminResetPasswordResponseDTO
                {
                    Success = false,
                    Message = "Student not found"
                };
            }

            // Store password directly in Student table (like Staff)
            var studentPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            student.Username = student.EnrollmentId.ToUpper();
            student.PasswordHash = studentPasswordHash;
            student.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new AdminResetPasswordResponseDTO
            {
                Success = true,
                Message = "Password has been reset successfully"
            };
        }
        else
        {
            return new AdminResetPasswordResponseDTO
            {
                Success = false,
                Message = "User, staff, or student identifier is required"
            };
        }

        // Update password
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordHash = newPasswordHash;
        await _context.SaveChangesAsync();

        // Also update password in Staff table if exists
        var staffLink = await _context.Staff
            .FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (staffLink != null && !string.IsNullOrWhiteSpace(staffLink.Username))
        {
            staffLink.PasswordHash = newPasswordHash;
            await _context.SaveChangesAsync();
        }

        return new AdminResetPasswordResponseDTO
        {
            Success = true,
            Message = "Password has been reset successfully"
        };
    }
}

