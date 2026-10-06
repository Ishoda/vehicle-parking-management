USE [VehicleParkingManagementDB];
GO

CREATE OR ALTER PROCEDURE dbo.PARKING_SP_Monthly_Attendance
(
    @ActionType              INT,

    @TicketID                INT = NULL,
    @VehicleID               INT = NULL,
    @ContractID              INT = NULL,
    @SpaceID                 INT = NULL,

    @PerformedByUserID       INT = NULL,

    @MonthlyCapacityPercentage DECIMAL(5,2) = 30.00,

    @FromDate                DATE = NULL,
    @ToDate                  DATE = NULL,

	@VehicleNumber VARCHAR(30) = NULL,
    @ExpectedVehicleTypeID INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

	IF @ActionType IN (3, 4)
	   AND @PerformedByUserID IS NULL
	BEGIN
		SELECT
			400 AS StatusCode,
			N'PerformedByUserID is required for entry and exit.' AS Message;
		RETURN;
	END;

	IF @ActionType IN (3, 4)
       AND NOT EXISTS
       (
           SELECT 1
           FROM dbo.PARKING_USER
           WHERE UserID = @PerformedByUserID
             AND ActiveStatus = 1
             AND UserRole IN ('A', 'O')
       )
    BEGIN
        SELECT
            403 AS StatusCode,
            N'An active administrator or operator is required.' AS Message;
        RETURN;
    END;

    /* ============================================================
       VALID ACTION
       ============================================================ */
    IF @ActionType NOT BETWEEN 1 AND 7
    BEGIN
        SELECT
            400 AS StatusCode,
            N'Invalid ActionType.' AS Message;
        RETURN;
    END;


    /* ============================================================
       ACTION 1
       LIST MONTHLY ATTENDANCE
       ============================================================ */
    IF @ActionType = 1
    BEGIN
        SELECT
            t.TicketID,
            t.TicketNumber,

            t.VehicleID,
            v.VehicleNumber,
            vt.TypeName AS VehicleType,

            t.MonthlyContractID,
            mc.ContractNumber,
            c.CustomerName,

            t.SpaceID,
            s.SpaceCode,
            s.SpaceName,

            t.EntryDateTime,
            t.ExitDateTime,
            t.TicketStatus,

            t.EntryOperatorID,
            t.ExitOperatorID

        FROM dbo.PARKING_TICKET AS t

        INNER JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v
            ON v.VehicleID = t.VehicleID

        INNER JOIN dbo.PARKING_VEHICLE_TYPE AS vt
            ON vt.VehicleTypeID = v.VehicleTypeID

        INNER JOIN dbo.PARKING_MONTHLY_CONTRACT AS mc
            ON mc.ContractID = t.MonthlyContractID

        INNER JOIN dbo.PARKING_CUSTOMER AS c
            ON c.CustomerID = mc.CustomerID

        INNER JOIN dbo.PARKING_SPACE AS s
            ON s.SpaceID = t.SpaceID

        WHERE
            t.ParkingType = 'MONTHLY'
            AND
            (
                @FromDate IS NULL
                OR CAST(t.EntryDateTime AS DATE) >= @FromDate
            )
            AND
            (
                @ToDate IS NULL
                OR CAST(t.EntryDateTime AS DATE) <= @ToDate
            )

        ORDER BY
            t.EntryDateTime DESC;

        RETURN;
    END;


    /* ============================================================
       ACTION 2
       GET ATTENDANCE BY TICKET ID
       ============================================================ */
    IF @ActionType = 2
    BEGIN
        IF @TicketID IS NULL
        BEGIN
            SELECT
                400 AS StatusCode,
                N'TicketID is required.' AS Message;
            RETURN;
        END;


        SELECT
            t.TicketID,
            t.TicketNumber,

            t.VehicleID,
            v.VehicleNumber,
            vt.TypeName AS VehicleType,

            t.MonthlyContractID,
            mc.ContractNumber,

            c.CustomerID,
            c.CustomerName,

            t.SpaceID,
            s.SpaceCode,
            s.SpaceName,

            t.EntryDateTime,
            t.ExitDateTime,
            t.TicketStatus,

            t.EntryOperatorID,
            t.ExitOperatorID

        FROM dbo.PARKING_TICKET AS t

        INNER JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v
            ON v.VehicleID = t.VehicleID

        INNER JOIN dbo.PARKING_VEHICLE_TYPE AS vt
            ON vt.VehicleTypeID = v.VehicleTypeID

        INNER JOIN dbo.PARKING_MONTHLY_CONTRACT AS mc
            ON mc.ContractID = t.MonthlyContractID

        INNER JOIN dbo.PARKING_CUSTOMER AS c
            ON c.CustomerID = mc.CustomerID

        INNER JOIN dbo.PARKING_SPACE AS s
            ON s.SpaceID = t.SpaceID

        WHERE t.TicketID = @TicketID
          AND t.ParkingType = 'MONTHLY';

        RETURN;
    END;


    /* ============================================================
       ACTION 3
       MONTHLY CUSTOMER ENTRY
       ============================================================ */
	    IF @ActionType = 3
    BEGIN
        SET @VehicleNumber =
            UPPER(NULLIF(LTRIM(RTRIM(@VehicleNumber)), ''));

        IF @VehicleID IS NULL AND @VehicleNumber IS NULL
        BEGIN
            SELECT
                400 AS StatusCode,
                N'Vehicle number or VehicleID is required.' AS Message;
            RETURN;
        END;

        IF @MonthlyCapacityPercentage IS NULL
           OR @MonthlyCapacityPercentage < 0
           OR @MonthlyCapacityPercentage > 100
        BEGIN
            SELECT
                400 AS StatusCode,
                N'Monthly capacity percentage must be between 0 and 100.'
                    AS Message;
            RETURN;
        END;

        BEGIN TRY
            BEGIN TRANSACTION;

            DECLARE
                @ResolvedVehicleID INT,
                @EntryVehicleTypeID INT,
                @EntryCustomerID INT,
                @EntryVehicleNumber VARCHAR(30);

            SELECT
                @ResolvedVehicleID = VehicleID,
                @EntryVehicleTypeID = VehicleTypeID,
                @EntryCustomerID = CustomerID,
                @EntryVehicleNumber = VehicleNumber
            FROM dbo.PARKING_CUSTOMER_VEHICLE WITH (UPDLOCK, HOLDLOCK)
            WHERE ActiveStatus = 1
              AND
              (
                  (@VehicleNumber IS NOT NULL
                   AND VehicleNumber = @VehicleNumber)
                  OR
                  (@VehicleNumber IS NULL
                   AND VehicleID = @VehicleID)
              );

            IF @ResolvedVehicleID IS NULL
               OR @EntryCustomerID IS NULL
               OR
               (
                   @VehicleID IS NOT NULL
                   AND @VehicleID <> @ResolvedVehicleID
               )
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    404 AS StatusCode,
                    N'Active registered monthly vehicle not found.' AS Message;
                RETURN;
            END;

            SET @VehicleID = @ResolvedVehicleID;

            IF @ExpectedVehicleTypeID IS NOT NULL
               AND @ExpectedVehicleTypeID <> @EntryVehicleTypeID
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'Selected vehicle type does not match the registered vehicle.'
                        AS Message;
                RETURN;
            END;

            IF NOT EXISTS
            (
                SELECT 1
                FROM dbo.PARKING_VEHICLE_TYPE WITH (HOLDLOCK)
                WHERE VehicleTypeID = @EntryVehicleTypeID
                  AND ActiveStatus = 1
            )
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'The registered vehicle type is inactive.' AS Message;
                RETURN;
            END;

            DECLARE
                @EntryCustomerName NVARCHAR(200),
                @EntryMobileNumber VARCHAR(20);

            SELECT
                @EntryCustomerName = CustomerName,
                @EntryMobileNumber = MobileNumber
            FROM dbo.PARKING_CUSTOMER WITH (HOLDLOCK)
            WHERE CustomerID = @EntryCustomerID
              AND ActiveStatus = 1;

            IF @EntryCustomerName IS NULL
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'The registered customer is inactive.' AS Message;
                RETURN;
            END;

            IF EXISTS
            (
                SELECT 1
                FROM dbo.PARKING_TICKET WITH (UPDLOCK, HOLDLOCK)
                WHERE VehicleID = @VehicleID
                  AND ExitDateTime IS NULL
            )
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'This vehicle already has an open parking visit.' AS Message;
                RETURN;
            END;

            DECLARE @EntryTimeUtc DATETIME2(0) = SYSUTCDATETIME();

            -- Inclusive Sri Lankan contract dates; timestamps remain UTC.
            DECLARE @EntryBusinessDate DATE =
                CONVERT(DATE, DATEADD(MINUTE, 330, @EntryTimeUtc));

            DECLARE
                @EntryActiveContractID INT,
                @EntryContractNumber VARCHAR(40),
                @EntryValidContractCount INT;

            SELECT @EntryValidContractCount = COUNT(*)
            FROM dbo.PARKING_MONTHLY_CONTRACT WITH (UPDLOCK, HOLDLOCK)
            WHERE VehicleID = @VehicleID
              AND CustomerID = @EntryCustomerID
              AND ContractStatus = 'ACTIVE'
              AND CancelledAt IS NULL
              AND StartDate <= @EntryBusinessDate
              AND EndDate >= @EntryBusinessDate;

            IF @EntryValidContractCount = 0
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'No valid active monthly contract covers today.'
                        AS Message;
                RETURN;
            END;

            IF @EntryValidContractCount > 1
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'Multiple valid contracts exist. An administrator must resolve the overlap.'
                        AS Message;
                RETURN;
            END;

            SELECT
                @EntryActiveContractID = ContractID,
                @EntryContractNumber = ContractNumber
            FROM dbo.PARKING_MONTHLY_CONTRACT
            WHERE VehicleID = @VehicleID
              AND CustomerID = @EntryCustomerID
              AND ContractStatus = 'ACTIVE'
              AND CancelledAt IS NULL
              AND StartDate <= @EntryBusinessDate
              AND EndDate >= @EntryBusinessDate;

            DECLARE
                @EntryActiveMonthlyContracts INT,
                @EntryReservedMonthlySpaces INT,
                @EntryCurrentMonthlyVehicles INT;

            SELECT @EntryActiveMonthlyContracts = COUNT(*)
            FROM dbo.PARKING_MONTHLY_CONTRACT WITH (UPDLOCK, HOLDLOCK)
            WHERE ContractStatus = 'ACTIVE';

            -- Preserve the existing partner-defined capacity formula.
            SET @EntryReservedMonthlySpaces =
                CONVERT(INT, CEILING(
                    @EntryActiveMonthlyContracts
                    * @MonthlyCapacityPercentage / 100.0
                ));

            SELECT @EntryCurrentMonthlyVehicles = COUNT(*)
            FROM dbo.PARKING_TICKET WITH (UPDLOCK, HOLDLOCK)
            WHERE ParkingType = 'MONTHLY'
              AND ExitDateTime IS NULL;

            IF @EntryCurrentMonthlyVehicles >= @EntryReservedMonthlySpaces
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'Monthly reserved parking capacity is currently full.'
                        AS Message;
                RETURN;
            END;

            DECLARE @EntryAllocatedSpaceID INT = @SpaceID;

            IF @EntryAllocatedSpaceID IS NULL
            BEGIN
                SELECT TOP (1)
                    @EntryAllocatedSpaceID = S.SpaceID
                FROM dbo.PARKING_SPACE AS S
                    WITH (UPDLOCK, READPAST, ROWLOCK)
                WHERE S.VehicleTypeID = @EntryVehicleTypeID
                  AND S.ActiveStatus = 1
                  AND S.SpaceStatus = 'AVAILABLE'
                  AND NOT EXISTS
                  (
                      SELECT 1
                      FROM dbo.PARKING_TICKET AS T
                      WHERE T.SpaceID = S.SpaceID
                        AND T.ExitDateTime IS NULL
                  )
                ORDER BY S.SpaceCode;
            END;

            IF @EntryAllocatedSpaceID IS NULL
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'No matching available parking space.' AS Message;
                RETURN;
            END;

            UPDATE dbo.PARKING_SPACE
            SET
                SpaceStatus = 'OCCUPIED',
                UpdatedAt = @EntryTimeUtc,
                UpdatedBy = @PerformedByUserID
            WHERE SpaceID = @EntryAllocatedSpaceID
              AND VehicleTypeID = @EntryVehicleTypeID
              AND ActiveStatus = 1
              AND SpaceStatus = 'AVAILABLE';

            IF @@ROWCOUNT <> 1
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT
                    409 AS StatusCode,
                    N'Selected space is occupied, blocked, inactive, or for a different vehicle type.'
                        AS Message;
                RETURN;
            END;

            DECLARE @EntryTicketNumber VARCHAR(40) =
                'M-' + CONVERT(VARCHAR(36), NEWID());

            INSERT dbo.PARKING_TICKET
            (
                TicketNumber,
                VehicleID,
                SpaceID,
                MonthlyContractID,
                ParkingType,
                EntryDateTime,
                TicketStatus,
                EntryOperatorID,
                CreatedAt,
                CreatedBy,
                CustomerName,
                MobileNumber
            )
            VALUES
            (
                @EntryTicketNumber,
                @VehicleID,
                @EntryAllocatedSpaceID,
                @EntryActiveContractID,
                'MONTHLY',
                @EntryTimeUtc,
                'OPEN',
                @PerformedByUserID,
                @EntryTimeUtc,
                @PerformedByUserID,
                @EntryCustomerName,
                @EntryMobileNumber
            );

            DECLARE @EntryNewTicketID INT =
                CONVERT(INT, SCOPE_IDENTITY());

            COMMIT TRANSACTION;

            SELECT
                201 AS StatusCode,
                N'Monthly customer entry recorded successfully.' AS Message,
                @EntryNewTicketID AS TicketID,
                @EntryTicketNumber AS TicketNumber,
                @EntryVehicleNumber AS VehicleNumber,
                @EntryAllocatedSpaceID AS SpaceID,
                @EntryTimeUtc AS EntryDateTime,
                @EntryActiveContractID AS ContractID,
                @EntryContractNumber AS ContractNumber;

            RETURN;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;

            THROW;
        END CATCH;
    END;


    /* ============================================================
       ACTION 4
       MONTHLY CUSTOMER EXIT
       ============================================================ */
    IF @ActionType = 4
    BEGIN

        IF @VehicleID IS NULL
        BEGIN
            SELECT
                400 AS StatusCode,
                N'VehicleID is required.' AS Message;
            RETURN;
        END;


        BEGIN TRY

            BEGIN TRANSACTION;


            DECLARE @OpenTicketID INT;
            DECLARE @ExitSpaceID INT;


            SELECT
                @OpenTicketID = TicketID,
                @ExitSpaceID = SpaceID

            FROM dbo.PARKING_TICKET WITH (UPDLOCK, HOLDLOCK)

            WHERE VehicleID = @VehicleID
              AND ParkingType = 'MONTHLY'
              AND TicketStatus = 'OPEN';


            IF @OpenTicketID IS NULL
            BEGIN
                ROLLBACK TRANSACTION;

                SELECT
                    404 AS StatusCode,
                    N'No open monthly attendance record was found for this vehicle.' AS Message;
                RETURN;
            END;


            /* ----------------------------------------------------
               Close monthly attendance
               ---------------------------------------------------- */
            UPDATE dbo.PARKING_TICKET
            SET
                ExitDateTime = SYSUTCDATETIME(),
                TicketStatus = 'CLOSED',
                ExitOperatorID = @PerformedByUserID,
                UpdatedAt = SYSUTCDATETIME(),
                UpdatedBy = @PerformedByUserID
            WHERE TicketID = @OpenTicketID;


            /* ----------------------------------------------------
               Release parking space
               ---------------------------------------------------- */
            UPDATE dbo.PARKING_SPACE
            SET
                SpaceStatus = 'AVAILABLE',
                UpdatedAt = SYSUTCDATETIME(),
                UpdatedBy = @PerformedByUserID
            WHERE SpaceID = @ExitSpaceID;


            COMMIT TRANSACTION;


            SELECT
                200 AS StatusCode,
                N'Monthly customer exit recorded successfully.' AS Message,

                @OpenTicketID AS TicketID,
                @ExitSpaceID AS SpaceID;

            RETURN;

        END TRY

        BEGIN CATCH

            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;

            THROW;

        END CATCH
    END;


    /* ============================================================
       ACTION 5
       TODAY'S MONTHLY ATTENDANCE
       ============================================================ */
    IF @ActionType = 5
    BEGIN

        SELECT
            t.TicketID,
            t.TicketNumber,

            c.CustomerName,
            v.VehicleNumber,
            vt.TypeName AS VehicleType,

            mc.ContractNumber,

            s.SpaceCode,
            s.SpaceName,

            t.EntryDateTime,
            t.ExitDateTime,
            t.TicketStatus

        FROM dbo.PARKING_TICKET AS t

        INNER JOIN dbo.PARKING_MONTHLY_CONTRACT AS mc
            ON mc.ContractID = t.MonthlyContractID

        INNER JOIN dbo.PARKING_CUSTOMER AS c
            ON c.CustomerID = mc.CustomerID

        INNER JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v
            ON v.VehicleID = t.VehicleID

        INNER JOIN dbo.PARKING_VEHICLE_TYPE AS vt
            ON vt.VehicleTypeID = v.VehicleTypeID

        INNER JOIN dbo.PARKING_SPACE AS s
            ON s.SpaceID = t.SpaceID

        WHERE t.ParkingType = 'MONTHLY'
          AND CAST(t.EntryDateTime AS DATE) = CAST(GETDATE() AS DATE)

        ORDER BY
            t.EntryDateTime DESC;

        RETURN;
    END;


    /* ============================================================
       ACTION 6
       CURRENT MONTHLY CUSTOMERS INSIDE
       ============================================================ */
    IF @ActionType = 6
    BEGIN

        SELECT
            t.TicketID,
            t.TicketNumber,

            c.CustomerID,
            c.CustomerName,

            v.VehicleID,
            v.VehicleNumber,

            vt.TypeName AS VehicleType,

            mc.ContractID,
            mc.ContractNumber,

            s.SpaceID,
            s.SpaceCode,
            s.SpaceName,

            t.EntryDateTime

        FROM dbo.PARKING_TICKET AS t

        INNER JOIN dbo.PARKING_MONTHLY_CONTRACT AS mc
            ON mc.ContractID = t.MonthlyContractID

        INNER JOIN dbo.PARKING_CUSTOMER AS c
            ON c.CustomerID = mc.CustomerID

        INNER JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v
            ON v.VehicleID = t.VehicleID

        INNER JOIN dbo.PARKING_VEHICLE_TYPE AS vt
            ON vt.VehicleTypeID = v.VehicleTypeID

        INNER JOIN dbo.PARKING_SPACE AS s
            ON s.SpaceID = t.SpaceID

        WHERE t.ParkingType = 'MONTHLY'
          AND t.TicketStatus = 'OPEN'

        ORDER BY
            t.EntryDateTime;

        RETURN;
    END;


    /* ============================================================
       ACTION 7
       ATTENDANCE HISTORY FOR A CONTRACT
       ============================================================ */
    IF @ActionType = 7
    BEGIN

        IF @ContractID IS NULL
        BEGIN
            SELECT
                400 AS StatusCode,
                N'ContractID is required.' AS Message;
            RETURN;
        END;


        SELECT
            t.TicketID,
            t.TicketNumber,

            t.VehicleID,
            v.VehicleNumber,

            t.SpaceID,
            s.SpaceCode,
            s.SpaceName,

            t.EntryDateTime,
            t.ExitDateTime,
            t.TicketStatus

        FROM dbo.PARKING_TICKET AS t

        INNER JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v
            ON v.VehicleID = t.VehicleID

        INNER JOIN dbo.PARKING_SPACE AS s
            ON s.SpaceID = t.SpaceID

        WHERE t.MonthlyContractID = @ContractID
          AND t.ParkingType = 'MONTHLY'
          AND
          (
              @FromDate IS NULL
              OR CAST(t.EntryDateTime AS DATE) >= @FromDate
          )
          AND
          (
              @ToDate IS NULL
              OR CAST(t.EntryDateTime AS DATE) <= @ToDate
          )

        ORDER BY
            t.EntryDateTime DESC;

        RETURN;
    END;

END;
GO