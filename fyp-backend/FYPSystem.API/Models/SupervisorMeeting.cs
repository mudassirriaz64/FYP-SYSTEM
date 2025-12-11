namespace FYPSystem.API.Models;

/// <summary>
/// Tracks weekly supervisor meetings for FYP groups.
/// Each monthly report requires 4 weekly meetings before submission.
/// </summary>
public class SupervisorMeeting
{
    public int Id { get; set; }
    
    // Group and Supervisor
    public int GroupId { get; set; }
    public int SupervisorId { get; set; }
    
    // Link to monthly report (1-8 for 8 monthly reports)
    public int MonthNumber { get; set; } // 1-8
    public int WeekNumber { get; set; } // 1-4 within the month
    
    // Meeting details
    public DateTime MeetingDate { get; set; }
    public string? TopicsDiscussed { get; set; }
    public string? SupervisorNotes { get; set; }
    public string? Agenda { get; set; }
    
    // Student attendance tracking (JSON array of student IDs who attended)
    // Example: "[1, 2, 3]" means students with IDs 1, 2, and 3 attended
    public string StudentAttendance { get; set; } = "[]";
    
    // Individual student notes (JSON object)
    // Example: "{"1": "Good progress", "2": "Needs to focus on testing"}"
    public string? StudentNotes { get; set; }
    
    // Timestamps
    public DateTime MarkedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public FYPGroup? Group { get; set; }
    public Staff? Supervisor { get; set; }
}

public static class MeetingWeeks
{
    public const int Week1 = 1;
    public const int Week2 = 2;
    public const int Week3 = 3;
    public const int Week4 = 4;
    public const int RequiredMeetingsPerMonth = 4;
}

public static class MonthNumbers
{
    public const int Month1 = 1;
    public const int Month2 = 2;
    public const int Month3 = 3;
    public const int Month4 = 4;
    public const int Month5 = 5;
    public const int Month6 = 6;
    public const int Month7 = 7;
    public const int Month8 = 8;
    public const int TotalMonths = 8;
}
