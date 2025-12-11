using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCoordinatorFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FinalResult",
                table: "GroupMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ResultsCompiled",
                table: "FYPGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResultsCompiledAt",
                table: "FYPGroups",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ResultsPublished",
                table: "FYPGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResultsPublishedAt",
                table: "FYPGroups",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Deadlines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeadlineDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NotifyStudents = table.Column<bool>(type: "bit", nullable: false),
                    NotifySupervisors = table.Column<bool>(type: "bit", nullable: false),
                    ReminderDays = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    CreatedById = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Deadlines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Deadlines_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Deadlines_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Defenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Venue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    CreatedById = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Defenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Defenses_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Defenses_FYPGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "FYPGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Defenses_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DefenseEvaluators",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DefenseId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    IsExternal = table.Column<bool>(type: "bit", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DefenseEvaluators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DefenseEvaluators_Defenses_DefenseId",
                        column: x => x.DefenseId,
                        principalTable: "Defenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DefenseEvaluators_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Deadlines_CreatedById",
                table: "Deadlines",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Deadlines_DepartmentId",
                table: "Deadlines",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_DefenseEvaluators_DefenseId",
                table: "DefenseEvaluators",
                column: "DefenseId");

            migrationBuilder.CreateIndex(
                name: "IX_DefenseEvaluators_StaffId",
                table: "DefenseEvaluators",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Defenses_CreatedById",
                table: "Defenses",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Defenses_DepartmentId",
                table: "Defenses",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Defenses_GroupId",
                table: "Defenses",
                column: "GroupId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Deadlines");

            migrationBuilder.DropTable(
                name: "DefenseEvaluators");

            migrationBuilder.DropTable(
                name: "Defenses");

            migrationBuilder.DropColumn(
                name: "FinalResult",
                table: "GroupMembers");

            migrationBuilder.DropColumn(
                name: "ResultsCompiled",
                table: "FYPGroups");

            migrationBuilder.DropColumn(
                name: "ResultsCompiledAt",
                table: "FYPGroups");

            migrationBuilder.DropColumn(
                name: "ResultsPublished",
                table: "FYPGroups");

            migrationBuilder.DropColumn(
                name: "ResultsPublishedAt",
                table: "FYPGroups");
        }
    }
}
