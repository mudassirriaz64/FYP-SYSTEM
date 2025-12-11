using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SystemSettingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SystemSettingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<SystemSettingsDTO>> Get()
    {
        var settings = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
        if (settings == null)
        {
            settings = new SystemSetting { Id = 1 };
            _context.SystemSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return Ok(ToDto(settings));
    }

    [HttpPut]
    public async Task<ActionResult<SystemSettingsDTO>> Update([FromBody] SystemSettingsDTO dto)
    {
        var settings = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
        if (settings == null)
        {
            settings = new SystemSetting { Id = 1 };
            _context.SystemSettings.Add(settings);
        }

        settings.InstitutionName = dto.InstitutionName;
        settings.AcademicYear = dto.AcademicYear;
        settings.EnrollmentFormat = dto.EnrollmentFormat;
        settings.GroupMinSize = dto.GroupMinSize;
        settings.GroupMaxSize = dto.GroupMaxSize;
        settings.MaxUploadMB = dto.MaxUploadMB;
        settings.PasswordMinLength = dto.PasswordMinLength;
        settings.RequireUppercase = dto.RequireUppercase;
        settings.RequireNumbers = dto.RequireNumbers;
        settings.RequireSpecialChars = dto.RequireSpecialChars;
        settings.JwtExpiryHours = dto.JwtExpiryHours;
        settings.ExternalTokenExpiryHours = dto.ExternalTokenExpiryHours;
        settings.MaxFailedLogins = dto.MaxFailedLogins;
        settings.LockoutMinutes = dto.LockoutMinutes;
        settings.SmtpHost = dto.SmtpHost;
        settings.SmtpPort = dto.SmtpPort;
        settings.SmtpUser = dto.SmtpUser;
        settings.SmtpFrom = dto.SmtpFrom;
        settings.AutoBackupEnabled = dto.AutoBackupEnabled;
        settings.BackupFrequency = dto.BackupFrequency;
        settings.BackupRetentionDays = dto.BackupRetentionDays;
        settings.NotifyNewUserRegistrations = dto.NotifyNewUserRegistrations;
        settings.NotifyMissedLogs = dto.NotifyMissedLogs;
        settings.NotifyDeadlineReminders = dto.NotifyDeadlineReminders;
        settings.NotifyDefenseSchedule = dto.NotifyDefenseSchedule;
        settings.NotifyFundingUpdates = dto.NotifyFundingUpdates;
        settings.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(ToDto(settings));
    }

    private static SystemSettingsDTO ToDto(SystemSetting s) => new()
    {
        InstitutionName = s.InstitutionName,
        AcademicYear = s.AcademicYear,
        EnrollmentFormat = s.EnrollmentFormat,
        GroupMinSize = s.GroupMinSize,
        GroupMaxSize = s.GroupMaxSize,
        MaxUploadMB = s.MaxUploadMB,
        PasswordMinLength = s.PasswordMinLength,
        RequireUppercase = s.RequireUppercase,
        RequireNumbers = s.RequireNumbers,
        RequireSpecialChars = s.RequireSpecialChars,
        JwtExpiryHours = s.JwtExpiryHours,
        ExternalTokenExpiryHours = s.ExternalTokenExpiryHours,
        MaxFailedLogins = s.MaxFailedLogins,
        LockoutMinutes = s.LockoutMinutes,
        SmtpHost = s.SmtpHost,
        SmtpPort = s.SmtpPort,
        SmtpUser = s.SmtpUser,
        SmtpFrom = s.SmtpFrom,
        AutoBackupEnabled = s.AutoBackupEnabled,
        BackupFrequency = s.BackupFrequency,
        BackupRetentionDays = s.BackupRetentionDays,
        NotifyNewUserRegistrations = s.NotifyNewUserRegistrations,
        NotifyMissedLogs = s.NotifyMissedLogs,
        NotifyDeadlineReminders = s.NotifyDeadlineReminders,
        NotifyDefenseSchedule = s.NotifyDefenseSchedule,
        NotifyFundingUpdates = s.NotifyFundingUpdates
    };
}


