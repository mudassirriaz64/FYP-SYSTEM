using Microsoft.EntityFrameworkCore;
using FYPSystem.API.Models;

namespace FYPSystem.API.Data;

public class ApplicationDbContext : DbContext
{
  public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
  {
  }

  public DbSet<User> Users { get; set; }
  public DbSet<Department> Departments { get; set; }
  public DbSet<Staff> Staff { get; set; }
  public DbSet<Student> Students { get; set; }
  public DbSet<SystemSetting> SystemSettings { get; set; }
  public DbSet<ExternalEvaluatorToken> ExternalEvaluatorTokens { get; set; }

  // FYP Workflow
  public DbSet<Notification> Notifications { get; set; }
  public DbSet<FYPGroup> FYPGroups { get; set; }
  public DbSet<GroupMember> GroupMembers { get; set; }
  public DbSet<Proposal> Proposals { get; set; }
  public DbSet<StudentFormSubmission> StudentFormSubmissions { get; set; }

  // Coordinator Management
  public DbSet<Deadline> Deadlines { get; set; }
  public DbSet<Defense> Defenses { get; set; }
  public DbSet<DefenseEvaluator> DefenseEvaluators { get; set; }
  public DbSet<DefenseMarks> DefenseMarks { get; set; }
  public DbSet<ProjectEvaluation> ProjectEvaluations { get; set; }

  // Document Management
  public DbSet<StudentDocument> StudentDocuments { get; set; }
  public DbSet<DocumentSubmissionControl> DocumentSubmissionControls { get; set; }

  // Financial & Reports
  public DbSet<ProjectBudget> ProjectBudgets { get; set; }
  public DbSet<MonthlyReport> MonthlyReports { get; set; }
  public DbSet<SupervisorMeeting> SupervisorMeetings { get; set; }
  public DbSet<Escalation> Escalations { get; set; }

  // Audit Logs
  public DbSet<AuditLog> AuditLogs { get; set; }

