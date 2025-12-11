using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class ExtendDefenseAndAddEvaluationSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DefenseEvaluators_Staff_StaffId",
                table: "DefenseEvaluators");

            migrationBuilder.DropForeignKey(
                name: "FK_Defenses_Departments_DepartmentId",
                table: "Defenses");

            migrationBuilder.DropForeignKey(
                name: "FK_Defenses_Users_CreatedById",
                table: "Defenses");

            migrationBuilder.AlterColumn<string>(
                name: "Venue",
                table: "Defenses",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Defenses",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Defenses",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "ResultRemarks",
                table: "Defenses",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Result",
                table: "Defenses",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Defenses",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "Duration",
                table: "Defenses",
                type: "time",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "DefenseEvaluators",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<bool>(
                name: "HasSubmittedMarks",
                table: "DefenseEvaluators",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsNotified",
                table: "DefenseEvaluators",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "MarksSubmittedAt",
                table: "DefenseEvaluators",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NotifiedAt",
                table: "DefenseEvaluators",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DefenseMarks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DefenseId = table.Column<int>(type: "int", nullable: false),
                    EvaluatorId = table.Column<int>(type: "int", nullable: false),
                    PresentationMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    TechnicalMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    DocumentationMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    QAMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    TotalMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Feedback = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DefenseMarks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DefenseMarks_Defenses_DefenseId",
                        column: x => x.DefenseId,
                        principalTable: "Defenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DefenseMarks_Staff_EvaluatorId",
                        column: x => x.EvaluatorId,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProjectEvaluations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    CoordinatorTimelineMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    CoordinatorEvaluatedById = table.Column<int>(type: "int", nullable: true),
                    CoordinatorEvaluatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CoordinatorRemarks = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SupervisorProgressMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    SupervisorEvaluatedById = table.Column<int>(type: "int", nullable: true),
                    SupervisorEvaluatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SupervisorRemarks = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    InitialDefenseMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    InitialDefenseId = table.Column<int>(type: "int", nullable: true),
                    MidDefenseMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    MidDefenseId = table.Column<int>(type: "int", nullable: true),
                    FinalDefenseMarks = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    FinalDefenseId = table.Column<int>(type: "int", nullable: true),
                    TotalMarks = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    Percentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Grade = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectEvaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectEvaluations_Defenses_FinalDefenseId",
                        column: x => x.FinalDefenseId,
                        principalTable: "Defenses",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectEvaluations_Defenses_InitialDefenseId",
                        column: x => x.InitialDefenseId,
                        principalTable: "Defenses",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectEvaluations_Defenses_MidDefenseId",
                        column: x => x.MidDefenseId,
                        principalTable: "Defenses",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectEvaluations_FYPGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "FYPGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectEvaluations_Staff_CoordinatorEvaluatedById",
                        column: x => x.CoordinatorEvaluatedById,
                        principalTable: "Staff",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectEvaluations_Staff_SupervisorEvaluatedById",
                        column: x => x.SupervisorEvaluatedById,
                        principalTable: "Staff",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DefenseMarks_DefenseId",
                table: "DefenseMarks",
                column: "DefenseId");

            migrationBuilder.CreateIndex(
                name: "IX_DefenseMarks_EvaluatorId",
                table: "DefenseMarks",
                column: "EvaluatorId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectEvaluations_CoordinatorEvaluatedById",
                table: "ProjectEvaluations",
                column: "CoordinatorEvaluatedById");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectEvaluations_FinalDefenseId",
                table: "ProjectEvaluations",
                column: "FinalDefenseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectEvaluations_GroupId",
                table: "ProjectEvaluations",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectEvaluations_InitialDefenseId",
                table: "ProjectEvaluations",
                column: "InitialDefenseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectEvaluations_MidDefenseId",
                table: "ProjectEvaluations",
                column: "MidDefenseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectEvaluations_SupervisorEvaluatedById",
                table: "ProjectEvaluations",
                column: "SupervisorEvaluatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_DefenseEvaluators_Staff_StaffId",
                table: "DefenseEvaluators",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Defenses_Departments_DepartmentId",
                table: "Defenses",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Defenses_Users_CreatedById",
                table: "Defenses",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DefenseEvaluators_Staff_StaffId",
                table: "DefenseEvaluators");

            migrationBuilder.DropForeignKey(
                name: "FK_Defenses_Departments_DepartmentId",
                table: "Defenses");

            migrationBuilder.DropForeignKey(
                name: "FK_Defenses_Users_CreatedById",
                table: "Defenses");

            migrationBuilder.DropTable(
                name: "DefenseMarks");

            migrationBuilder.DropTable(
                name: "ProjectEvaluations");

            migrationBuilder.DropColumn(
                name: "Duration",
                table: "Defenses");

            migrationBuilder.DropColumn(
                name: "HasSubmittedMarks",
                table: "DefenseEvaluators");

            migrationBuilder.DropColumn(
                name: "IsNotified",
                table: "DefenseEvaluators");

            migrationBuilder.DropColumn(
                name: "MarksSubmittedAt",
                table: "DefenseEvaluators");

            migrationBuilder.DropColumn(
                name: "NotifiedAt",
                table: "DefenseEvaluators");

            migrationBuilder.AlterColumn<string>(
                name: "Venue",
                table: "Defenses",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Defenses",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Defenses",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "ResultRemarks",
                table: "Defenses",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Result",
                table: "Defenses",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Defenses",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "DefenseEvaluators",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);

            migrationBuilder.AddForeignKey(
                name: "FK_DefenseEvaluators_Staff_StaffId",
                table: "DefenseEvaluators",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Defenses_Departments_DepartmentId",
                table: "Defenses",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Defenses_Users_CreatedById",
                table: "Defenses",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
