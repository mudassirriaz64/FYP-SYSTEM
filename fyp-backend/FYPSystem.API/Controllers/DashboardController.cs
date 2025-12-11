using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDTO>> GetSummary()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalStudents = await _context.Students.CountAsync();
        var totalStaff = await _context.Staff.CountAsync();
        var totalDepartments = await _context.Departments.CountAsync();
        var staffTeachers = await _context.Staff.CountAsync(s => s.StaffType == StaffTypes.Teacher);
        var staffFinance = await _context.Staff.CountAsync(s => s.StaffType == StaffTypes.FinanceOfficer);

        return Ok(new DashboardSummaryDTO
        {
            TotalUsers = totalUsers,
            TotalStudents = totalStudents,
            TotalStaff = totalStaff,
            TotalDepartments = totalDepartments,
            StaffTeachers = staffTeachers,
            StaffFinance = staffFinance
        });
    }
}


