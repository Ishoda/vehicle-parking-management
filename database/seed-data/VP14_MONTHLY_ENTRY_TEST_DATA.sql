USE [VehicleParkingManagementDB];
GO

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @AdminID INT;

    SELECT TOP (1) @AdminID = UserID
    FROM dbo.PARKING_USER
    WHERE UserRole = 'A'
      AND ActiveStatus = 1
    ORDER BY UserID;

    IF @AdminID IS NULL
    BEGIN
        THROW 50001, 'No active administrator exists.', 1;
    END;

    -- Stop rather than overwrite or reuse a previous test run.
    IF EXISTS
    (
        SELECT 1
        FROM dbo.PARKING_VEHICLE_TYPE
        WHERE TypeName = N'VP14 Monthly Test'
    )
    OR EXISTS
    (
        SELECT 1
        FROM dbo.PARKING_CUSTOMER_VEHICLE
        WHERE VehicleNumber IN
        (
            'VP14-M-ACTIVE',
            'VP14-M-EXPIRED',
            'VP14-M-CANCELLED',
            'VP14-M-PASTDATE'
        )
    )
    OR EXISTS
    (
        SELECT 1
        FROM dbo.PARKING_SPACE
        WHERE SpaceCode IN ('VP14-M-01', 'VP14-M-02')
    )
    BEGIN
        THROW 50002,
            'Monthly test records already exist. Inspect them before repeating setup.',
            1;
    END;

    DECLARE @NowUtc DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @Today DATE =
        CONVERT(DATE, DATEADD(MINUTE, 330, @NowUtc));

    INSERT dbo.PARKING_VEHICLE_TYPE
    (
        TypeName,
        Description,
        ActiveStatus,
        CreatedAt,
        CreatedBy
    )
    VALUES
    (
        N'VP14 Monthly Test',
        N'Development test vehicle type',
        1,
        @NowUtc,
        @AdminID
    );

    DECLARE @TypeID INT = CONVERT(INT, SCOPE_IDENTITY());

    INSERT dbo.PARKING_CUSTOMER
    (
        CustomerName,
        MobileNumber,
        ActiveStatus,
        CreatedAt,
        CreatedBy
    )
    VALUES
    (
        N'VP14 Test Customer',
        '0770000000',
        1,
        @NowUtc,
        @AdminID
    );

    DECLARE @CustomerID INT = CONVERT(INT, SCOPE_IDENTITY());

    INSERT dbo.PARKING_CUSTOMER_VEHICLE
    (
        CustomerID,
        VehicleTypeID,
        VehicleNumber,
        ActiveStatus,
        CreatedAt,
        CreatedBy
    )
    SELECT
        @CustomerID,
        @TypeID,
        TestVehicleNumber,
        1,
        @NowUtc,
        @AdminID
    FROM
    (
        VALUES
            ('VP14-M-ACTIVE'),
            ('VP14-M-EXPIRED'),
            ('VP14-M-CANCELLED'),
            ('VP14-M-PASTDATE')
    ) AS TestVehicles(TestVehicleNumber);

    INSERT dbo.PARKING_MONTHLY_CONTRACT
    (
        ContractNumber,
        CustomerID,
        VehicleID,
        MonthlyFee,
        StartDate,
        EndDate,
        ContractStatus,
        CancelledAt,
        CancelledReason,
        CreatedAt,
        CreatedBy
    )
    SELECT
        'VP14-C-' + TestCases.ContractSuffix,
        @CustomerID,
        V.VehicleID,
        5000,
        DATEADD(DAY, TestCases.StartOffset, @Today),
        DATEADD(DAY, TestCases.EndOffset, @Today),
        TestCases.TestStatus,
        CASE
            WHEN TestCases.TestStatus = 'CANCELLED'
                THEN @NowUtc
            ELSE NULL
        END,
        CASE
            WHEN TestCases.TestStatus = 'CANCELLED'
                THEN N'Development cancellation test'
            ELSE NULL
        END,
        @NowUtc,
        @AdminID
    FROM
    (
        VALUES
            ('VP14-M-ACTIVE',    'ACTIVE',    -1,  30, 'ACTIVE'),
            ('VP14-M-EXPIRED',   'EXPIRED',  -30,  -1, 'EXPIRED'),
            ('VP14-M-CANCELLED', 'CANCELLED', -1,  30, 'CANCELLED'),
            ('VP14-M-PASTDATE',  'PASTDATE', -30,  -1, 'ACTIVE')
    ) AS TestCases
    (
        VehicleNumber,
        ContractSuffix,
        StartOffset,
        EndOffset,
        TestStatus
    )
    INNER JOIN dbo.PARKING_CUSTOMER_VEHICLE AS V
        ON V.VehicleNumber = TestCases.VehicleNumber;

    INSERT dbo.PARKING_SPACE
    (
        VehicleTypeID,
        SpaceCode,
        SpaceName,
        SpaceStatus,
        ActiveStatus,
        CreatedAt,
        CreatedBy
    )
    VALUES
    (
        @TypeID,
        'VP14-M-01',
        N'Monthly test space 1',
        'AVAILABLE',
        1,
        @NowUtc,
        @AdminID
    ),
    (
        @TypeID,
        'VP14-M-02',
        N'Monthly test space 2',
        'AVAILABLE',
        1,
        @NowUtc,
        @AdminID
    );

    COMMIT TRANSACTION;

    SELECT VehicleTypeID, TypeName
    FROM dbo.PARKING_VEHICLE_TYPE
    WHERE VehicleTypeID = @TypeID;

    SELECT SpaceID, SpaceCode, SpaceStatus
    FROM dbo.PARKING_SPACE
    WHERE VehicleTypeID = @TypeID;

    SELECT
        C.ContractID,
        C.ContractNumber,
        V.VehicleNumber,
        C.ContractStatus,
        C.StartDate,
        C.EndDate
    FROM dbo.PARKING_MONTHLY_CONTRACT AS C
    INNER JOIN dbo.PARKING_CUSTOMER_VEHICLE AS V
        ON V.VehicleID = C.VehicleID
    WHERE C.CustomerID = @CustomerID;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO