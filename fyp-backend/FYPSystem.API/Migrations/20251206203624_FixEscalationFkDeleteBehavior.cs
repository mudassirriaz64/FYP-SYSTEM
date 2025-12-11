using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class FixEscalationFkDeleteBehavior : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Escalations_Staff_ReportedById",
                table: "Escalations");

            migrationBuilder.DropForeignKey(
                name: "FK_Escalations_Staff_ResolvedById",
                table: "Escalations");

            migrationBuilder.AddForeignKey(
                name: "FK_Escalations_Staff_ReportedById",
                table: "Escalations",
                column: "ReportedById",
                principalTable: "Staff",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Escalations_Staff_ResolvedById",
                table: "Escalations",
                column: "ResolvedById",
                principalTable: "Staff",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Escalations_Staff_ReportedById",
                table: "Escalations");

            migrationBuilder.DropForeignKey(
                name: "FK_Escalations_Staff_ResolvedById",
                table: "Escalations");

            migrationBuilder.AddForeignKey(
                name: "FK_Escalations_Staff_ReportedById",
                table: "Escalations",
                column: "ReportedById",
                principalTable: "Staff",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Escalations_Staff_ResolvedById",
                table: "Escalations",
                column: "ResolvedById",
                principalTable: "Staff",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
