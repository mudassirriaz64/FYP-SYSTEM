namespace FYPSystem.API.Models;

public class ExternalEvaluatorToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string EvaluatorName { get; set; } = string.Empty;
    public string EvaluatorEmail { get; set; } = string.Empty;
    public string? ProjectTitle { get; set; }
    public int? ProjectId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;
    public DateTime? RevokedAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public string? CreatedBy { get; set; }
}

