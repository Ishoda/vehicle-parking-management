/*
    Master Data Seed Script

    Seeds:
      1. PARKING_VEHICLE_TYPE
      2. PARKING_SPACE
      3. PARKING_RATE
*/

USE [VehicleParkingManagementDB];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @SeedDateTime DATETIME2(0) = SYSUTCDATETIME();

    /* 1. SEED VEHICLE TYPES */

    INSERT INTO dbo.PARKING_VEHICLE_TYPE
    (
        TypeName,
        Description,
        ActiveStatus,
        CreatedAt,
        CreatedBy
    )
    SELECT
        SeedData.TypeName,
        SeedData.Description,
        1,
        @SeedDateTime,
        NULL
    FROM
    (
        VALUES
            (
                N'Motorcycle',
                N'Two-wheeled motor vehicles'
            ),
            (
                N'Three-Wheeler',
                N'Three-wheeled passenger vehicles'
            ),
            (
                N'Car',
                N'Standard four-wheeled passenger vehicles'
            ),
            (
                N'Van',
                N'Large passenger or light commercial vehicles'
            )
    ) AS SeedData(TypeName, Description)
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.PARKING_VEHICLE_TYPE ExistingType
        WHERE ExistingType.TypeName = SeedData.TypeName
    );

    /*2. SEED PARKING SPACES*/

    INSERT INTO dbo.PARKING_SPACE
    (
        VehicleTypeID,
        SpaceCode,
        SpaceName,
        SpaceStatus,
        ActiveStatus,
        CreatedAt,
        CreatedBy
    )
    SELECT
        VehicleType.VehicleTypeID,
        SeedData.SpaceCode,
        SeedData.SpaceName,
        'AVAILABLE',
        1,
        @SeedDateTime,
        NULL
    FROM
    (
        VALUES
            ('AC-01', N'Motorcycle Space 01', N'Motorcycle'),
            ('AC-02', N'Motorcycle Space 02', N'Motorcycle'),
            ('AC-03', N'Motorcycle Space 03', N'Motorcycle'),

            ('AC-04', N'Three-Wheeler Space 01', N'Three-Wheeler'),
            ('AC-05', N'Three-Wheeler Space 02', N'Three-Wheeler'),

            ('AC-06', N'Car Space 01', N'Car'),
            ('AC-07', N'Car Space 02', N'Car'),
            ('AC-08', N'Car Space 03', N'Car'),
            ('AC-09', N'Car Space 04', N'Car'),

            ('AC-10', N'Van Space 01', N'Van'),
            ('AC-11', N'Van Space 02', N'Van')
    ) AS SeedData(SpaceCode, SpaceName, VehicleTypeName)
    INNER JOIN dbo.PARKING_VEHICLE_TYPE VehicleType
        ON VehicleType.TypeName = SeedData.VehicleTypeName
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.PARKING_SPACE ExistingSpace
        WHERE ExistingSpace.SpaceCode = SeedData.SpaceCode
    );

    /*3. SEED HOURLY PARKING RATES*/

    INSERT INTO dbo.PARKING_RATE
    (
        VehicleTypeID,
        RateName,
        RateAmount,
        RateUnit,
        EffectiveFrom,
        EffectiveTo,
        ActiveStatus,
        CreatedAt,
        CreatedBy
    )
    SELECT
        VehicleType.VehicleTypeID,
        SeedData.RateName,
        SeedData.RateAmount,
        'HOURLY',
        @SeedDateTime,
        NULL,
        1,
        @SeedDateTime,
        NULL
    FROM
    (
        VALUES
            (
                N'Motorcycle',
                N'Motorcycle Hourly Rate',
                CAST(50.00 AS DECIMAL(12,2))
            ),
            (
                N'Three-Wheeler',
                N'Three-Wheeler Hourly Rate',
                CAST(75.00 AS DECIMAL(12,2))
            ),
            (
                N'Car',
                N'Car Hourly Rate',
                CAST(100.00 AS DECIMAL(12,2))
            ),
            (
                N'Van',
                N'Van Hourly Rate',
                CAST(150.00 AS DECIMAL(12,2))
            )
    ) AS SeedData(VehicleTypeName, RateName, RateAmount)
    INNER JOIN dbo.PARKING_VEHICLE_TYPE VehicleType
        ON VehicleType.TypeName = SeedData.VehicleTypeName
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.PARKING_RATE ExistingRate
        WHERE ExistingRate.VehicleTypeID = VehicleType.VehicleTypeID
          AND ExistingRate.RateName = SeedData.RateName
          AND ExistingRate.ActiveStatus = 1
          AND ExistingRate.EffectiveTo IS NULL
    );

    COMMIT TRANSACTION;

    PRINT 'Master data seeded successfully.';

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT 'Master data seeding failed.';
    THROW;

END CATCH;
GO

/* VERIFICATION RESULTS */

SELECT
    VehicleTypeID,
    TypeName,
    Description,
    ActiveStatus,
    CreatedAt,
    CreatedBy
FROM dbo.PARKING_VEHICLE_TYPE
ORDER BY VehicleTypeID;

SELECT
    ParkingSpace.SpaceID,
    ParkingSpace.SpaceCode,
    ParkingSpace.SpaceName,
    VehicleType.TypeName AS AllowedVehicleType,
    ParkingSpace.SpaceStatus,
    ParkingSpace.ActiveStatus,
    ParkingSpace.CreatedAt,
    ParkingSpace.CreatedBy
FROM dbo.PARKING_SPACE ParkingSpace
INNER JOIN dbo.PARKING_VEHICLE_TYPE VehicleType
    ON VehicleType.VehicleTypeID = ParkingSpace.VehicleTypeID
ORDER BY ParkingSpace.SpaceID;

SELECT
    ParkingRate.RateID,
    VehicleType.TypeName AS VehicleType,
    ParkingRate.RateName,
    ParkingRate.RateAmount,
    ParkingRate.RateUnit,
    ParkingRate.EffectiveFrom,
    ParkingRate.EffectiveTo,
    ParkingRate.ActiveStatus
FROM dbo.PARKING_RATE ParkingRate
INNER JOIN dbo.PARKING_VEHICLE_TYPE VehicleType
    ON VehicleType.VehicleTypeID = ParkingRate.VehicleTypeID
ORDER BY ParkingRate.RateID;
GO