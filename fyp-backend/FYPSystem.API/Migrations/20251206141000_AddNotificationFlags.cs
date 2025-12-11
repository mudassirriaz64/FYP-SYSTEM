using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    public partial class AddNotificationFlags : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add columns if they do not exist (idempotent)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyNewUserRegistrations')
                BEGIN
                    ALTER TABLE [SystemSettings] ADD [NotifyNewUserRegistrations] bit NOT NULL DEFAULT(0);
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyMissedLogs')
                BEGIN
                    ALTER TABLE [SystemSettings] ADD [NotifyMissedLogs] bit NOT NULL DEFAULT(1);
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyDeadlineReminders')
                BEGIN
                    ALTER TABLE [SystemSettings] ADD [NotifyDeadlineReminders] bit NOT NULL DEFAULT(1);
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyDefenseSchedule')
                BEGIN
                    ALTER TABLE [SystemSettings] ADD [NotifyDefenseSchedule] bit NOT NULL DEFAULT(1);
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyFundingUpdates')
                BEGIN
                    ALTER TABLE [SystemSettings] ADD [NotifyFundingUpdates] bit NOT NULL DEFAULT(1);
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyNewUserRegistrations')
                BEGIN
                    ALTER TABLE [SystemSettings] DROP COLUMN [NotifyNewUserRegistrations];
                END
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyMissedLogs')
                BEGIN
                    ALTER TABLE [SystemSettings] DROP COLUMN [NotifyMissedLogs];
                END
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyDeadlineReminders')
                BEGIN
                    ALTER TABLE [SystemSettings] DROP COLUMN [NotifyDeadlineReminders];
                END
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyDefenseSchedule')
                BEGIN
                    ALTER TABLE [SystemSettings] DROP COLUMN [NotifyDefenseSchedule];
                END
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SystemSettings]') AND name = 'NotifyFundingUpdates')
                BEGIN
                    ALTER TABLE [SystemSettings] DROP COLUMN [NotifyFundingUpdates];
                END
            ");
        }
    }
}


