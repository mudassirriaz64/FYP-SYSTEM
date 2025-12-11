using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetFieldsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add PasswordResetToken column if it doesn't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'PasswordResetToken')
                BEGIN
                    ALTER TABLE [Users] ADD [PasswordResetToken] nvarchar(max) NULL;
                END
            ");

            // Add PasswordResetTokenExpiry column if it doesn't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'PasswordResetTokenExpiry')
                BEGIN
                    ALTER TABLE [Users] ADD [PasswordResetTokenExpiry] datetime2 NULL;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordResetToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PasswordResetTokenExpiry",
                table: "Users");
        }
    }
}
