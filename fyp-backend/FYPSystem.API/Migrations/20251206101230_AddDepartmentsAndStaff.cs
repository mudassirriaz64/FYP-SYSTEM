using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentsAndStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Departments table might already exist, so create it conditionally
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Departments]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [Departments] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [Name] nvarchar(100) NOT NULL,
                        [Code] nvarchar(10) NOT NULL,
                        [Description] nvarchar(500) NULL,
                        [HeadOfDepartment] nvarchar(100) NULL,
                        [Email] nvarchar(100) NULL,
                        [Phone] nvarchar(20) NULL,
                        [IsActive] bit NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [UpdatedAt] datetime2 NULL,
                        CONSTRAINT [PK_Departments] PRIMARY KEY ([Id])
                    );
                END
            ");

            // Users table might already exist from EnsureCreatedAsync, so create it conditionally
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Users]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [Users] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [Username] nvarchar(50) NOT NULL,
                        [PasswordHash] nvarchar(max) NOT NULL,
                        [FullName] nvarchar(100) NOT NULL,
                        [Email] nvarchar(100) NOT NULL,
                        [Role] nvarchar(50) NOT NULL,
                        [IsActive] bit NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [LastLoginAt] datetime2 NULL,
                        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
                    );
                END
            ");

            migrationBuilder.CreateTable(
                name: "Staff",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    StaffType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    IsHOD = table.Column<bool>(type: "bit", nullable: false),
                    IsFYPCoordinator = table.Column<bool>(type: "bit", nullable: false),
                    IsSupervisor = table.Column<bool>(type: "bit", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    Designation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Qualification = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Specialization = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Staff", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Staff_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Staff_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // Create indexes conditionally
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Departments_Code' AND object_id = OBJECT_ID(N'[Departments]'))
                BEGIN
                    CREATE UNIQUE INDEX [IX_Departments_Code] ON [Departments] ([Code]);
                END

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Username' AND object_id = OBJECT_ID(N'[Users]'))
                BEGIN
                    CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);
                END
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_DepartmentId",
                table: "Staff",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_Email",
                table: "Staff",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Staff_UserId",
                table: "Staff",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Staff");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
