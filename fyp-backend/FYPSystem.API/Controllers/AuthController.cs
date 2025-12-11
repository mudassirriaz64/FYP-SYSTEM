using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FYPSystem.API.DTOs;
using FYPSystem.API.Services;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAuditLogService _auditLogService;

    public AuthController(IAuthService authService, IAuditLogService auditLogService)
    {
        _authService = authService;
        _auditLogService = auditLogService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDTO>> Login([FromBody] LoginRequestDTO request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new LoginResponseDTO
            {
                Success = false,
                Message = "Username and password are required"
            });
        }

        var result = await _authService.LoginAsync(request);

        if (!result.Success)
        {
            // Log failed login attempt
            await _auditLogService.LogAuthenticationAsync(
                Models.AuditActions.LoginFailed,
                null,
                null,
                null,
                false,
                result.Message,
                ipAddress,
                userAgent
            );
            return Unauthorized(result);
        }

        // Log successful login
        // Determine user type based on role
        int? userId = result.User?.Role == "Student" ? null : result.User?.Id;
        int? studentId = result.User?.Role == "Student" ? result.User?.Id : null;
        int? staffId = null; // Staff login uses userId

        await _auditLogService.LogAuthenticationAsync(
            Models.AuditActions.Login,
            userId,
            studentId,
            staffId,
            true,
            null,
            ipAddress,
            userAgent
        );

        return Ok(result);
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ForgotPasswordResponseDTO>> ForgotPassword([FromBody] ForgotPasswordRequestDTO request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new ForgotPasswordResponseDTO
            {
                Success = false,
                Message = "Username/Enrollment ID and Email are required"
            });
        }

        var result = await _authService.ForgotPasswordAsync(request);

        // Log password reset request
        await _auditLogService.LogAuthenticationAsync(
            Models.AuditActions.PasswordResetRequest,
            null,
            null,
            null,
            result.Success,
            result.Success ? null : result.Message,
            ipAddress,
            null
        );

        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ResetPasswordResponseDTO>> ResetPassword([FromBody] ResetPasswordRequestDTO request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new ResetPasswordResponseDTO
            {
                Success = false,
                Message = "Token and new password are required"
            });
        }

        var result = await _authService.ResetPasswordAsync(request);

        // Log password reset
        await _auditLogService.LogAuthenticationAsync(
            Models.AuditActions.PasswordReset,
            null, // We don't have user context in password reset
            null,
            null,
            result.Success,
            result.Success ? null : result.Message,
            ipAddress,
            null
        );

        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ChangePasswordResponseDTO>> ChangePassword([FromBody] ChangePasswordRequestDTO request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new ChangePasswordResponseDTO
            {
                Success = false,
                Message = "Unauthorized"
            });
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new ChangePasswordResponseDTO
            {
                Success = false,
                Message = "Current password and new password are required"
            });
        }

        var result = await _authService.ChangePasswordAsync(userId, request);

        // Determine if this is a student or user account
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        int? studentId = userRole == "Student" ? userId : null;
        int? actualUserId = userRole == "Student" ? null : userId;

        // Log password change
        await _auditLogService.LogAuthenticationAsync(
            Models.AuditActions.PasswordChange,
            actualUserId,
            studentId,
            null,
            result.Success,
            result.Success ? null : result.Message,
            ipAddress,
            null
        );

        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("credentials")]
    [Authorize]
    public async Task<ActionResult<CredentialsInfoDTO>> GetCredentials()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new CredentialsInfoDTO());
        }

        try
        {
            var credentials = await _authService.GetCredentialsInfoAsync(userId);
            return Ok(credentials);
        }
        catch (Exception)
        {
            return BadRequest(new CredentialsInfoDTO());
        }
    }

    [HttpPost("admin/reset-password")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<AdminResetPasswordResponseDTO>> AdminResetPassword([FromBody] AdminResetPasswordRequestDTO request)
    {
        if (!request.UserId.HasValue && !request.StaffId.HasValue && !request.StudentId.HasValue)
        {
            return BadRequest(new AdminResetPasswordResponseDTO
            {
                Success = false,
                Message = "UserId, StaffId, or StudentId is required"
            });
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new AdminResetPasswordResponseDTO
            {
                Success = false,
                Message = "New password is required"
            });
        }

        var result = await _authService.AdminResetPasswordAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

