USE [VehicleParkingManagementDB];
GO

/* 
   Action 1: daily collection, with daily/monthly subtotals and grand total.
   Action 2: vehicle visits, filtered by entry date.
   Action 3: monthly customer contracts and current-period payment status.
   FromDate / ToDate are inclusive; NULL leaves that bound open.
   Backend must authorize report access (Admin/Owner). */

CREATE PROCEDURE dbo.PARKING_SP_Reports
    @ActionType INT,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @ActionType NOT IN (1, 2, 3)
       OR (@FromDate IS NOT NULL AND @ToDate IS NOT NULL AND @ToDate < @FromDate)
    BEGIN
        SELECT 400 AS StatusCode, N'Invalid action or date range.' AS Message;
        RETURN;
    END;

    DECLARE @StartUTC DATETIME2(0) =
        CASE WHEN @FromDate IS NOT NULL
             THEN DATEADD(MINUTE, -330, CONVERT(DATETIME2(0), @FromDate)) END;
    DECLARE @EndUTC DATETIME2(0) =
        CASE WHEN @ToDate IS NOT NULL
             THEN DATEADD(MINUTE, -330,
                  DATEADD(DAY, 1, CONVERT(DATETIME2(0), @ToDate))) END;

    IF @ActionType = 1
    BEGIN
        ;WITH Collections AS
        (
            SELECT p.PaymentDateTime, p.Amount, 'DAILY' AS PaymentType
            FROM dbo.PARKING_PAYMENT AS p
            WHERE p.PaymentStatus = 'COMPLETED'
              AND (@StartUTC IS NULL OR p.PaymentDateTime >= @StartUTC)
              AND (@EndUTC IS NULL OR p.PaymentDateTime < @EndUTC)
            UNION ALL
            SELECT mp.PaymentDateTime, mp.Amount, 'MONTHLY' AS PaymentType
            FROM dbo.PARKING_MONTHLY_PAYMENT AS mp
            WHERE mp.PaymentStatus = 'COMPLETED'
              AND (@StartUTC IS NULL OR mp.PaymentDateTime >= @StartUTC)
              AND (@EndUTC IS NULL OR mp.PaymentDateTime < @EndUTC)
        )
        SELECT CONVERT(DATE, DATEADD(MINUTE, 330, PaymentDateTime)) AS CollectionDate,
               SUM(CASE WHEN PaymentType = 'DAILY' THEN Amount ELSE 0 END) AS DailyAmount,
               SUM(CASE WHEN PaymentType = 'MONTHLY' THEN Amount ELSE 0 END) AS MonthlyAmount,
               SUM(Amount) AS TotalAmount,
               COUNT(*) AS PaymentCount
        FROM Collections
        GROUP BY CONVERT(DATE, DATEADD(MINUTE, 330, PaymentDateTime))
        ORDER BY CollectionDate DESC;
        RETURN;
    END;

    IF @ActionType = 2
    BEGIN
        SELECT t.TicketID, t.TicketNumber, v.VehicleNumber,
               vt.TypeName AS VehicleType, t.ParkingType, s.SpaceCode,
               t.EntryDateTime, t.ExitDateTime, t.TicketStatus,
               t.CalculatedAmount,
               p.Amount AS DailyPaidAmount,
               p.PaymentStatus AS DailyPaymentStatus
        FROM dbo.PARKING_TICKET AS t
        JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v ON v.VehicleID = t.VehicleID
        JOIN dbo.PARKING_VEHICLE_TYPE AS vt ON vt.VehicleTypeID = v.VehicleTypeID
        JOIN dbo.PARKING_SPACE AS s ON s.SpaceID = t.SpaceID
        LEFT JOIN dbo.PARKING_PAYMENT AS p ON p.TicketID = t.TicketID
        WHERE (@StartUTC IS NULL OR t.EntryDateTime >= @StartUTC)
          AND (@EndUTC IS NULL OR t.EntryDateTime < @EndUTC)
        ORDER BY t.EntryDateTime DESC, t.TicketID DESC;
        RETURN;
    END;

    /* Monthly contract dates are local business dates. A completed monthly
       payment covering today determines CurrentPeriodPaymentStatus. */
    DECLARE @Today DATE = CONVERT(DATE, DATEADD(MINUTE, 330, SYSUTCDATETIME()));
    SELECT mc.ContractID, mc.ContractNumber, c.CustomerID,
           c.CustomerName, c.MobileNumber,
           v.VehicleID, v.VehicleNumber, vt.TypeName AS VehicleType,
           mc.MonthlyFee, mc.StartDate, mc.EndDate,
           mc.ContractStatus,
           CASE WHEN mc.ContractStatus = 'CANCELLED' THEN 'CANCELLED'
                WHEN mc.EndDate < @Today THEN 'EXPIRED'
                WHEN mc.StartDate > @Today THEN 'UPCOMING'
                ELSE 'ACTIVE' END AS EffectiveContractStatus,
           CASE WHEN EXISTS
               (SELECT 1 FROM dbo.PARKING_MONTHLY_PAYMENT AS mp
                WHERE mp.ContractID = mc.ContractID
                  AND mp.PaymentStatus = 'COMPLETED'
                  AND mp.PeriodStartDate <= @Today
                  AND mp.PeriodEndDate >= @Today)
                THEN 'PAID' ELSE 'UNPAID' END AS CurrentPeriodPaymentStatus
    FROM dbo.PARKING_MONTHLY_CONTRACT AS mc
    JOIN dbo.PARKING_CUSTOMER AS c ON c.CustomerID = mc.CustomerID
    JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v ON v.VehicleID = mc.VehicleID
    JOIN dbo.PARKING_VEHICLE_TYPE AS vt ON vt.VehicleTypeID = v.VehicleTypeID
    WHERE (@FromDate IS NULL OR mc.EndDate >= @FromDate)
      AND (@ToDate IS NULL OR mc.StartDate <= @ToDate)
    ORDER BY mc.StartDate DESC, mc.ContractID DESC;
END;
GO