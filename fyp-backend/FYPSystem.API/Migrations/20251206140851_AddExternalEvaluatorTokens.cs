using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalEvaluatorTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExternalEvaluatorTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Token = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EvaluatorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EvaluatorEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ProjectTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ProjectId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRevoked = table.Column<bool>(type: "bit", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalEvaluatorTokens", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExternalEvaluatorTokens_Token",
                table: "ExternalEvaluatorTokens",
                column: "Token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExternalEvaluatorTokens");
        }
    }
}
