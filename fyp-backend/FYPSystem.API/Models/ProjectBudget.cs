namespace FYPSystem.API.Models;

public class ProjectBudget
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal RequestedAmount { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public string Status { get; set; } = BudgetStatuses.Pending;
    public string? BillOfQuantities { get; set; } // JSON string or file path
    public string? BoQFilePath { get; set; }
    
    // Workflow
    public int? SupervisorEndorsedById { get; set; }
    public DateTime? SupervisorEndorsedAt { get; set; }
    public string? SupervisorRemarks { get; set; }
    
    public int? HODApprovedById { get; set; }
    public DateTime? HODApprovedAt { get; set; }
    public string? HODRemarks { get; set; }
    
    public int? FinanceDisbursedById { get; set; }
    public DateTime? FinanceDisbursedAt { get; set; }
    public string? FinanceRemarks { get; set; }
    public string? DisbursementReference { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public FYPGroup? Group { get; set; }
    public Staff? SupervisorEndorsedBy { get; set; }
    public Staff? HODApprovedBy { get; set; }
    public Staff? FinanceDisbursedBy { get; set; }
}

public static class BudgetStatuses
{
    public const string Draft = "Draft";
    public const string Pending = "Pending";
    public const string SupervisorEndorsed = "SupervisorEndorsed";
    public const string HODApproved = "HODApproved";
    public const string HODRejected = "HODRejected";
    public const string FinanceProcessing = "FinanceProcessing";
    public const string Disbursed = "Disbursed";
    public const string Cancelled = "Cancelled";
}

