using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemSettingsAndDashboard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstitutionName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AcademicYear = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EnrollmentFormat = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GroupMinSize = table.Column<int>(type: "int", nullable: false),
                    GroupMaxSize = table.Column<int>(type: "int", nullable: false),
                    MaxUploadMB = table.Column<int>(type: "int", nullable: false),
                    PasswordMinLength = table.Column<int>(type: "int", nullable: false),
                    RequireUppercase = table.Column<bool>(type: "bit", nullable: false),
                    RequireNumbers = table.Column<bool>(type: "bit", nullable: false),
                    RequireSpecialChars = table.Column<bool>(type: "bit", nullable: false),
                    JwtExpiryHours = table.Column<int>(type: "int", nullable: false),
                    ExternalTokenExpiryHours = table.Column<int>(type: "int", nullable: false),
                    MaxFailedLogins = table.Column<int>(type: "int", nullable: false),
                    LockoutMinutes = table.Column<int>(type: "int", nullable: false),
                    SmtpHost = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SmtpPort = table.Column<int>(type: "int", nullable: true),
                    SmtpUser = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SmtpFrom = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AutoBackupEnabled = table.Column<bool>(type: "bit", nullable: false),
                    BackupFrequency = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    BackupRetentionDays = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
