using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentsAndUpdateStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add Username column to Staff if it doesn't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Staff]') AND name = 'Username')
                BEGIN
                    ALTER TABLE [Staff] ADD [Username] nvarchar(50) NULL;
                END
            ");

            // Add PasswordHash column to Staff if it doesn't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Staff]') AND name = 'PasswordHash')
                BEGIN
                    ALTER TABLE [Staff] ADD [PasswordHash] nvarchar(500) NULL;
                END
            ");

            // Create Students table if it doesn't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Students]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [Students] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [EnrollmentId] nvarchar(20) NOT NULL,
                        [FullName] nvarchar(100) NOT NULL,
                        [Email] nvarchar(100) NULL,
                        [Phone] nvarchar(20) NULL,
                        [DepartmentId] int NULL,
                        [Batch] nvarchar(10) NULL,
                        [Semester] nvarchar(50) NULL,
                        [CGPA] nvarchar(10) NULL,
                        [UserId] int NULL,
                        [IsActive] bit NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [UpdatedAt] datetime2 NULL,
                        CONSTRAINT [PK_Students] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Students_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]) ON DELETE SET NULL,
                        CONSTRAINT [FK_Students_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL
                    );
                END
            ");

            // Create indexes conditionally
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Staff_Username' AND object_id = OBJECT_ID(N'[Staff]'))
                BEGIN
                    CREATE UNIQUE INDEX [IX_Staff_Username] ON [Staff] ([Username]) WHERE [Username] IS NOT NULL;
                END

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_EnrollmentId' AND object_id = OBJECT_ID(N'[Students]'))
                BEGIN
                    CREATE UNIQUE INDEX [IX_Students_EnrollmentId] ON [Students] ([EnrollmentId]);
                END

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_DepartmentId' AND object_id = OBJECT_ID(N'[Students]'))
                BEGIN
                    CREATE INDEX [IX_Students_DepartmentId] ON [Students] ([DepartmentId]);
                END

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_UserId' AND object_id = OBJECT_ID(N'[Students]'))
                BEGIN
                    CREATE INDEX [IX_Students_UserId] ON [Students] ([UserId]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Students");

            migrationBuilder.DropIndex(
                name: "IX_Staff_Username",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Staff");
        }
    }
}
