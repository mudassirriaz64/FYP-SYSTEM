using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CoordinatorFinalizedAt",
                table: "StudentDocuments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoordinatorFinalizedById",
                table: "StudentDocuments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoordinatorRemarks",
                table: "StudentDocuments",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupervisorRemarks",
                table: "StudentDocuments",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupervisorReviewedAt",
                table: "StudentDocuments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SupervisorReviewedById",
                table: "StudentDocuments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkflowStatus",
                table: "StudentDocuments",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "DocumentSubmissionControls",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsUnlocked = table.Column<bool>(type: "bit", nullable: false),
                    UnlockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeadlineDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UnlockedById = table.Column<int>(type: "int", nullable: true),
                    LockedById = table.Column<int>(type: "int", nullable: true),
                    UnlockMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Instructions = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    Phase = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Semester = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentSubmissionControls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentSubmissionControls_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DocumentSubmissionControls_Staff_LockedById",
                        column: x => x.LockedById,
                        principalTable: "Staff",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DocumentSubmissionControls_Staff_UnlockedById",
                        column: x => x.UnlockedById,
                        principalTable: "Staff",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_CoordinatorFinalizedById",
                table: "StudentDocuments",
                column: "CoordinatorFinalizedById");

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_SupervisorReviewedById",
                table: "StudentDocuments",
                column: "SupervisorReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSubmissionControls_DepartmentId",
                table: "DocumentSubmissionControls",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSubmissionControls_DocumentType_DepartmentId",
                table: "DocumentSubmissionControls",
                columns: new[] { "DocumentType", "DepartmentId" },
                unique: true,
                filter: "[DepartmentId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSubmissionControls_LockedById",
                table: "DocumentSubmissionControls",
                column: "LockedById");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSubmissionControls_UnlockedById",
                table: "DocumentSubmissionControls",
                column: "UnlockedById");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentDocuments_Staff_CoordinatorFinalizedById",
                table: "StudentDocuments",
                column: "CoordinatorFinalizedById",
                principalTable: "Staff",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentDocuments_Staff_SupervisorReviewedById",
                table: "StudentDocuments",
                column: "SupervisorReviewedById",
                principalTable: "Staff",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentDocuments_Staff_CoordinatorFinalizedById",
                table: "StudentDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_StudentDocuments_Staff_SupervisorReviewedById",
                table: "StudentDocuments");

            migrationBuilder.DropTable(
                name: "DocumentSubmissionControls");

            migrationBuilder.DropIndex(
                name: "IX_StudentDocuments_CoordinatorFinalizedById",
                table: "StudentDocuments");

            migrationBuilder.DropIndex(
                name: "IX_StudentDocuments_SupervisorReviewedById",
                table: "StudentDocuments");

            migrationBuilder.DropColumn(
                name: "CoordinatorFinalizedAt",
                table: "StudentDocuments");

            migrationBuilder.DropColumn(
                name: "CoordinatorFinalizedById",
                table: "StudentDocuments");

            migrationBuilder.DropColumn(
                name: "CoordinatorRemarks",
                table: "StudentDocuments");

            migrationBuilder.DropColumn(
                name: "SupervisorRemarks",
                table: "StudentDocuments");

            migrationBuilder.DropColumn(
                name: "SupervisorReviewedAt",
                table: "StudentDocuments");

            migrationBuilder.DropColumn(
                name: "SupervisorReviewedById",
                table: "StudentDocuments");

            migrationBuilder.DropColumn(
                name: "WorkflowStatus",
                table: "StudentDocuments");
        }
    }
}