  // Proposal Committee
  public DbSet<ProposalCommittee> ProposalCommittees { get; set; }
  public DbSet<ProposalCommitteeMember> ProposalCommitteeMembers { get; set; }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);

    // User configuration
    modelBuilder.Entity<User>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => e.Username).IsUnique();
      entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
      entity.Property(e => e.PasswordHash).IsRequired();
      entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Email).HasMaxLength(100);
      entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
    });

    // Department configuration
    modelBuilder.Entity<Department>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => e.Code).IsUnique();
      entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
      entity.Property(e => e.Description).HasMaxLength(500);
      entity.Property(e => e.HeadOfDepartment).HasMaxLength(100);
      entity.Property(e => e.Email).HasMaxLength(100);
      entity.Property(e => e.Phone).HasMaxLength(20);
    });

    // Staff configuration
    modelBuilder.Entity<Staff>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => e.Email).IsUnique();
      entity.HasIndex(e => e.Username).IsUnique().HasFilter("[Username] IS NOT NULL");
      entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Phone).HasMaxLength(20);
      entity.Property(e => e.StaffType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Username).HasMaxLength(50);
      entity.Property(e => e.PasswordHash).HasMaxLength(500);
      entity.Property(e => e.Designation).HasMaxLength(100);
      entity.Property(e => e.Qualification).HasMaxLength(100);
      entity.Property(e => e.Specialization).HasMaxLength(200);

      // Relationship with Department
      entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

      // Relationship with User (for login)
      entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
    });

    // Student configuration
    modelBuilder.Entity<Student>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => e.EnrollmentId).IsUnique();
      entity.HasIndex(e => e.Username).IsUnique().HasFilter("[Username] IS NOT NULL");
      entity.Property(e => e.EnrollmentId).IsRequired().HasMaxLength(20);
      entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Email).HasMaxLength(100);
      entity.Property(e => e.Phone).HasMaxLength(20);
      entity.Property(e => e.Batch).HasMaxLength(10);
      entity.Property(e => e.Semester).HasMaxLength(50);
      entity.Property(e => e.CGPA).HasMaxLength(10);
      entity.Property(e => e.Username).HasMaxLength(50);
      entity.Property(e => e.PasswordHash).HasMaxLength(500);

      // Relationship with Department
      entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

      // Relationship with User (for login)
      entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
    });

    // System Settings - single row table
    modelBuilder.Entity<SystemSetting>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.InstitutionName).HasMaxLength(200);
      entity.Property(e => e.AcademicYear).HasMaxLength(20);
      entity.Property(e => e.EnrollmentFormat).HasMaxLength(50);
      entity.Property(e => e.BackupFrequency).HasMaxLength(20);
    });

    // External Evaluator Tokens
    modelBuilder.Entity<ExternalEvaluatorToken>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => e.Token).IsUnique();
      entity.Property(e => e.Token).IsRequired().HasMaxLength(100);
      entity.Property(e => e.EvaluatorName).IsRequired().HasMaxLength(100);
      entity.Property(e => e.EvaluatorEmail).IsRequired().HasMaxLength(100);
      entity.Property(e => e.ProjectTitle).HasMaxLength(200);
      entity.Property(e => e.CreatedBy).HasMaxLength(100);
    });

    // Notification configuration
    modelBuilder.Entity<Notification>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
      entity.Property(e => e.Message).IsRequired().HasMaxLength(2000);
      entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
      entity.Property(e => e.RelatedFormType).HasMaxLength(20);
      entity.Property(e => e.TargetAudience).HasMaxLength(50);

      entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

      entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);
    });

    // FYP Group configuration
    modelBuilder.Entity<FYPGroup>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.GroupName).IsRequired().HasMaxLength(100);
      entity.Property(e => e.ProjectTitle).HasMaxLength(300);
      entity.Property(e => e.ProjectDescription).HasMaxLength(2000);
      entity.Property(e => e.DegreeLevel).IsRequired().HasMaxLength(20);
      entity.Property(e => e.DegreeProgram).IsRequired().HasMaxLength(20);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
      entity.Property(e => e.SupervisorStatus).HasMaxLength(20);
      entity.Property(e => e.SupervisorRemarks).HasMaxLength(500);

      entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(e => e.Supervisor)
                .WithMany()
                .HasForeignKey(e => e.SupervisorId)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.CoSupervisor)
                .WithMany()
                .HasForeignKey(e => e.CoSupervisorId)
                .OnDelete(DeleteBehavior.NoAction);
    });

    // Group Member configuration
    modelBuilder.Entity<GroupMember>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => new { e.GroupId, e.StudentId }).IsUnique();
      entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
      entity.Property(e => e.Grade).HasMaxLength(5);

      // Decimal precision for marks
      entity.Property(e => e.ProposalMarks).HasPrecision(5, 2);
      entity.Property(e => e.MidEvalMarks).HasPrecision(5, 2);
      entity.Property(e => e.FinalEvalMarks).HasPrecision(5, 2);
      entity.Property(e => e.SupervisorMarks).HasPrecision(5, 2);
      entity.Property(e => e.TotalMarks).HasPrecision(6, 2);

      entity.HasOne(e => e.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
    });

    // Proposal configuration
    modelBuilder.Entity<Proposal>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.FormType).IsRequired().HasMaxLength(20);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
      entity.Property(e => e.ReviewRemarks).HasMaxLength(1000);
      entity.Property(e => e.AttachmentPath).HasMaxLength(500);

      entity.HasOne(e => e.Group)
                .WithMany(g => g.Proposals)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.ReviewedBy)
                .WithMany()
                .HasForeignKey(e => e.ReviewedById)
                .OnDelete(DeleteBehavior.SetNull);

      entity.HasOne(e => e.PreviousVersion)
                .WithMany()
                .HasForeignKey(e => e.PreviousVersionId)
                .OnDelete(DeleteBehavior.NoAction);
    });

    // Student Form Submission configuration
    modelBuilder.Entity<StudentFormSubmission>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => new { e.ProposalId, e.StudentId }).IsUnique();
      entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
      entity.Property(e => e.EnrollmentNumber).IsRequired().HasMaxLength(20);
      entity.Property(e => e.CellNumber).HasMaxLength(20);
      entity.Property(e => e.Email).HasMaxLength(100);
      entity.Property(e => e.PostalAddress).HasMaxLength(500);

      entity.HasOne(e => e.Proposal)
                .WithMany(p => p.StudentSubmissions)
                .HasForeignKey(e => e.ProposalId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
    });

    // Student Document configuration
    modelBuilder.Entity<StudentDocument>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
      entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
      entity.Property(e => e.ContentType).HasMaxLength(100);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
      entity.Property(e => e.WorkflowStatus).IsRequired().HasMaxLength(30);
      entity.Property(e => e.ReviewRemarks).HasMaxLength(500);
      entity.Property(e => e.SupervisorRemarks).HasMaxLength(1000);
      entity.Property(e => e.CoordinatorRemarks).HasMaxLength(1000);

      entity.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(e => e.ReviewedBy)
                .WithMany()
                .HasForeignKey(e => e.ReviewedById)
                .OnDelete(DeleteBehavior.SetNull);

      entity.HasOne(e => e.SupervisorReviewedBy)
                .WithMany()
                .HasForeignKey(e => e.SupervisorReviewedById)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.CoordinatorFinalizedBy)
                .WithMany()
                .HasForeignKey(e => e.CoordinatorFinalizedById)
                .OnDelete(DeleteBehavior.NoAction);
    });

    // Document Submission Control configuration
    modelBuilder.Entity<DocumentSubmissionControl>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => new { e.DocumentType, e.DepartmentId }).IsUnique();
      entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Phase).HasMaxLength(30);
      entity.Property(e => e.UnlockMessage).HasMaxLength(1000);
      entity.Property(e => e.Instructions).HasMaxLength(2000);

      entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

      entity.HasOne(e => e.UnlockedBy)
                .WithMany()
                .HasForeignKey(e => e.UnlockedById)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.LockedBy)
                .WithMany()
                .HasForeignKey(e => e.LockedById)
                .OnDelete(DeleteBehavior.NoAction);
    });

    // Project Budget configuration
    modelBuilder.Entity<ProjectBudget>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
      entity.Property(e => e.Description).HasMaxLength(1000);
      entity.Property(e => e.RequestedAmount).HasPrecision(12, 2);
      entity.Property(e => e.ApprovedAmount).HasPrecision(12, 2);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
      entity.Property(e => e.BoQFilePath).HasMaxLength(500);
      entity.Property(e => e.SupervisorRemarks).HasMaxLength(500);
      entity.Property(e => e.HODRemarks).HasMaxLength(500);
      entity.Property(e => e.FinanceRemarks).HasMaxLength(500);
      entity.Property(e => e.DisbursementReference).HasMaxLength(100);

      entity.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.SupervisorEndorsedBy)
                .WithMany()
                .HasForeignKey(e => e.SupervisorEndorsedById)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.HODApprovedBy)
                .WithMany()
                .HasForeignKey(e => e.HODApprovedById)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.FinanceDisbursedBy)
                .WithMany()
                .HasForeignKey(e => e.FinanceDisbursedById)
                .OnDelete(DeleteBehavior.NoAction);
    });

    // Monthly Report configuration
    modelBuilder.Entity<MonthlyReport>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => new { e.GroupId, e.StudentId, e.Month, e.Year }).IsUnique();
      entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
      entity.Property(e => e.ReportFilePath).HasMaxLength(500);
      entity.Property(e => e.Summary).HasMaxLength(2000);
      entity.Property(e => e.ChallengesFaced).HasMaxLength(1000);
      entity.Property(e => e.NextMonthPlan).HasMaxLength(1000);
      entity.Property(e => e.SupervisorMarks).HasPrecision(4, 2);
      entity.Property(e => e.SupervisorRemarks).HasMaxLength(500);
      entity.Property(e => e.EscalationReason).HasMaxLength(500);
      entity.Property(e => e.HODWarningRemarks).HasMaxLength(500);

      entity.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(e => e.GradedBy)
                .WithMany()
                .HasForeignKey(e => e.GradedById)
                .OnDelete(DeleteBehavior.SetNull);
    });

    // Escalation configuration
    modelBuilder.Entity<Escalation>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Reason).IsRequired().HasMaxLength(1000);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
      entity.Property(e => e.Severity).IsRequired().HasMaxLength(20);
      entity.Property(e => e.ResolutionNotes).HasMaxLength(1000);

      entity.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(e => e.ReportedBy)
                .WithMany()
                .HasForeignKey(e => e.ReportedById)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.ResolvedBy)
        .WithMany()
        .HasForeignKey(e => e.ResolvedById)
        .OnDelete(DeleteBehavior.NoAction);
    });

    // Defense configuration
    modelBuilder.Entity<Defense>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
      entity.Property(e => e.Result).HasMaxLength(50);
      entity.Property(e => e.Venue).HasMaxLength(200);
      entity.Property(e => e.Notes).HasMaxLength(1000);
      entity.Property(e => e.ResultRemarks).HasMaxLength(1000);

      entity.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
    });

    // DefenseEvaluator configuration
    modelBuilder.Entity<DefenseEvaluator>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Role).IsRequired().HasMaxLength(30);

      entity.HasOne(e => e.Defense)
                .WithMany(d => d.Evaluators)
                .HasForeignKey(e => e.DefenseId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.Staff)
                .WithMany()
                .HasForeignKey(e => e.StaffId)
                .OnDelete(DeleteBehavior.Restrict);
    });

    // DefenseMarks configuration
    modelBuilder.Entity<DefenseMarks>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.TotalMarks).HasPrecision(5, 2);
      entity.Property(e => e.PresentationMarks).HasPrecision(5, 2);
      entity.Property(e => e.TechnicalMarks).HasPrecision(5, 2);
      entity.Property(e => e.DocumentationMarks).HasPrecision(5, 2);
      entity.Property(e => e.QAMarks).HasPrecision(5, 2);
      entity.Property(e => e.Comments).HasMaxLength(1000);
      entity.Property(e => e.Feedback).HasMaxLength(2000);

      entity.HasOne(e => e.Defense)
                .WithMany(d => d.Marks)
                .HasForeignKey(e => e.DefenseId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.Evaluator)
                .WithMany()
                .HasForeignKey(e => e.EvaluatorId)
                .OnDelete(DeleteBehavior.Restrict);
    });

    // ProjectEvaluation configuration
    modelBuilder.Entity<ProjectEvaluation>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.CoordinatorTimelineMarks).HasPrecision(5, 2);
      entity.Property(e => e.SupervisorProgressMarks).HasPrecision(5, 2);
      entity.Property(e => e.InitialDefenseMarks).HasPrecision(5, 2);
      entity.Property(e => e.MidDefenseMarks).HasPrecision(5, 2);
      entity.Property(e => e.FinalDefenseMarks).HasPrecision(5, 2);
      entity.Property(e => e.TotalMarks).HasPrecision(6, 2);
      entity.Property(e => e.Percentage).HasPrecision(5, 2);
      entity.Property(e => e.Grade).HasMaxLength(5);
      entity.Property(e => e.CoordinatorRemarks).HasMaxLength(1000);
      entity.Property(e => e.SupervisorRemarks).HasMaxLength(1000);

      entity.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.CoordinatorEvaluatedBy)
                .WithMany()
                .HasForeignKey(e => e.CoordinatorEvaluatedById)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.SupervisorEvaluatedBy)
                .WithMany()
                .HasForeignKey(e => e.SupervisorEvaluatedById)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.InitialDefense)
                .WithMany()
                .HasForeignKey(e => e.InitialDefenseId)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.MidDefense)
                .WithMany()
                .HasForeignKey(e => e.MidDefenseId)
                .OnDelete(DeleteBehavior.NoAction);

      entity.HasOne(e => e.FinalDefense)
                .WithMany()
                .HasForeignKey(e => e.FinalDefenseId)
                .OnDelete(DeleteBehavior.NoAction);
    });

    // ProposalCommittee configuration
    modelBuilder.Entity<ProposalCommittee>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(30);

      entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

      entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(e => e.ApprovedBy)
                .WithMany()
                .HasForeignKey(e => e.ApprovedById)
                .OnDelete(DeleteBehavior.NoAction);
    });

    // ProposalCommitteeMember configuration
    modelBuilder.Entity<ProposalCommitteeMember>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasIndex(e => new { e.CommitteeId, e.StaffId }).IsUnique();

      entity.HasOne(e => e.Committee)
                .WithMany(c => c.Members)
                .HasForeignKey(e => e.CommitteeId)
                .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(e => e.Staff)
                .WithMany()
                .HasForeignKey(e => e.StaffId)
                .OnDelete(DeleteBehavior.Restrict);
    });

    // SupervisorMeeting configuration
    modelBuilder.Entity<SupervisorMeeting>(entity =>
    {
      entity.HasKey(e => e.Id);
      
      // Unique constraint: one meeting per group per month per week
      entity.HasIndex(e => new { e.GroupId, e.MonthNumber, e.WeekNumber })
            .IsUnique();
      
      entity.Property(e => e.MonthNumber).IsRequired();
      entity.Property(e => e.WeekNumber).IsRequired();
      entity.Property(e => e.MeetingDate).IsRequired();
      entity.Property(e => e.TopicsDiscussed).HasMaxLength(2000);
      entity.Property(e => e.SupervisorNotes).HasMaxLength(2000);
      entity.Property(e => e.Agenda).HasMaxLength(1000);
      entity.Property(e => e.StudentAttendance).IsRequired().HasDefaultValue("[]");
      entity.Property(e => e.StudentNotes).HasMaxLength(2000);
      
      // Relationships
      entity.HasOne(e => e.Group)
            .WithMany()
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
      
      entity.HasOne(e => e.Supervisor)
            .WithMany()
            .HasForeignKey(e => e.SupervisorId)
            .OnDelete(DeleteBehavior.NoAction);
    });
  }
}