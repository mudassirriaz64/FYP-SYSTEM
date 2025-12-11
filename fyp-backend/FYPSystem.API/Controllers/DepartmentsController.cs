using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Data;
using FYPSystem.API.DTOs;
using FYPSystem.API.Models;
using FYPSystem.API.Services;
using ClosedXML.Excel;

namespace FYPSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public DepartmentsController(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    // GET: api/departments
    [HttpGet]
    public async Task<ActionResult<DepartmentListResponse>> GetDepartments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _context.Departments.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(d =>
                d.Name.ToLower().Contains(search) ||
                d.Code.ToLower().Contains(search) ||
                (d.HeadOfDepartment != null && d.HeadOfDepartment.ToLower().Contains(search)));
        }

        if (isActive.HasValue)
        {
            query = query.Where(d => d.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        // Get departments with HOD from Staff table
        var departments = await query
            .OrderBy(d => d.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Get HOD names from Staff table for these departments
        var departmentIds = departments.Select(d => d.Id).ToList();
        var hodMap = await _context.Staff
            .Where(s => s.DepartmentId.HasValue && departmentIds.Contains(s.DepartmentId.Value) && s.IsHOD && s.IsActive)
            .ToDictionaryAsync(s => s.DepartmentId!.Value, s => s.FullName);

        var departmentDtos = departments.Select(d => new DepartmentDto
        {
            Id = d.Id,
            Name = d.Name,
            Code = d.Code,
            Description = d.Description,
            HeadOfDepartment = hodMap.GetValueOrDefault(d.Id) ?? d.HeadOfDepartment, // Use Staff HOD, fallback to stored value
            Email = d.Email,
            Phone = d.Phone,
            IsActive = d.IsActive,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt
        }).ToList();

        return Ok(new DepartmentListResponse
        {
            Departments = departmentDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET: api/departments/5
    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentDto>> GetDepartment(int id)
    {
        var department = await _context.Departments.FindAsync(id);

        if (department == null)
        {
            return NotFound(new { message = "Department not found" });
        }

        // Get HOD from Staff table if exists
        var hod = await _context.Staff
            .FirstOrDefaultAsync(s => s.DepartmentId == id && s.IsHOD && s.IsActive);

        return Ok(new DepartmentDto
        {
            Id = department.Id,
            Name = department.Name,
            Code = department.Code,
            Description = department.Description,
            HeadOfDepartment = hod?.FullName ?? department.HeadOfDepartment, // Use Staff HOD, fallback to stored value
            Email = department.Email,
            Phone = department.Phone,
            IsActive = department.IsActive,
            CreatedAt = department.CreatedAt,
            UpdatedAt = department.UpdatedAt
        });
    }

    // POST: api/departments
    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> CreateDepartment([FromBody] CreateDepartmentRequest request)
    {
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Department name is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Department code is required" });
            }

            // Check if code already exists
            if (await _context.Departments.AnyAsync(d => d.Code.ToLower() == request.Code.ToLower()))
            {
                return BadRequest(new { message = "Department with this code already exists" });
            }

            var department = new Department
            {
                Name = request.Name.Trim(),
                Code = request.Code.ToUpper().Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                HeadOfDepartment = string.IsNullOrWhiteSpace(request.HeadOfDepartment) ? null : request.HeadOfDepartment.Trim(),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            // Log department creation
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            int? performedByUserId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : null;
            await _auditLogService.LogSystemConfigAsync(
                AuditActions.CreateDepartment,
                performedByUserId,
                $"Created department {department.Name} ({department.Code})",
                null,
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return CreatedAtAction(nameof(GetDepartment), new { id = department.Id }, new DepartmentDto
            {
                Id = department.Id,
                Name = department.Name,
                Code = department.Code,
                Description = department.Description,
                HeadOfDepartment = department.HeadOfDepartment,
                Email = department.Email,
                Phone = department.Phone,
                IsActive = department.IsActive,
                CreatedAt = department.CreatedAt,
                UpdatedAt = department.UpdatedAt
            });
        }
        catch (DbUpdateException ex)
        {
            // Handle database errors
            return StatusCode(500, new
            {
                message = "Database error occurred while creating department",
                error = ex.InnerException?.Message ?? ex.Message
            });
        }
        catch (Exception ex)
        {
            // Handle other errors
            return StatusCode(500, new
            {
                message = "An error occurred while creating department",
                error = ex.Message
            });
        }
    }

    // PUT: api/departments/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDepartment(int id, [FromBody] UpdateDepartmentRequest request)
    {
        var department = await _context.Departments.FindAsync(id);

        if (department == null)
        {
            return NotFound(new { message = "Department not found" });
        }

        // Check if code is being changed and if new code already exists
        if (department.Code.ToLower() != request.Code.ToLower())
        {
            if (await _context.Departments.AnyAsync(d => d.Code.ToLower() == request.Code.ToLower() && d.Id != id))
            {
                return BadRequest(new { message = "Department with this code already exists" });
            }
        }

        department.Name = request.Name;
        department.Code = request.Code.ToUpper();
        department.Description = request.Description;
        department.HeadOfDepartment = request.HeadOfDepartment;
        department.Email = request.Email;
        department.Phone = request.Phone;
        department.IsActive = request.IsActive;
        department.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new DepartmentDto
        {
            Id = department.Id,
            Name = department.Name,
            Code = department.Code,
            Description = department.Description,
            HeadOfDepartment = department.HeadOfDepartment,
            Email = department.Email,
            Phone = department.Phone,
            IsActive = department.IsActive,
            CreatedAt = department.CreatedAt,
            UpdatedAt = department.UpdatedAt
        });
    }

    // DELETE: api/departments/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(int id)
    {
        var department = await _context.Departments.FindAsync(id);

        if (department == null)
        {
            return NotFound(new { message = "Department not found" });
        }

        _context.Departments.Remove(department);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Department deleted successfully" });
    }

    // GET: api/departments/export
    [HttpGet("export")]
    public async Task<IActionResult> ExportDepartments()
    {
        var departments = await _context.Departments
            .OrderBy(d => d.Name)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Departments");

        // Headers
        worksheet.Cell(1, 1).Value = "Code";
        worksheet.Cell(1, 2).Value = "Name";
        worksheet.Cell(1, 3).Value = "Description";
        worksheet.Cell(1, 4).Value = "Head of Department";
        worksheet.Cell(1, 5).Value = "Email";
        worksheet.Cell(1, 6).Value = "Phone";
        worksheet.Cell(1, 7).Value = "Status";

        // Style headers
        var headerRange = worksheet.Range(1, 1, 1, 7);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
        headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

        // Data
        for (int i = 0; i < departments.Count; i++)
        {
            var dept = departments[i];
            worksheet.Cell(i + 2, 1).Value = dept.Code;
            worksheet.Cell(i + 2, 2).Value = dept.Name;
            worksheet.Cell(i + 2, 3).Value = dept.Description ?? "";
            worksheet.Cell(i + 2, 4).Value = dept.HeadOfDepartment ?? "";
            worksheet.Cell(i + 2, 5).Value = dept.Email ?? "";
            worksheet.Cell(i + 2, 6).Value = dept.Phone ?? "";
            worksheet.Cell(i + 2, 7).Value = dept.IsActive ? "Active" : "Inactive";
        }

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Departments_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx"
        );
    }

    // POST: api/departments/import
    [HttpPost("import")]
    public async Task<ActionResult<ImportResult>> ImportDepartments(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ImportResult
            {
                Success = false,
                Errors = new List<string> { "No file uploaded" }
            });
        }

        var result = new ImportResult();
        var errors = new List<string>();

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheets.First();

            var rows = worksheet.RowsUsed().Skip(1); // Skip header row

            foreach (var row in rows)
            {
                try
                {
                    var code = row.Cell(1).GetString().Trim().ToUpper();
                    var name = row.Cell(2).GetString().Trim();

                    if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
                    {
                        errors.Add($"Row {row.RowNumber()}: Code and Name are required");
                        result.FailedCount++;
                        continue;
                    }

                    // Check if department already exists
                    var existingDept = await _context.Departments
                        .FirstOrDefaultAsync(d => d.Code.ToLower() == code.ToLower());

                    if (existingDept != null)
                    {
                        // Update existing
                        existingDept.Name = name;
                        existingDept.Description = row.Cell(3).GetString().Trim();
                        existingDept.HeadOfDepartment = row.Cell(4).GetString().Trim();
                        existingDept.Email = row.Cell(5).GetString().Trim();
                        existingDept.Phone = row.Cell(6).GetString().Trim();

                        var statusCell = row.Cell(7).GetString().Trim().ToLower();
                        existingDept.IsActive = statusCell != "inactive";
                        existingDept.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Create new
                        var department = new Department
                        {
                            Code = code,
                            Name = name,
                            Description = row.Cell(3).GetString().Trim(),
                            HeadOfDepartment = row.Cell(4).GetString().Trim(),
                            Email = row.Cell(5).GetString().Trim(),
                            Phone = row.Cell(6).GetString().Trim(),
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.Departments.Add(department);
                    }

                    result.ImportedCount++;
                }
                catch (Exception ex)
                {
                    errors.Add($"Row {row.RowNumber()}: {ex.Message}");
                    result.FailedCount++;
                }
            }

            await _context.SaveChangesAsync();
            result.Success = result.FailedCount == 0;
            result.Errors = errors;

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new ImportResult
            {
                Success = false,
                Errors = new List<string> { $"Failed to process file: {ex.Message}" }
            });
        }
    }

    // GET: api/departments/template
    [HttpGet("template")]
    public IActionResult DownloadTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Departments");

        // Headers
        worksheet.Cell(1, 1).Value = "Code";
        worksheet.Cell(1, 2).Value = "Name";
        worksheet.Cell(1, 3).Value = "Description";
        worksheet.Cell(1, 4).Value = "Head of Department";
        worksheet.Cell(1, 5).Value = "Email";
        worksheet.Cell(1, 6).Value = "Phone";
        worksheet.Cell(1, 7).Value = "Status";

        // Style headers
        var headerRange = worksheet.Range(1, 1, 1, 7);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightBlue;
        headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

        // Example data
        worksheet.Cell(2, 1).Value = "CS";
        worksheet.Cell(2, 2).Value = "Computer Science";
        worksheet.Cell(2, 3).Value = "Department of Computer Science";
        worksheet.Cell(2, 4).Value = "Dr. John Smith";
        worksheet.Cell(2, 5).Value = "cs@university.edu";
        worksheet.Cell(2, 6).Value = "+92-21-1234567";
        worksheet.Cell(2, 7).Value = "Active";

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Departments_Template.xlsx"
        );
    }
}

