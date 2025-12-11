using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTranscriptToStudentSubmission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TranscriptFileName",
                table: "StudentFormSubmissions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TranscriptPath",
                table: "StudentFormSubmissions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TranscriptFileName",
                table: "StudentFormSubmissions");

            migrationBuilder.DropColumn(
                name: "TranscriptPath",
                table: "StudentFormSubmissions");
        }
    }
}
