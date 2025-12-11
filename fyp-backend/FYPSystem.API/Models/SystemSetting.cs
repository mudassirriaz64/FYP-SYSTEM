namespace FYPSystem.API.Models;

public class SystemSetting
{
    public int Id { get; set; } = 1;
    public string InstitutionName { get; set; } = "Your Institution";
    public string AcademicYear { get; set; } = "2024-2025";
    public string EnrollmentFormat { get; set; } = "XX-XXXXXX-XXX";
    public int GroupMinSize { get; set; } = 2;
    public int GroupMaxSize { get; set; } = 3;
    public int MaxUploadMB { get; set; } = 50;

    // Password / Security
    public int PasswordMinLength { get; set; } = 8;
    public bool RequireUppercase { get; set; } = true;
    public bool RequireNumbers { get; set; } = true;
    public bool RequireSpecialChars { get; set; } = false;
    public int JwtExpiryHours { get; set; } = 24;
    public int ExternalTokenExpiryHours { get; set; } = 48;
    public int MaxFailedLogins { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 30;

    // Notifications / SMTP
    public string? SmtpHost { get; set; }
    public int? SmtpPort { get; set; }
    public string? SmtpUser { get; set; }
    public string? SmtpFrom { get; set; }

    // Backup
    public bool AutoBackupEnabled { get; set; } = false;
    public string BackupFrequency { get; set; } = "weekly"; // daily/weekly/monthly
    public int BackupRetentionDays { get; set; } = 30;

    // Notifications
    public bool NotifyNewUserRegistrations { get; set; } = false;
    public bool NotifyMissedLogs { get; set; } = true;
    public bool NotifyDeadlineReminders { get; set; } = true;
    public bool NotifyDefenseSchedule { get; set; } = true;
    public bool NotifyFundingUpdates { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


