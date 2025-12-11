namespace FYPSystem.API.DTOs;

public class ExternalTokenDTO
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string EvaluatorName { get; set; } = string.Empty;
    public string EvaluatorEmail { get; set; } = string.Empty;
    public string? ProjectTitle { get; set; }
    public int? ProjectId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public string? CreatedBy { get; set; }
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}

public class CreateExternalTokenRequest
{
    public string EvaluatorName { get; set; } = string.Empty;
    public string EvaluatorEmail { get; set; } = string.Empty;
    public string? ProjectTitle { get; set; }
    public int? ProjectId { get; set; }
    public int ExpiryHours { get; set; } = 48;
}

public class ExternalTokenListResponse
{
    public List<ExternalTokenDTO> Tokens { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

