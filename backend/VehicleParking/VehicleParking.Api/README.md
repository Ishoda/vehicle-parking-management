# Vehicle Parking Management — Backend

ASP.NET Core Web API for the Vehicle Parking Management System. The API uses .NET 10 and SQL Server. Database operations use the project's SQL Server stored procedures.

## Requirements

- .NET 10 SDK
- SQL Server with the project schema and required stored procedures installed
- Visual Studio 2026 or another editor that supports .NET 10

Check your SDK with `dotnet --list-sdks`.

## Run locally

1. Clone the repository and open `backend/VehicleParking/VehicleParking.Api`.
2. Configure your local SQL Server connection string in the project's configuration. Keep real passwords and other secrets out of Git. Use ASP.NET Core user secrets or environment variables for local credentials.
3. From the API project directory, run:

   ```powershell
   dotnet restore
   dotnet build
   dotnet run
   ```

4. Use the `Now listening on:` address printed in the terminal. The current development launch profile uses `http://localhost:5056`. Keep the terminal open while testing the API. Press Ctrl+C to stop it.

If port 5056 is already in use, stop the other running instance or use another port:

```powershell
dotnet run --no-launch-profile --urls "http://localhost:5060"
```

## Project layout

```text
backend/
├── README.md
└── VehicleParking/
    └── VehicleParking.Api/
        ├── Controllers/          # HTTP endpoints and request validation
        ├── DataAccess/           # Calls to SQL Server and stored procedures
        ├── Data/                # Database connection helper (if used by the project)
        ├── Interfaces/           # Contracts for data access
        ├── Models/               # Request and response types
        ├── Properties/           # Local launch profiles
        ├── Program.cs            # Service registration and middleware
        ├── appsettings.json      # Non-secret application settings
        └── VehicleParking.csproj # Project target and package references
```

The intended feature flow is **Controller → Interface → DataAccess → stored procedure**. Add feature-specific files as each endpoint is implemented. Folder names in this diagram describe the design; refer to the actual source tree for the current implementation.

## Database

The SQL Server schema and stored procedure scripts are maintained under the repository's `database/` directory. Apply the schema and required procedures to your local development database before testing endpoints that use them. Do not run database creation or reset scripts against a database containing data you need to keep.

## Configuration and deployment

- Configure the connection string for your own environment; do not commit credentials.
- When deploying behind IIS, install the .NET 10 Hosting Bundle on the server and configure the production connection string there.
- A successful `dotnet build` confirms compilation. Test each endpoint against a development database to verify its behavior.
