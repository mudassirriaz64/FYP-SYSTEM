using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFormBFieldsToProposal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FormData",
                table: "Proposals",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SelectedSupervisorId",
                table: "Proposals",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FormData",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "SelectedSupervisorId",
                table: "Proposals");
        }
    }
}
