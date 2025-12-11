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
public class StaffController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public StaffController(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    // GET: api/staff
    [HttpGet]
    public async Task<ActionResult<StaffListResponse>> GetStaff(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? staffType = null,
        [FromQuery] int? departmentId = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] bool? isHOD = null,
        [FromQuery] bool? isFYPCoordinator = null,
        [FromQuery] bool? isSupervisor = null)
    {
        var query = _context.Staff
            .Include(s => s.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(s =>
                s.FullName.ToLower().Contains(search) ||
                s.Email.ToLower().Contains(search) ||
                (s.Designation != null && s.Designation.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(staffType))
        {
            query = query.Where(s => s.StaffType == staffType);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(s => s.DepartmentId == departmentId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        if (isHOD.HasValue)
        {
            query = query.Where(s => s.IsHOD == isHOD.Value);
        }

        if (isFYPCoordinator.HasValue)
        {
            query = query.Where(s => s.IsFYPCoordinator == isFYPCoordinator.Value);
        }

        if (isSupervisor.HasValue)
        {
            query = query.Where(s => s.IsSupervisor == isSupervisor.Value);
        }

        var totalCount = await query.CountAsync();

        var staff = await query
            .OrderBy(s => s.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return Ok(new StaffListResponse
        {
            Staff = staff,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET: api/staff/5
    [HttpGet("{id}")]
    public async Task<ActionResult<StaffDto>> GetStaffMember(int id)
    {
        var staff = await _context.Staff
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (staff == null)
        {
            return NotFound(new { message = "Staff member not found" });
        }

        return Ok(MapToDto(staff));
    }

    // POST: api/staff
    [HttpPost]
    public async Task<ActionResult<StaffDto>> CreateStaff([FromBody] CreateStaffRequest request)
    {
        // Validate email uniqueness
        if (await _context.Staff.AnyAsync(s => s.Email.ToLower() == request.Email.ToLower()))
        {
            return BadRequest(new { message = "A staff member with this email already exists" });
        }

        // Validate staff type
        if (!StaffTypes.All.Contains(request.StaffType))
        {
            return BadRequest(new { message = $"Invalid staff type. Must be one of: {string.Join(", ", StaffTypes.All)}" });
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

        var staff = new Staff
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            StaffType = request.StaffType,
            DepartmentId = request.DepartmentId,
            Designation = request.Designation,
            Qualification = request.Qualification,
            Specialization = request.Specialization,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Create login account if requested
        if (request.CreateLoginAccount)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new { message = "Username is required when creating a login account" });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Password is required when creating a login account" });
            }

            // Check if username already exists in Staff table
            if (await _context.Staff.AnyAsync(s => s.Username != null && s.Username.ToLower() == request.Username.ToLower()))
            {
                return BadRequest(new { message = "Username already exists. Please choose a different username." });
            }

            // Check if username already exists in User table
            if (await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower()))
            {
                return BadRequest(new { message = "Username already exists. Please choose a different username." });
            }

            // Store username and password hash directly in Staff table
            staff.Username = request.Username;
            staff.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Also create User account for authentication system
            // Determine role based on staff type
            string role = request.StaffType == StaffTypes.FinanceOfficer ? "Finance" : "Supervisor";
            // Role will be updated later when HOD/Coordinator roles are assigned

            var user = new User
            {
                Username = request.Username,
                PasswordHash = staff.PasswordHash, // Same hash
                FullName = request.FullName,
                Email = request.Email,
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            staff.UserId = user.Id;
        }

        _context.Staff.Add(staff);
        await _context.SaveChangesAsync();

        // Log staff creation
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        int? performedByUserId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : null;
        await _auditLogService.LogUserManagementAsync(
            AuditActions.CreateStaff,
            performedByUserId,
            "Staff",
            staff.Id,
            $"Created staff member {staff.FullName} ({staff.Email})",
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        // Reload with department
        await _context.Entry(staff).Reference(s => s.Department).LoadAsync();

        return CreatedAtAction(nameof(GetStaffMember), new { id = staff.Id }, MapToDto(staff));
    }

    // PUT: api/staff/5
    [HttpPut("{id}")]
    public async Task<ActionResult<StaffDto>> UpdateStaff(int id, [FromBody] UpdateStaffRequest request)
    {
        var staff = await _context.Staff.FindAsync(id);

        if (staff == null)
        {
            return NotFound(new { message = "Staff member not found" });
        }

        // Validate email uniqueness (excluding self)
        if (await _context.Staff.AnyAsync(s => s.Email.ToLower() == request.Email.ToLower() && s.Id != id))
        {
            return BadRequest(new { message = "A staff member with this email already exists" });
        }

        // Validate staff type
        if (!StaffTypes.All.Contains(request.StaffType))
        {
            return BadRequest(new { message = $"Invalid staff type. Must be one of: {string.Join(", ", StaffTypes.All)}" });
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

        // If department is changing, clear department roles
        if (staff.DepartmentId != request.DepartmentId)
        {
            staff.IsHOD = false;
            staff.IsFYPCoordinator = false;
            staff.IsSupervisor = false;
        }

        staff.FullName = request.FullName;
        staff.Email = request.Email;
        staff.Phone = request.Phone;
        staff.StaffType = request.StaffType;
        staff.DepartmentId = request.DepartmentId;
        staff.Designation = request.Designation;
        staff.Qualification = request.Qualification;
        staff.Specialization = request.Specialization;
        staff.IsActive = request.IsActive;
        staff.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Reload with department
        await _context.Entry(staff).Reference(s => s.Department).LoadAsync();

        return Ok(MapToDto(staff));
    }

    // DELETE: api/staff/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        var staff = await _context.Staff.FindAsync(id);

        if (staff == null)
        {
            return NotFound(new { message = "Staff member not found" });
        }

        _context.Staff.Remove(staff);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Staff member deleted successfully" });
    }

    // PUT: api/staff/5/department-roles
    [HttpPut("{id}/department-roles")]
    public async Task<ActionResult<StaffDto>> AssignDepartmentRoles(int id, [FromBody] AssignDepartmentRoleRequest request)
    {
        var staff = await _context.Staff
            .Include(s => s.Department)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (staff == null)
        {
            return NotFound(new { message = "Staff member not found" });
        }

        if (!staff.DepartmentId.HasValue)
        {
            return BadRequest(new { message = "Staff member must be assigned to a department before assigning roles" });
        }

        // Only Teachers can have department roles
        if (staff.StaffType != StaffTypes.Teacher)
        {
            return BadRequest(new { message = "Only teachers can be assigned department roles (HOD, FYP Coordinator, Supervisor)" });
        }

        var departmentId = staff.DepartmentId.Value;

        // Validate HOD constraint: Only 1 HOD per department
        if (request.IsHOD && !staff.IsHOD)
        {
            var existingHOD = await _context.Staff
                .FirstOrDefaultAsync(s => s.DepartmentId == departmentId && s.IsHOD && s.Id != id);

            if (existingHOD != null)
            {
                return BadRequest(new
                {
                    message = $"Department already has an HOD: {existingHOD.FullName}. Please remove them first before assigning a new HOD."
                });
            }
        }

        // Validate FYP Coordinator constraint: Maximum 2 per department
        if (request.IsFYPCoordinator && !staff.IsFYPCoordinator)
        {
            var coordinatorCount = await _context.Staff
                .CountAsync(s => s.DepartmentId == departmentId && s.IsFYPCoordinator && s.Id != id);

            if (coordinatorCount >= 2)
            {
                return BadRequest(new
                {
                    message = "Department already has 2 FYP Coordinators. Maximum limit reached."
                });
            }
        }

        // Handle HOD assignment/unassignment and sync with Department table
        var wasHOD = staff.IsHOD;
        staff.IsHOD = request.IsHOD;
        staff.IsFYPCoordinator = request.IsFYPCoordinator;
        staff.IsSupervisor = request.IsSupervisor;
        staff.IsCommitteeMember = request.IsCommitteeMember;
        staff.UpdatedAt = DateTime.UtcNow;

        // Update Department.HeadOfDepartment field
        var department = await _context.Departments.FindAsync(departmentId);
        if (department != null)
        {
            if (request.IsHOD && !wasHOD)
            {
                // Assigning new HOD
                department.HeadOfDepartment = staff.FullName;
                department.UpdatedAt = DateTime.UtcNow;
            }
            else if (!request.IsHOD && wasHOD)
            {
                // Removing HOD
                department.HeadOfDepartment = null;
                department.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(MapToDto(staff));
    }

    // GET: api/staff/department/5
    [HttpGet("department/{departmentId}")]
    public async Task<ActionResult<StaffListResponse>> GetDepartmentStaff(
        int departmentId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        // Verify department exists
        var department = await _context.Departments.FindAsync(departmentId);
        if (department == null)
        {
            return NotFound(new { message = "Department not found" });
        }

        var query = _context.Staff
            .Include(s => s.Department)
            .Where(s => s.DepartmentId == departmentId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(s =>
                s.FullName.ToLower().Contains(search) ||
                s.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var staff = await query
            .OrderByDescending(s => s.IsHOD)
            .ThenByDescending(s => s.IsFYPCoordinator)
            .ThenBy(s => s.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return Ok(new StaffListResponse
        {
            Staff = staff,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET: api/staff/department/5/summary
    [HttpGet("department/{departmentId}/summary")]
    public async Task<ActionResult<DepartmentStaffSummary>> GetDepartmentStaffSummary(int departmentId)
    {
        var department = await _context.Departments.FindAsync(departmentId);
        if (department == null)
        {
            return NotFound(new { message = "Department not found" });
        }

        var departmentStaff = await _context.Staff
            .Include(s => s.Department)
            .Where(s => s.DepartmentId == departmentId && s.IsActive)
            .ToListAsync();

        var hod = departmentStaff.FirstOrDefault(s => s.IsHOD);
        var coordinators = departmentStaff.Where(s => s.IsFYPCoordinator).ToList();
        var supervisorCount = departmentStaff.Count(s => s.IsSupervisor);

        return Ok(new DepartmentStaffSummary
        {
            DepartmentId = department.Id,
            DepartmentName = department.Name,
            DepartmentCode = department.Code,
            TotalStaff = departmentStaff.Count,
            HOD = hod != null ? MapToDto(hod) : null,
            FYPCoordinators = coordinators.Select(c => MapToDto(c)).ToList(),
            SupervisorCount = supervisorCount
        });
    }

    // GET: api/staff/types
    [HttpGet("types")]
    public ActionResult<string[]> GetStaffTypes()
    {
        return Ok(StaffTypes.All);
    }

    // GET: api/staff/export
    [HttpGet("export")]
    public async Task<IActionResult> ExportStaff()
    {
        var staffList = await _context.Staff
            .Include(s => s.Department)
            .OrderBy(s => s.FullName)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Staff");

        // Headers
        worksheet.Cell(1, 1).Value = "Full Name";
        worksheet.Cell(1, 2).Value = "Email";
        worksheet.Cell(1, 3).Value = "Phone";
        worksheet.Cell(1, 4).Value = "Staff Type";
        worksheet.Cell(1, 5).Value = "Department Code";
        worksheet.Cell(1, 6).Value = "Designation";
        worksheet.Cell(1, 7).Value = "Qualification";
        worksheet.Cell(1, 8).Value = "Specialization";
        worksheet.Cell(1, 9).Value = "Username";
        worksheet.Cell(1, 10).Value = "Status";

        // Style headers
        var headerRange = worksheet.Range(1, 1, 1, 10);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
        headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

        // Data
        for (int i = 0; i < staffList.Count; i++)
        {
            var s = staffList[i];
            worksheet.Cell(i + 2, 1).Value = s.FullName;
            worksheet.Cell(i + 2, 2).Value = s.Email;
            worksheet.Cell(i + 2, 3).Value = s.Phone ?? "";
            worksheet.Cell(i + 2, 4).Value = s.StaffType;
            worksheet.Cell(i + 2, 5).Value = s.Department?.Code ?? "";
            worksheet.Cell(i + 2, 6).Value = s.Designation ?? "";
            worksheet.Cell(i + 2, 7).Value = s.Qualification ?? "";
            worksheet.Cell(i + 2, 8).Value = s.Specialization ?? "";
            worksheet.Cell(i + 2, 9).Value = s.Username ?? "";
            worksheet.Cell(i + 2, 10).Value = s.IsActive ? "Active" : "Inactive";
        }

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Staff_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx"
        );
    }

    // GET: api/staff/template
    [HttpGet("template")]
    public IActionResult DownloadTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Staff Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Full Name *";
        worksheet.Cell(1, 2).Value = "Email *";
        worksheet.Cell(1, 3).Value = "Phone";
        worksheet.Cell(1, 4).Value = "Staff Type *";
        worksheet.Cell(1, 5).Value = "Department Code";
        worksheet.Cell(1, 6).Value = "Designation";
        worksheet.Cell(1, 7).Value = "Qualification";
        worksheet.Cell(1, 8).Value = "Specialization";
        worksheet.Cell(1, 9).Value = "Username";
        worksheet.Cell(1, 10).Value = "Password";

        // Style headers
        var headerRange = worksheet.Range(1, 1, 1, 10);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightBlue;
        headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

        // Add sample row
        worksheet.Cell(2, 1).Value = "John Doe";
        worksheet.Cell(2, 2).Value = "john.doe@example.com";
        worksheet.Cell(2, 3).Value = "1234567890";
        worksheet.Cell(2, 4).Value = "Teacher";
        worksheet.Cell(2, 5).Value = "CS";
        worksheet.Cell(2, 6).Value = "Professor";
        worksheet.Cell(2, 7).Value = "PhD Computer Science";
        worksheet.Cell(2, 8).Value = "Machine Learning";
        worksheet.Cell(2, 9).Value = "johndoe";
        worksheet.Cell(2, 10).Value = "password123";

        // Add notes
        worksheet.Cell(4, 1).Value = "Notes:";
        worksheet.Cell(4, 1).Style.Font.Bold = true;
        worksheet.Cell(5, 1).Value = "- Fields marked with * are required";
        worksheet.Cell(6, 1).Value = "- Staff Type must be: Teacher or FinanceOfficer";
        worksheet.Cell(7, 1).Value = "- Department Code should match existing department codes";
        worksheet.Cell(8, 1).Value = "- Username/Password: If both provided, a login account will be created";

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Staff_Template.xlsx"
        );
    }

    // POST: api/staff/import
    [HttpPost("import")]
    public async Task<ActionResult<ImportResult>> ImportStaff(IFormFile file)
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
                    var fullName = row.Cell(1).GetString().Trim();
                    var email = row.Cell(2).GetString().Trim();
                    var phone = row.Cell(3).GetString().Trim();
                    var staffType = row.Cell(4).GetString().Trim();
                    var deptCode = row.Cell(5).GetString().Trim().ToUpper();
                    var designation = row.Cell(6).GetString().Trim();
                    var qualification = row.Cell(7).GetString().Trim();
                    var specialization = row.Cell(8).GetString().Trim();
                    var username = row.Cell(9).GetString().Trim();
                    var password = row.Cell(10).GetString().Trim();

                    // Skip empty rows
                    if (string.IsNullOrWhiteSpace(fullName) && string.IsNullOrWhiteSpace(email))
                    {
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(fullName))
                    {
                        errors.Add($"Row {row.RowNumber()}: Full Name is required");
                        result.FailedCount++;
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(email))
                    {
                        errors.Add($"Row {row.RowNumber()}: Email is required");
                        result.FailedCount++;
                        continue;
                    }

                    // Default staff type to Teacher if not provided
                    if (string.IsNullOrWhiteSpace(staffType))
                    {
                        staffType = "Teacher";
                    }

                    // Validate staff type
                    if (!StaffTypes.All.Contains(staffType))
                    {
                        errors.Add($"Row {row.RowNumber()}: Invalid staff type '{staffType}'. Must be Teacher or FinanceOfficer");
                        result.FailedCount++;
                        continue;
                    }

                    // Check if email already exists
                    var existingStaff = await _context.Staff.FirstOrDefaultAsync(s => s.Email.ToLower() == email.ToLower());
                    if (existingStaff != null)
                    {
                        // Update existing staff
                        existingStaff.FullName = fullName;
                        existingStaff.Phone = string.IsNullOrWhiteSpace(phone) ? existingStaff.Phone : phone;
                        existingStaff.StaffType = staffType;
                        existingStaff.Designation = string.IsNullOrWhiteSpace(designation) ? existingStaff.Designation : designation;
                        existingStaff.Qualification = string.IsNullOrWhiteSpace(qualification) ? existingStaff.Qualification : qualification;
                        existingStaff.Specialization = string.IsNullOrWhiteSpace(specialization) ? existingStaff.Specialization : specialization;
                        existingStaff.UpdatedAt = DateTime.UtcNow;

                        // Update department if provided
                        if (!string.IsNullOrWhiteSpace(deptCode))
                        {
                            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Code.ToUpper() == deptCode);
                            if (dept != null)
                            {
                                existingStaff.DepartmentId = dept.Id;
                            }
                        }

                        result.ImportedCount++;
                    }
                    else
                    {
                        // Create new staff
                        int? departmentId = null;
                        if (!string.IsNullOrWhiteSpace(deptCode))
                        {
                            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Code.ToUpper() == deptCode);
                            if (dept != null)
                            {
                                departmentId = dept.Id;
                            }
                            else
                            {
                                errors.Add($"Row {row.RowNumber()}: Department '{deptCode}' not found");
                            }
                        }

                        var staff = new Staff
                        {
                            FullName = fullName,
                            Email = email,
                            Phone = phone,
                            StaffType = staffType,
                            DepartmentId = departmentId,
                            Designation = designation,
                            Qualification = qualification,
                            Specialization = specialization,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };

                        // Create login account if username and password provided
                        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                        {
                            // Check username uniqueness
                            var usernameExists = await _context.Staff.AnyAsync(s => s.Username != null && s.Username.ToLower() == username.ToLower())
                                || await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower());

                            if (usernameExists)
                            {
                                errors.Add($"Row {row.RowNumber()}: Username '{username}' already exists");
                            }
                            else
                            {
                                staff.Username = username;
                                staff.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);

                                // Create User account
                                string role = staffType == StaffTypes.FinanceOfficer ? "Finance" : "Supervisor";
                                var user = new User
                                {
                                    Username = username,
                                    PasswordHash = staff.PasswordHash,
                                    FullName = fullName,
                                    Email = email,
                                    Role = role,
                                    IsActive = true,
                                    CreatedAt = DateTime.UtcNow
                                };
                                _context.Users.Add(user);
                                await _context.SaveChangesAsync();
                                staff.UserId = user.Id;
                            }
                        }

                        _context.Staff.Add(staff);
                        result.ImportedCount++;
                    }
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

    private static StaffDto MapToDto(Staff s)
    {
        return new StaffDto
        {
            Id = s.Id,
            FullName = s.FullName,
            Email = s.Email,
            Phone = s.Phone,
            StaffType = s.StaffType,
            DepartmentId = s.DepartmentId,
            DepartmentName = s.Department?.Name,
            DepartmentCode = s.Department?.Code,
            IsHOD = s.IsHOD,
            IsFYPCoordinator = s.IsFYPCoordinator,
            IsSupervisor = s.IsSupervisor,
            IsCommitteeMember = s.IsCommitteeMember,
            UserId = s.UserId,
            HasLoginAccount = s.UserId.HasValue || !string.IsNullOrWhiteSpace(s.Username),
            Username = s.Username,
            Designation = s.Designation,
            Qualification = s.Qualification,
            Specialization = s.Specialization,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        };
    }
}

