using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYPSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProposalCommitteeTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProposalCommittees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedById = table.Column<int>(type: "int", nullable: false),
                    ApprovedById = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProposalCommittees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProposalCommittees_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProposalCommittees_Users_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProposalCommittees_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProposalCommittees_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ProposalCommitteeMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommitteeId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProposalCommitteeMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProposalCommitteeMembers_ProposalCommittees_CommitteeId",
                        column: x => x.CommitteeId,
                        principalTable: "ProposalCommittees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProposalCommitteeMembers_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProposalCommitteeMembers_CommitteeId_StaffId",
                table: "ProposalCommitteeMembers",
                columns: new[] { "CommitteeId", "StaffId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProposalCommitteeMembers_StaffId",
                table: "ProposalCommitteeMembers",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_ProposalCommittees_ApprovedById",
                table: "ProposalCommittees",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_ProposalCommittees_CreatedById",
                table: "ProposalCommittees",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_ProposalCommittees_DepartmentId",
                table: "ProposalCommittees",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ProposalCommittees_UserId",
                table: "ProposalCommittees",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProposalCommitteeMembers");

            migrationBuilder.DropTable(
                name: "ProposalCommittees");
        }
    }
}
