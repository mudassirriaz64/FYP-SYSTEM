# FYP System

Full-stack Final Year Project management platform. Backend is ASP.NET Core (EF Core + SQL Server, JWT auth); frontend is React (Vite) with Tailwind.

## Tech Stack
- .NET SDK 10.0 (project targets `net10.0` in [fyp-backend/FYPSystem.API/FYPSystem.API.csproj](fyp-backend/FYPSystem.API/FYPSystem.API.csproj)); use the latest SDK/preview that supports it.
- ASP.NET Core Web API, EF Core SQL Server, JWT Bearer auth.
- React 19 + Vite 7 + Tailwind CSS 4 in [fyp-frontend](fyp-frontend).
- Swagger/OpenAPI enabled in Development.

## Repository Layout
- [fyp-backend/FYPSystem.API](fyp-backend/FYPSystem.API): API project, EF Core models/migrations, seeding, swagger.
- [fyp-frontend](fyp-frontend): React SPA.
- [start.bat](fyp-backend/FYPSystem.API/start.bat): convenience script to run the API.

## Prerequisites
- .NET SDK 10.0 (or adjust TargetFramework to your installed SDK if needed).
- Node.js 20+ and npm.
- SQL Server (Express/Developer/LocalDB) with TCP enabled.
- Git.
- (CLI tooling) `dotnet-ef` global tool for migrations: `dotnet tool install --global dotnet-ef`.

## Backend Configuration
Edit [fyp-backend/FYPSystem.API/appsettings.json](fyp-backend/FYPSystem.API/appsettings.json) (or override in `appsettings.Development.json`):
- `ConnectionStrings:DefaultConnection`: e.g. `Server=localhost;Database=FYPSystemDB;Trusted_Connection=True;TrustServerCertificate=True;`.
- `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience`: set production secrets.
- CORS policy in [Program.cs](fyp-backend/FYPSystem.API/Program.cs#L21-L43) allows `http://localhost:5173` and `http://localhost:3000`; add your deployed frontend origin if needed.

## Database Setup (SQL Server)
1) Ensure SQL Server is running and the configured database exists or can be created by EF.
2) From a terminal:
```bash
cd fyp-backend/FYPSystem.API
dotnet restore
# optional: install dotnet-ef if not already installed
dotnet tool install --global dotnet-ef
# apply migrations and seed data
dotnet ef database update
```
Seeding: if the Users table is empty, [DbInitializer](fyp-backend/FYPSystem.API/Data/DbInitializer.cs#L7-L37) creates a SuperAdmin user `Mudassir` with password `MudasiR`. Change/remove this after first login for security.

## Run the Backend (Development)
```bash
cd fyp-backend/FYPSystem.API
dotnet restore
dotnet run
```
- Swagger UI available in Development at `/swagger` (default ports: `http://localhost:5000` / `https://localhost:5001`).
- You can also run `start.bat` on Windows.

## Frontend Setup and Run
```bash
cd fyp-frontend
npm install
npm run dev
```
- Vite dev server defaults to `http://localhost:5173` (matches backend CORS).
- For a production build: `npm run build` (outputs to `dist/`).

## Typical Development Workflow
1) Update connection string/JWT secrets in config.
2) Run `dotnet ef database update` to create/update the DB.
3) Start API (`dotnet run`).
4) Start frontend (`npm run dev`).
5) Hit Swagger or the SPA and log in with the seeded SuperAdmin; change credentials immediately.

## Deployment Notes
- Replace dev JWT key with a strong secret and store outside source control.
- Update CORS origins to your deployed frontend domain.
- Use a production SQL Server connection string (with credentials/managed identity as appropriate).
- Publish API: `dotnet publish -c Release -o out` and host the output on IIS/Kestrel behind a reverse proxy.
- Serve the frontend `dist/` from your chosen static host (or integrate into the API `wwwroot` if desired).

## Troubleshooting
- Missing SDK: install .NET SDK matching the `TargetFramework` or lower it (e.g., `net8.0`) in the csproj if your environment requires.
- EF CLI not found: install `dotnet-ef` globally.
- SQL connection errors: confirm SQL Server service is running, TCP enabled, and connection string matches your instance.
- CORS blocked: add your frontend origin to the CORS policy in `Program.cs`.
