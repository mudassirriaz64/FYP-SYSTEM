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
public class StudentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public StudentsController(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    // GET: api/students
    [HttpGet]
    public async Task<ActionResult<StudentListResponse>> GetStudents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? departmentId = null,
        [FromQuery] string? batch = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _context.Students
            .Include(s => s.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(s =>
                s.FullName.ToLower().Contains(search) ||
                s.EnrollmentId.ToLower().Contains(search) ||
                s.Email.ToLower().Contains(search));
        }

        if (departmentId.HasValue)
        {
            query = query.Where(s => s.DepartmentId == departmentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(batch))
        {
            query = query.Where(s => s.Batch == batch);
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var students = await query
            .OrderBy(s => s.EnrollmentId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return Ok(new StudentListResponse
        {
            Students = students,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET: api/students/5
    [HttpGet("{id}")]
    public async Task<ActionResult<StudentDto>> GetStudent(int id)
    {
        var student = await _context.Students
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
        {
            return NotFound(new { message = "Student not found" });
        }

        return Ok(MapToDto(student));
    }

    // POST: api/students
    [HttpPost]
    public async Task<ActionResult<StudentDto>> CreateStudent([FromBody] CreateStudentRequest request)
    {
        // Validate enrollment ID format
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.EnrollmentId, @"^\d{2}-\d{6}-\d{3}$"))
        {
            return BadRequest(new { message = "Invalid Enrollment ID format. Must be XX-XXXXXX-XXX" });
        }

        // Validate email uniqueness
        if (await _context.Students.AnyAsync(s => s.Email.ToLower() == request.Email.ToLower()))
        {
            return BadRequest(new { message = "A student with this email already exists" });
        }

        // Validate enrollment ID uniqueness
        if (await _context.Students.AnyAsync(s => s.EnrollmentId.ToUpper() == request.EnrollmentId.ToUpper()))
        {
            return BadRequest(new { message = "A student with this Enrollment ID already exists" });
        }

        // Validate department exists if provided
        if (request.DepartmentId.HasValue)
        {
            var deptExists = await _context.Departments.AnyAsync(d => d.Id == request.DepartmentId.Value);
            if (!deptExists)
            {
                return BadRequest(new { message = "Department not found" });
            }
        }

        var student = new Student
        {
            EnrollmentId = request.EnrollmentId.ToUpper(),
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            DepartmentId = request.DepartmentId,
            Batch = request.Batch,
            Semester = request.Semester,
            CGPA = request.CGPA,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Create login credentials if requested
        bool shouldCreateLogin = request.CreateLoginAccount || !string.IsNullOrWhiteSpace(request.Password);

        if (shouldCreateLogin)
        {
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Password is required when creating a login account" });
            }

            // Username is always the EnrollmentId for students
            string loginUsername = request.EnrollmentId.ToUpper();

            // Check if username already exists in Student table
            if (await _context.Students.AnyAsync(s => s.Username != null && s.Username.ToLower() == loginUsername.ToLower()))
            {
                return BadRequest(new { message = "A student with this Enrollment ID already has login credentials." });
            }

            // Store credentials directly in Student table (like Staff)
            student.Username = loginUsername;
            student.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        _context.Students.Add(student);
        await _context.SaveChangesAsync();

        // Log student creation
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        int? performedByUserId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : null;
        await _auditLogService.LogUserManagementAsync(
            AuditActions.CreateStudent,
            performedByUserId,
            "Student",
            student.Id,
            $"Created student {student.FullName} ({student.EnrollmentId})",
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        // Reload with department
        await _context.Entry(student).Reference(s => s.Department).LoadAsync();

        return CreatedAtAction(nameof(GetStudent), new { id = student.Id }, MapToDto(student));
    }

    // PUT: api/students/5
    [HttpPut("{id}")]
    public async Task<ActionResult<StudentDto>> UpdateStudent(int id, [FromBody] UpdateStudentRequest request)
    {
        var student = await _context.Students.FindAsync(id);

        if (student == null)
        {
            return NotFound(new { message = "Student not found" });
        }

        // Validate enrollment ID format
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.EnrollmentId, @"^\d{2}-\d{6}-\d{3}$"))
        {
            return BadRequest(new { message = "Invalid Enrollment ID format. Must be XX-XXXXXX-XXX" });
        }

        // Validate email uniqueness (excluding self)
        if (await _context.Students.AnyAsync(s => s.Email.ToLower() == request.Email.ToLower() && s.Id != id))
        {
            return BadRequest(new { message = "A student with this email already exists" });
        }

        // Validate enrollment ID uniqueness (excluding self)
        if (await _context.Students.AnyAsync(s => s.EnrollmentId.ToUpper() == request.EnrollmentId.ToUpper() && s.Id != id))
        {
            return BadRequest(new { message = "A student with this Enrollment ID already exists" });
        }

        // Validate department exists if provided
        if (request.DepartmentId.HasValue)
        {
            var deptExists = await _context.Departments.AnyAsync(d => d.Id == request.DepartmentId.Value);
            if (!deptExists)
            {
                return BadRequest(new { message = "Department not found" });
            }
        }

        student.EnrollmentId = request.EnrollmentId.ToUpper();
        student.FullName = request.FullName;
        student.Email = request.Email;
        student.Phone = request.Phone;
        student.DepartmentId = request.DepartmentId;
        student.Batch = request.Batch;
        student.Semester = request.Semester;
        student.CGPA = request.CGPA;
        student.IsActive = request.IsActive;
        student.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Log student update
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        int? performedByUserId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : null;
        await _auditLogService.LogUserManagementAsync(
            AuditActions.UpdateStudent,
            performedByUserId,
            "Student",
            student.Id,
            $"Updated student {student.FullName} ({student.EnrollmentId})",
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        // Reload with department
        await _context.Entry(student).Reference(s => s.Department).LoadAsync();

        return Ok(MapToDto(student));
    }

    // DELETE: api/students/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStudent(int id)
    {
        var student = await _context.Students.FindAsync(id);

        if (student == null)
        {
            return NotFound(new { message = "Student not found" });
        }

        var studentInfo = $"{student.FullName} ({student.EnrollmentId})";

        try
        {
            // Delete all related records first to avoid foreign key constraint violations
            
            // 1. Delete group memberships
            var groupMembers = await _context.GroupMembers.Where(gm => gm.StudentId == id).ToListAsync();
            _context.GroupMembers.RemoveRange(groupMembers);

            // 2. Delete student documents
            var studentDocuments = await _context.StudentDocuments.Where(sd => sd.StudentId == id).ToListAsync();
            _context.StudentDocuments.RemoveRange(studentDocuments);

            // 3. Delete form submissions
            var formSubmissions = await _context.StudentFormSubmissions.Where(fs => fs.StudentId == id).ToListAsync();
            _context.StudentFormSubmissions.RemoveRange(formSubmissions);

            // 4. Delete monthly reports
            var monthlyReports = await _context.MonthlyReports.Where(mr => mr.StudentId == id).ToListAsync();
            _context.MonthlyReports.RemoveRange(monthlyReports);

            // 5. Audit logs remain (set StudentId to null or keep for history)
            var auditLogs = await _context.AuditLogs.Where(al => al.StudentId == id).ToListAsync();
            foreach (var log in auditLogs)
            {
                log.StudentId = null; // Keep audit trail but remove reference
            }

            // 6. Finally, delete the student
            _context.Students.Remove(student);
            
            await _context.SaveChangesAsync();

            // Log student deletion
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            int? performedByUserId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : null;
            await _auditLogService.LogUserManagementAsync(
                AuditActions.DeleteStudent,
                performedByUserId,
                "Student",
                id,
                $"Deleted student {studentInfo}",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new { message = "Student deleted successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Failed to delete student: {ex.Message}" });
        }
    }

    // GET: api/students/export
    [HttpGet("export")]
    public async Task<IActionResult> ExportStudents()
    {
        var students = await _context.Students
            .Include(s => s.Department)
            .OrderBy(s => s.EnrollmentId)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Students");

        // Headers
        worksheet.Cell(1, 1).Value = "Enrollment ID";
        worksheet.Cell(1, 2).Value = "Full Name";
        worksheet.Cell(1, 3).Value = "Email";
        worksheet.Cell(1, 4).Value = "Phone";
        worksheet.Cell(1, 5).Value = "Department";
        worksheet.Cell(1, 6).Value = "Batch";
        worksheet.Cell(1, 7).Value = "Semester";
        worksheet.Cell(1, 8).Value = "CGPA";
        worksheet.Cell(1, 9).Value = "Status";

        // Style headers
        var headerRange = worksheet.Range(1, 1, 1, 9);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
        headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

        // Data
        for (int i = 0; i < students.Count; i++)
        {
            var std = students[i];
            worksheet.Cell(i + 2, 1).Value = std.EnrollmentId;
            worksheet.Cell(i + 2, 2).Value = std.FullName;
            worksheet.Cell(i + 2, 3).Value = std.Email ?? "";
            worksheet.Cell(i + 2, 4).Value = std.Phone ?? "";
            worksheet.Cell(i + 2, 5).Value = std.Department?.Name ?? "";
            worksheet.Cell(i + 2, 6).Value = std.Batch ?? "";
            worksheet.Cell(i + 2, 7).Value = std.Semester ?? "";
            worksheet.Cell(i + 2, 8).Value = std.CGPA ?? "";
            worksheet.Cell(i + 2, 9).Value = std.IsActive ? "Active" : "Inactive";
        }

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Students_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx"
        );
    }

    // POST: api/students/import
    [HttpPost("import")]
    public async Task<ActionResult<ImportResult>> ImportStudents(IFormFile file)
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
                    var enrollmentId = row.Cell(1).GetString().Trim().ToUpper();
                    var fullName = row.Cell(2).GetString().Trim();
                    var email = row.Cell(3).GetString().Trim();

                    if (string.IsNullOrWhiteSpace(enrollmentId) || string.IsNullOrWhiteSpace(fullName))
                    {
                        errors.Add($"Row {row.RowNumber()}: Enrollment ID and Full Name are required");
                        result.FailedCount++;
                        continue;
                    }

                    // Validate enrollment ID format
                    if (!System.Text.RegularExpressions.Regex.IsMatch(enrollmentId, @"^\d{2}-\d{6}-\d{3}$"))
                    {
                        errors.Add($"Row {row.RowNumber()}: Invalid Enrollment ID format. Must be XX-XXXXXX-XXX");
                        result.FailedCount++;
                        continue;
                    }

                    // Check if student already exists
                    var existingStudent = await _context.Students
                        .FirstOrDefaultAsync(s => s.EnrollmentId == enrollmentId);

                    var departmentName = row.Cell(5).GetString().Trim();
                    int? departmentId = null;
                    if (!string.IsNullOrWhiteSpace(departmentName))
                    {
                        var dept = await _context.Departments
                            .FirstOrDefaultAsync(d => d.Name.ToLower() == departmentName.ToLower());
                        departmentId = dept?.Id;
                    }

                    if (existingStudent != null)
                    {
                        // Update existing
                        existingStudent.FullName = fullName;
                        existingStudent.Email = email;
                        existingStudent.Phone = row.Cell(4).GetString().Trim();
                        existingStudent.DepartmentId = departmentId;
                        existingStudent.Batch = row.Cell(6).GetString().Trim();
                        existingStudent.Semester = row.Cell(7).GetString().Trim();
                        existingStudent.CGPA = row.Cell(8).GetString().Trim();
                        var statusCell = row.Cell(9).GetString().Trim().ToLower();
                        existingStudent.IsActive = statusCell != "inactive";
                        existingStudent.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Create new
                        var student = new Student
                        {
                            EnrollmentId = enrollmentId,
                            FullName = fullName,
                            Email = email,
                            Phone = row.Cell(4).GetString().Trim(),
                            DepartmentId = departmentId,
                            Batch = row.Cell(6).GetString().Trim(),
                            Semester = row.Cell(7).GetString().Trim(),
                            CGPA = row.Cell(8).GetString().Trim(),
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.Students.Add(student);
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

    // GET: api/students/template
    [HttpGet("template")]
    public IActionResult DownloadTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Students");

        // Headers
        worksheet.Cell(1, 1).Value = "Enrollment ID";
        worksheet.Cell(1, 2).Value = "Full Name";
        worksheet.Cell(1, 3).Value = "Email";
        worksheet.Cell(1, 4).Value = "Phone";
        worksheet.Cell(1, 5).Value = "Department";
        worksheet.Cell(1, 6).Value = "Batch";
        worksheet.Cell(1, 7).Value = "Semester";
        worksheet.Cell(1, 8).Value = "CGPA";
        worksheet.Cell(1, 9).Value = "Status";

        // Style headers
        var headerRange = worksheet.Range(1, 1, 1, 9);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightBlue;
        headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

        // Example data
        worksheet.Cell(2, 1).Value = "01-131232-001";
        worksheet.Cell(2, 2).Value = "John Doe";
        worksheet.Cell(2, 3).Value = "john@university.edu";
        worksheet.Cell(2, 4).Value = "+92-300-1234567";
        worksheet.Cell(2, 5).Value = "Computer Science";
        worksheet.Cell(2, 6).Value = "2021";
        worksheet.Cell(2, 7).Value = "Fall 2024";
        worksheet.Cell(2, 8).Value = "3.5";
        worksheet.Cell(2, 9).Value = "Active";

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Students_Template.xlsx"
        );
    }

    private static StudentDto MapToDto(Student s)
    {
        return new StudentDto
        {
            Id = s.Id,
            EnrollmentId = s.EnrollmentId,
            FullName = s.FullName,
            Email = s.Email,
            Phone = s.Phone,
            DepartmentId = s.DepartmentId,
            DepartmentName = s.Department?.Name,
            DepartmentCode = s.Department?.Code,
            Batch = s.Batch,
            Semester = s.Semester,
            CGPA = s.CGPA,
            UserId = s.UserId,
            HasLoginAccount = !string.IsNullOrEmpty(s.PasswordHash), // Check PasswordHash instead of UserId
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        };
    }
}

