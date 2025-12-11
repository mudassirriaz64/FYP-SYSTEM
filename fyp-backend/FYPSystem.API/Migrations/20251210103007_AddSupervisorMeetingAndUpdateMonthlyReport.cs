using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSupervisorMeetingAndUpdateMonthlyReport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CanSubmit",
                table: "MonthlyReports",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "MonthNumber",
                table: "MonthlyReports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WeeklyMeetingsCompleted",
                table: "MonthlyReports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "SupervisorMeetings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    SupervisorId = table.Column<int>(type: "int", nullable: false),
                    MonthNumber = table.Column<int>(type: "int", nullable: false),
                    WeekNumber = table.Column<int>(type: "int", nullable: false),
                    MeetingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TopicsDiscussed = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SupervisorNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Agenda = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    StudentAttendance = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "[]"),
                    StudentNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    MarkedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupervisorMeetings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupervisorMeetings_FYPGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "FYPGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SupervisorMeetings_Staff_SupervisorId",
                        column: x => x.SupervisorId,
                        principalTable: "Staff",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_SupervisorMeetings_GroupId_MonthNumber_WeekNumber",
                table: "SupervisorMeetings",
                columns: new[] { "GroupId", "MonthNumber", "WeekNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupervisorMeetings_SupervisorId",
                table: "SupervisorMeetings",
                column: "SupervisorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SupervisorMeetings");

            migrationBuilder.DropColumn(
                name: "CanSubmit",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "MonthNumber",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "WeeklyMeetingsCompleted",
                table: "MonthlyReports");
        }
    }
}
