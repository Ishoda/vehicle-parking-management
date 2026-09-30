USE [VehicleParkingManagementDB];
GO

/* Receipt reprint lookup;
   Action 1: receipt number (daily or monthly).
   Action 2: daily PaymentID.
   Action 3: monthly MonthlyPaymentID.
   Parking/company name and thank-you message come from app settings.
   Backend must authorize the caller. */

CREATE PROCEDURE dbo.PARKING_SP_Receipt_Lookup
    @ActionType INT,
    @ReceiptNumber VARCHAR(40) = NULL,
    @PaymentID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @ReceiptNumber = NULLIF(LTRIM(RTRIM(@ReceiptNumber)), '');
    IF @ActionType NOT IN (1, 2, 3)
       OR (@ActionType = 1 AND @ReceiptNumber IS NULL)
       OR (@ActionType IN (2, 3) AND @PaymentID IS NULL)
    BEGIN
        SELECT 400 AS StatusCode, N'Valid action and receipt/payment identifier required.' AS Message;
        RETURN;
    END;

    SELECT 'DAILY' AS PaymentType, p.PaymentID, p.PaymentNumber,
           p.ReceiptNumber, p.Amount, p.PaymentMethod,
           p.PaymentStatus, p.PaymentDateTime, p.ReceivedByUserID,
           v.VehicleNumber, c.CustomerName, t.TicketNumber,
           t.EntryDateTime, t.ExitDateTime,
           CAST(NULL AS DATE) AS PeriodStartDate,
           CAST(NULL AS DATE) AS PeriodEndDate,
           t.AppliedHourlyRate, t.AppliedDailyRate
    FROM dbo.PARKING_PAYMENT AS p
    JOIN dbo.PARKING_TICKET AS t ON t.TicketID = p.TicketID
    JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v ON v.VehicleID = t.VehicleID
    LEFT JOIN dbo.PARKING_CUSTOMER AS c ON c.CustomerID = v.CustomerID
    WHERE (@ActionType = 1 AND p.ReceiptNumber = @ReceiptNumber)
       OR (@ActionType = 2 AND p.PaymentID = @PaymentID)

    UNION ALL

    SELECT 'MONTHLY' AS PaymentType, mp.MonthlyPaymentID AS PaymentID,
           mp.PaymentNumber, mp.ReceiptNumber, mp.Amount, mp.PaymentMethod,
           mp.PaymentStatus, mp.PaymentDateTime, mp.ReceivedByUserID,
           v.VehicleNumber, c.CustomerName,
           CAST(NULL AS VARCHAR(40)) AS TicketNumber,
           CAST(NULL AS DATETIME2(0)) AS EntryDateTime,
           CAST(NULL AS DATETIME2(0)) AS ExitDateTime,
           mp.PeriodStartDate, mp.PeriodEndDate,
           CAST(NULL AS DECIMAL(12,2)) AS AppliedHourlyRate,
           CAST(NULL AS DECIMAL(12,2)) AS AppliedDailyRate
    FROM dbo.PARKING_MONTHLY_PAYMENT AS mp
    JOIN dbo.PARKING_MONTHLY_CONTRACT AS mc ON mc.ContractID = mp.ContractID
    JOIN dbo.PARKING_CUSTOMER AS c ON c.CustomerID = mc.CustomerID
    JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v ON v.VehicleID = mc.VehicleID
    WHERE (@ActionType = 1 AND mp.ReceiptNumber = @ReceiptNumber)
       OR (@ActionType = 3 AND mp.MonthlyPaymentID = @PaymentID);
END;
GO
