using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;
using System.Security.Cryptography;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin,FYPCoordinator")]
public class ExternalTokensController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ExternalTokensController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ExternalTokenListResponse>> GetTokens(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null)
    {
        var query = _context.ExternalEvaluatorTokens.AsQueryable();

        if (status == "active")
        {
            query = query.Where(t => !t.IsRevoked && t.ExpiresAt > DateTime.UtcNow);
        }
        else if (status == "expired")
        {
            query = query.Where(t => t.ExpiresAt <= DateTime.UtcNow);
        }
        else if (status == "revoked")
        {
            query = query.Where(t => t.IsRevoked);
        }

        var totalCount = await query.CountAsync();
        var tokens = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new ExternalTokenDTO
            {
                Id = t.Id,
                Token = t.Token,
                EvaluatorName = t.EvaluatorName,
                EvaluatorEmail = t.EvaluatorEmail,
                ProjectTitle = t.ProjectTitle,
                ProjectId = t.ProjectId,
                CreatedAt = t.CreatedAt,
                ExpiresAt = t.ExpiresAt,
                IsRevoked = t.IsRevoked,
                RevokedAt = t.RevokedAt,
                UsedAt = t.UsedAt,
                CreatedBy = t.CreatedBy
            })
            .ToListAsync();

        return Ok(new ExternalTokenListResponse
        {
            Tokens = tokens,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpPost]
    public async Task<ActionResult<ExternalTokenDTO>> CreateToken([FromBody] CreateExternalTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EvaluatorName))
            return BadRequest(new { message = "Evaluator name is required" });

        if (string.IsNullOrWhiteSpace(request.EvaluatorEmail))
            return BadRequest(new { message = "Evaluator email is required" });

        // Get settings for default expiry
        var settings = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
        var expiryHours = request.ExpiryHours > 0 ? request.ExpiryHours : (settings?.ExternalTokenExpiryHours ?? 48);

        var username = User.Identity?.Name ?? "System";

        var token = new ExternalEvaluatorToken
        {
            Token = GenerateSecureToken(),
            EvaluatorName = request.EvaluatorName,
            EvaluatorEmail = request.EvaluatorEmail,
            ProjectTitle = request.ProjectTitle,
            ProjectId = request.ProjectId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(expiryHours),
            CreatedBy = username
        };

        _context.ExternalEvaluatorTokens.Add(token);
        await _context.SaveChangesAsync();

        return Ok(new ExternalTokenDTO
        {
            Id = token.Id,
            Token = token.Token,
            EvaluatorName = token.EvaluatorName,
            EvaluatorEmail = token.EvaluatorEmail,
            ProjectTitle = token.ProjectTitle,
            ProjectId = token.ProjectId,
            CreatedAt = token.CreatedAt,
            ExpiresAt = token.ExpiresAt,
            IsRevoked = token.IsRevoked,
            CreatedBy = token.CreatedBy
        });
    }

    [HttpPost("{id}/revoke")]
    public async Task<IActionResult> RevokeToken(int id)
    {
        var token = await _context.ExternalEvaluatorTokens.FindAsync(id);
        if (token == null)
            return NotFound(new { message = "Token not found" });

        if (token.IsRevoked)
            return BadRequest(new { message = "Token is already revoked" });

        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Token revoked successfully" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteToken(int id)
    {
        var token = await _context.ExternalEvaluatorTokens.FindAsync(id);
        if (token == null)
            return NotFound(new { message = "Token not found" });

        _context.ExternalEvaluatorTokens.Remove(token);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Token deleted successfully" });
    }

    // Endpoint for external evaluators to validate their token (no auth required)
    [HttpGet("validate/{tokenValue}")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidateToken(string tokenValue)
    {
        var token = await _context.ExternalEvaluatorTokens
            .FirstOrDefaultAsync(t => t.Token == tokenValue);

        if (token == null)
            return NotFound(new { valid = false, message = "Invalid token" });

        if (token.IsRevoked)
            return BadRequest(new { valid = false, message = "Token has been revoked" });

        if (token.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { valid = false, message = "Token has expired" });

        // Mark as used if first time
        if (token.UsedAt == null)
        {
            token.UsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            valid = true,
            evaluatorName = token.EvaluatorName,
            evaluatorEmail = token.EvaluatorEmail,
            projectTitle = token.ProjectTitle,
            projectId = token.ProjectId,
            expiresAt = token.ExpiresAt
        });
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}

