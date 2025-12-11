using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMonthlyReportWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoordinatorRemarks",
                table: "MonthlyReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FinalizedAt",
                table: "MonthlyReports",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FinalizedById",
                table: "MonthlyReports",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFinalized",
                table: "MonthlyReports",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SubmittedById",
                table: "MonthlyReports",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyReports_FinalizedById",
                table: "MonthlyReports",
                column: "FinalizedById");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyReports_SubmittedById",
                table: "MonthlyReports",
                column: "SubmittedById");

            migrationBuilder.AddForeignKey(
                name: "FK_MonthlyReports_Staff_FinalizedById",
                table: "MonthlyReports",
                column: "FinalizedById",
                principalTable: "Staff",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MonthlyReports_Staff_SubmittedById",
                table: "MonthlyReports",
                column: "SubmittedById",
                principalTable: "Staff",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MonthlyReports_Staff_FinalizedById",
                table: "MonthlyReports");

            migrationBuilder.DropForeignKey(
                name: "FK_MonthlyReports_Staff_SubmittedById",
                table: "MonthlyReports");

            migrationBuilder.DropIndex(
                name: "IX_MonthlyReports_FinalizedById",
                table: "MonthlyReports");

            migrationBuilder.DropIndex(
                name: "IX_MonthlyReports_SubmittedById",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "CoordinatorRemarks",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "FinalizedAt",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "FinalizedById",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "IsFinalized",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "SubmittedById",
                table: "MonthlyReports");
        }
    }
}
