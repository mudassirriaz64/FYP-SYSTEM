using FYPSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FYPSystem.API.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Check if SuperAdmin exists
        if (await context.Users.AnyAsync(u => u.Username == "Mudassir"))
        {
            return; // Already seeded
        }

        // Create SuperAdmin with hashed password
        var superAdmin = new User
        {
            Username = "Mudassir",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("MudasiR"),
            FullName = "Mudassir (Super Admin)",
            Email = "admin@fyp.edu",
            Role = "SuperAdmin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(superAdmin);
        await context.SaveChangesAsync();

        Console.WriteLine("✅ SuperAdmin user 'Mudassir' has been seeded.");
    }
}

