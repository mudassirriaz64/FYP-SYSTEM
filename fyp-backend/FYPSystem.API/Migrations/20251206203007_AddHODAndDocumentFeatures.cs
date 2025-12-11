using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddHODAndDocumentFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HODMarksReviewed",
                table: "FYPGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "HODReviewRemarks",
                table: "FYPGroups",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HODReviewStatus",
                table: "FYPGroups",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "HODReviewedAt",
                table: "FYPGroups",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HODReviewedById",
                table: "FYPGroups",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Result",
                table: "Defenses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResultEnteredAt",
                table: "Defenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResultEnteredById",
                table: "Defenses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResultRemarks",
                table: "Defenses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Escalations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ReportedById = table.Column<int>(type: "int", nullable: true),
                    ReportedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedById = table.Column<int>(type: "int", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DepartmentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Escalations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Escalations_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Escalations_FYPGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "FYPGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Escalations_Staff_ReportedById",
                        column: x => x.ReportedById,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_Escalations_Staff_ResolvedById",
                        column: x => x.ResolvedById,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateTable(
                name: "MonthlyReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    ReportFilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ChallengesFaced = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    NextMonthPlan = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ProgressPercentage = table.Column<int>(type: "int", nullable: true),
                    SupervisorMarks = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: true),
                    SupervisorRemarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    GradedById = table.Column<int>(type: "int", nullable: true),
                    GradedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsEscalated = table.Column<bool>(type: "bit", nullable: false),
                    EscalatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EscalationReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    HODWarningIssued = table.Column<bool>(type: "bit", nullable: false),
                    HODWarningIssuedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    HODWarningRemarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthlyReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthlyReports_FYPGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "FYPGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MonthlyReports_Staff_GradedById",
                        column: x => x.GradedById,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MonthlyReports_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProjectBudgets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    RequestedAmount = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    ApprovedAmount = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    BillOfQuantities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BoQFilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SupervisorEndorsedById = table.Column<int>(type: "int", nullable: true),
                    SupervisorEndorsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SupervisorRemarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    HODApprovedById = table.Column<int>(type: "int", nullable: true),
                    HODApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    HODRemarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FinanceDisbursedById = table.Column<int>(type: "int", nullable: true),
                    FinanceDisbursedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FinanceRemarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisbursementReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectBudgets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectBudgets_FYPGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "FYPGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectBudgets_Staff_FinanceDisbursedById",
                        column: x => x.FinanceDisbursedById,
                        principalTable: "Staff",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectBudgets_Staff_HODApprovedById",
                        column: x => x.HODApprovedById,
                        principalTable: "Staff",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectBudgets_Staff_SupervisorEndorsedById",
                        column: x => x.SupervisorEndorsedById,
                        principalTable: "Staff",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "StudentDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ReviewRemarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReviewedById = table.Column<int>(type: "int", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentDocuments_FYPGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "FYPGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentDocuments_Staff_ReviewedById",
                        column: x => x.ReviewedById,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_StudentDocuments_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Escalations_DepartmentId",
                table: "Escalations",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Escalations_GroupId",
                table: "Escalations",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Escalations_ReportedById",
                table: "Escalations",
                column: "ReportedById");

            migrationBuilder.CreateIndex(
                name: "IX_Escalations_ResolvedById",
                table: "Escalations",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyReports_GradedById",
                table: "MonthlyReports",
                column: "GradedById");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyReports_GroupId_StudentId_Month_Year",
                table: "MonthlyReports",
                columns: new[] { "GroupId", "StudentId", "Month", "Year" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyReports_StudentId",
                table: "MonthlyReports",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectBudgets_FinanceDisbursedById",
                table: "ProjectBudgets",
                column: "FinanceDisbursedById");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectBudgets_GroupId",
                table: "ProjectBudgets",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectBudgets_HODApprovedById",
                table: "ProjectBudgets",
                column: "HODApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectBudgets_SupervisorEndorsedById",
                table: "ProjectBudgets",
                column: "SupervisorEndorsedById");

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_GroupId",
                table: "StudentDocuments",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_ReviewedById",
                table: "StudentDocuments",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_StudentId",
                table: "StudentDocuments",
                column: "StudentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Escalations");

            migrationBuilder.DropTable(
                name: "MonthlyReports");

            migrationBuilder.DropTable(
                name: "ProjectBudgets");

            migrationBuilder.DropTable(
                name: "StudentDocuments");

            migrationBuilder.DropColumn(
                name: "HODMarksReviewed",
                table: "FYPGroups");

            migrationBuilder.DropColumn(
                name: "HODReviewRemarks",
                table: "FYPGroups");

            migrationBuilder.DropColumn(
                name: "HODReviewStatus",
                table: "FYPGroups");

            migrationBuilder.DropColumn(
                name: "HODReviewedAt",
                table: "FYPGroups");

            migrationBuilder.DropColumn(
                name: "HODReviewedById",
                table: "FYPGroups");

            migrationBuilder.DropColumn(
                name: "Result",
                table: "Defenses");

            migrationBuilder.DropColumn(
                name: "ResultEnteredAt",
                table: "Defenses");

            migrationBuilder.DropColumn(
                name: "ResultEnteredById",
                table: "Defenses");

            migrationBuilder.DropColumn(
                name: "ResultRemarks",
                table: "Defenses");
        }
    }
}
