USE [VehicleParkingManagementDB];
GO

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Check existing data before introducing uniqueness constraints.
    IF EXISTS
    (
        SELECT VehicleID
        FROM dbo.PARKING_TICKET
        WHERE ExitDateTime IS NULL
        GROUP BY VehicleID
        HAVING COUNT(*) > 1
    )
    BEGIN
        THROW 50001,
            'Duplicate open tickets exist for a vehicle. Review them before continuing.',
            1;
    END;

    IF EXISTS
    (
        SELECT SpaceID
        FROM dbo.PARKING_TICKET
        WHERE ExitDateTime IS NULL
        GROUP BY SpaceID
        HAVING COUNT(*) > 1
    )
    BEGIN
        THROW 50002,
            'Duplicate open tickets exist for a space. Review them before continuing.',
            1;
    END;

    IF COL_LENGTH('dbo.PARKING_TICKET', 'CustomerName') IS NULL
    BEGIN
        ALTER TABLE dbo.PARKING_TICKET
        ADD CustomerName NVARCHAR(200) NULL;
    END;

    IF COL_LENGTH('dbo.PARKING_TICKET', 'MobileNumber') IS NULL
    BEGIN
        ALTER TABLE dbo.PARKING_TICKET
        ADD MobileNumber VARCHAR(20) NULL;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.PARKING_TICKET')
          AND name = 'UX_PARKING_TICKET_OpenVehicle'
    )
    BEGIN
        CREATE UNIQUE INDEX UX_PARKING_TICKET_OpenVehicle
        ON dbo.PARKING_TICKET (VehicleID)
        WHERE ExitDateTime IS NULL;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.PARKING_TICKET')
          AND name = 'UX_PARKING_TICKET_OpenSpace'
    )
    BEGIN
        CREATE UNIQUE INDEX UX_PARKING_TICKET_OpenSpace
        ON dbo.PARKING_TICKET (SpaceID)
        WHERE ExitDateTime IS NULL;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO