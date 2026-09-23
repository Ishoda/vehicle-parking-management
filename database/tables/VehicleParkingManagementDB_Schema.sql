/*
    Vehicle Parking Management System - Initial SQL Server Schema
    Database: VehicleParkingManagementDB

    Creates the ten tables specified in the SRS:
      PARKING_USER
      PARKING_VEHICLE_TYPE
      PARKING_SPACE
      PARKING_RATE
      PARKING_CUSTOMER
      PARKING_CUSTOMER_VEHICLE
      PARKING_MONTHLY_CONTRACT
      PARKING_TICKET
      PARKING_PAYMENT
      PARKING_MONTHLY_PAYMENT

    Notes:
      - Execute this script against an empty VehicleParkingManagementDB.
      - CreatedBy and UpdatedBy are nullable so initial/system records can be seeded.
      - No hard-delete cascade is used; historical parking and payment data is preserved.
*/

USE [VehicleParkingManagementDB];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    /* Stop rather than partially mixing this schema with existing tables. */
    IF OBJECT_ID(N'dbo.PARKING_USER', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_VEHICLE_TYPE', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_SPACE', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_RATE', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_CUSTOMER', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_CUSTOMER_VEHICLE', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_MONTHLY_CONTRACT', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_TICKET', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_PAYMENT', N'U') IS NOT NULL
       OR OBJECT_ID(N'dbo.PARKING_MONTHLY_PAYMENT', N'U') IS NOT NULL
    BEGIN
        THROW 50001, 'One or more PARKING_ tables already exist. Run this script only against the intended empty schema.', 1;
    END;

    /* ================================================================
       1. USERS
       UserRole: A = Admin/Owner, O = Parking Operator
       ================================================================ */
    CREATE TABLE dbo.PARKING_USER
    (
        UserID              INT IDENTITY(1,1) NOT NULL,
        FirstName           NVARCHAR(100) NOT NULL,
        LastName            NVARCHAR(100) NOT NULL,
        FullName            AS LTRIM(RTRIM(CONCAT(FirstName, N' ', LastName))),
        Username            NVARCHAR(100) NOT NULL,
        PasswordHash        NVARCHAR(500) NOT NULL,
        UserRole            CHAR(1) NOT NULL,
        ActiveStatus        BIT NOT NULL CONSTRAINT DF_PARKING_USER_ActiveStatus DEFAULT (1),

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_USER_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_USER PRIMARY KEY (UserID),
        CONSTRAINT UQ_PARKING_USER_Username UNIQUE (Username),
        CONSTRAINT CK_PARKING_USER_UserRole CHECK (UserRole IN ('A', 'O')),
        CONSTRAINT CK_PARKING_USER_Name CHECK
        (
            LEN(LTRIM(RTRIM(FirstName))) > 0
            AND LEN(LTRIM(RTRIM(LastName))) > 0
        )
    );

    /* ================================================================
       2. VEHICLE TYPES
       Examples: Car, Van, Motorcycle
       ================================================================ */
    CREATE TABLE dbo.PARKING_VEHICLE_TYPE
    (
        VehicleTypeID       INT IDENTITY(1,1) NOT NULL,
        TypeName            NVARCHAR(100) NOT NULL,
        Description         NVARCHAR(500) NULL,
        ActiveStatus        BIT NOT NULL CONSTRAINT DF_PARKING_VEHICLE_TYPE_ActiveStatus DEFAULT (1),

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_VEHICLE_TYPE_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_VEHICLE_TYPE PRIMARY KEY (VehicleTypeID),
        CONSTRAINT UQ_PARKING_VEHICLE_TYPE_TypeName UNIQUE (TypeName),
        CONSTRAINT CK_PARKING_VEHICLE_TYPE_TypeName CHECK (LEN(LTRIM(RTRIM(TypeName))) > 0)
    );

    /* ================================================================
       3. PARKING SPACES
       Each space is restricted to one vehicle type.
       SpaceStatus: AVAILABLE, OCCUPIED, BLOCKED
       ================================================================ */
    CREATE TABLE dbo.PARKING_SPACE
    (
        SpaceID             INT IDENTITY(1,1) NOT NULL,
        VehicleTypeID       INT NOT NULL,
        SpaceCode           VARCHAR(30) NOT NULL,
        SpaceName           NVARCHAR(100) NULL,
        SpaceStatus         VARCHAR(20) NOT NULL CONSTRAINT DF_PARKING_SPACE_SpaceStatus DEFAULT ('AVAILABLE'),
        ActiveStatus        BIT NOT NULL CONSTRAINT DF_PARKING_SPACE_ActiveStatus DEFAULT (1),

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_SPACE_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_SPACE PRIMARY KEY (SpaceID),
        CONSTRAINT UQ_PARKING_SPACE_SpaceCode UNIQUE (SpaceCode),
        CONSTRAINT FK_PARKING_SPACE_VehicleType FOREIGN KEY (VehicleTypeID)
            REFERENCES dbo.PARKING_VEHICLE_TYPE (VehicleTypeID),
        CONSTRAINT CK_PARKING_SPACE_SpaceCode CHECK (LEN(LTRIM(RTRIM(SpaceCode))) > 0),
        CONSTRAINT CK_PARKING_SPACE_SpaceStatus CHECK
            (SpaceStatus IN ('AVAILABLE', 'OCCUPIED', 'BLOCKED'))
    );

    /* ================================================================
       4. HOURLY PARKING RATES
       EffectiveTo is NULL for an open-ended rate period.
       ================================================================ */
    CREATE TABLE dbo.PARKING_RATE
    (
        RateID              INT IDENTITY(1,1) NOT NULL,
        VehicleTypeID       INT NOT NULL,
        RateName            NVARCHAR(100) NOT NULL,
        RateAmount          DECIMAL(12,2) NOT NULL,
        RateUnit            VARCHAR(20) NOT NULL CONSTRAINT DF_PARKING_RATE_RateUnit DEFAULT ('HOURLY'),
        EffectiveFrom       DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_RATE_EffectiveFrom DEFAULT (SYSUTCDATETIME()),
        EffectiveTo         DATETIME2(0) NULL,
        ActiveStatus        BIT NOT NULL CONSTRAINT DF_PARKING_RATE_ActiveStatus DEFAULT (1),

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_RATE_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_RATE PRIMARY KEY (RateID),
        CONSTRAINT FK_PARKING_RATE_VehicleType FOREIGN KEY (VehicleTypeID)
            REFERENCES dbo.PARKING_VEHICLE_TYPE (VehicleTypeID),
        CONSTRAINT CK_PARKING_RATE_Amount CHECK (RateAmount >= 0),
        CONSTRAINT CK_PARKING_RATE_Unit CHECK (RateUnit = 'HOURLY'),
        CONSTRAINT CK_PARKING_RATE_EffectivePeriod CHECK
            (EffectiveTo IS NULL OR EffectiveTo > EffectiveFrom)
    );

    /* ================================================================
       5. CUSTOMERS
       A customer is mandatory for monthly parking but optional for a
       casual daily vehicle.
       ================================================================ */
    CREATE TABLE dbo.PARKING_CUSTOMER
    (
        CustomerID          INT IDENTITY(1,1) NOT NULL,
        CustomerName        NVARCHAR(200) NOT NULL,
        MobileNumber        VARCHAR(20) NOT NULL,
        EmailAddress        NVARCHAR(254) NULL,
        Address             NVARCHAR(500) NULL,
        RegisteredDate      DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_CUSTOMER_RegisteredDate DEFAULT (SYSUTCDATETIME()),
        ActiveStatus        BIT NOT NULL CONSTRAINT DF_PARKING_CUSTOMER_ActiveStatus DEFAULT (1),

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_CUSTOMER_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_CUSTOMER PRIMARY KEY (CustomerID),
        CONSTRAINT CK_PARKING_CUSTOMER_Name CHECK (LEN(LTRIM(RTRIM(CustomerName))) > 0),
        CONSTRAINT CK_PARKING_CUSTOMER_Mobile CHECK (LEN(LTRIM(RTRIM(MobileNumber))) BETWEEN 7 AND 20)
    );

    /* ================================================================
       6. CUSTOMER VEHICLES
       CustomerID is nullable because customer details are optional for
       casual daily parking. It is required by business logic for monthly
       contracts.
       ================================================================ */
    CREATE TABLE dbo.PARKING_CUSTOMER_VEHICLE
    (
        VehicleID           INT IDENTITY(1,1) NOT NULL,
        CustomerID          INT NULL,
        VehicleTypeID       INT NOT NULL,
        VehicleNumber       VARCHAR(30) NOT NULL,
        VehicleMake         NVARCHAR(100) NULL,
        VehicleModel        NVARCHAR(100) NULL,
        VehicleColour       NVARCHAR(50) NULL,
        ActiveStatus        BIT NOT NULL CONSTRAINT DF_PARKING_CUSTOMER_VEHICLE_ActiveStatus DEFAULT (1),

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_CUSTOMER_VEHICLE_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_CUSTOMER_VEHICLE PRIMARY KEY (VehicleID),
        CONSTRAINT UQ_PARKING_CUSTOMER_VEHICLE_VehicleNumber UNIQUE (VehicleNumber),
        CONSTRAINT FK_PARKING_CUSTOMER_VEHICLE_Customer FOREIGN KEY (CustomerID)
            REFERENCES dbo.PARKING_CUSTOMER (CustomerID),
        CONSTRAINT FK_PARKING_CUSTOMER_VEHICLE_VehicleType FOREIGN KEY (VehicleTypeID)
            REFERENCES dbo.PARKING_VEHICLE_TYPE (VehicleTypeID),
        CONSTRAINT CK_PARKING_CUSTOMER_VEHICLE_Number CHECK
            (LEN(LTRIM(RTRIM(VehicleNumber))) > 0)
    );

    /* ================================================================
       7. MONTHLY CONTRACTS
       ContractStatus: ACTIVE, EXPIRED, CANCELLED
       ================================================================ */
    CREATE TABLE dbo.PARKING_MONTHLY_CONTRACT
    (
        ContractID          INT IDENTITY(1,1) NOT NULL,
        ContractNumber      VARCHAR(40) NOT NULL,
        CustomerID          INT NOT NULL,
        VehicleID           INT NOT NULL,
        MonthlyFee          DECIMAL(12,2) NOT NULL,
        StartDate           DATE NOT NULL,
        EndDate             DATE NOT NULL,
        ContractStatus      VARCHAR(20) NOT NULL CONSTRAINT DF_PARKING_MONTHLY_CONTRACT_Status DEFAULT ('ACTIVE'),
        CancelledAt         DATETIME2(0) NULL,
        CancellationReason NVARCHAR(500) NULL,

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_MONTHLY_CONTRACT_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_MONTHLY_CONTRACT PRIMARY KEY (ContractID),
        CONSTRAINT UQ_PARKING_MONTHLY_CONTRACT_Number UNIQUE (ContractNumber),
        CONSTRAINT FK_PARKING_MONTHLY_CONTRACT_Customer FOREIGN KEY (CustomerID)
            REFERENCES dbo.PARKING_CUSTOMER (CustomerID),
        CONSTRAINT FK_PARKING_MONTHLY_CONTRACT_Vehicle FOREIGN KEY (VehicleID)
            REFERENCES dbo.PARKING_CUSTOMER_VEHICLE (VehicleID),
        CONSTRAINT CK_PARKING_MONTHLY_CONTRACT_Fee CHECK (MonthlyFee >= 0),
        CONSTRAINT CK_PARKING_MONTHLY_CONTRACT_Dates CHECK (EndDate >= StartDate),
        CONSTRAINT CK_PARKING_MONTHLY_CONTRACT_Status CHECK
            (ContractStatus IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
        CONSTRAINT CK_PARKING_MONTHLY_CONTRACT_Cancellation CHECK
        (
            (ContractStatus <> 'CANCELLED' AND CancelledAt IS NULL)
            OR
            (ContractStatus = 'CANCELLED' AND CancelledAt IS NOT NULL)
        )
    );

    /* ================================================================
       8. PARKING TICKETS
       ParkingType: DAILY or MONTHLY
       Daily:   RateID and AppliedRate are required.
       Monthly: MonthlyContractID is required; daily RateID is not used.
       BillableHours is stored as DECIMAL so the final rounding policy can
       be confirmed without changing the schema.
       ================================================================ */
    CREATE TABLE dbo.PARKING_TICKET
    (
        TicketID            INT IDENTITY(1,1) NOT NULL,
        TicketNumber        VARCHAR(40) NOT NULL,
        VehicleID           INT NOT NULL,
        SpaceID             INT NOT NULL,
        RateID              INT NULL,
        MonthlyContractID   INT NULL,
        ParkingType         VARCHAR(20) NOT NULL,
        EntryDateTime       DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_TICKET_EntryDateTime DEFAULT (SYSUTCDATETIME()),
        ExitDateTime        DATETIME2(0) NULL,
        AppliedRate         DECIMAL(12,2) NULL,
        BillableHours       DECIMAL(10,2) NULL,
        CalculatedAmount    DECIMAL(12,2) NULL,
        TicketStatus        VARCHAR(30) NOT NULL CONSTRAINT DF_PARKING_TICKET_Status DEFAULT ('OPEN'),
        EntryOperatorID     INT NOT NULL,
        ExitOperatorID      INT NULL,

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_TICKET_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_TICKET PRIMARY KEY (TicketID),
        CONSTRAINT UQ_PARKING_TICKET_Number UNIQUE (TicketNumber),
        CONSTRAINT FK_PARKING_TICKET_Vehicle FOREIGN KEY (VehicleID)
            REFERENCES dbo.PARKING_CUSTOMER_VEHICLE (VehicleID),
        CONSTRAINT FK_PARKING_TICKET_Space FOREIGN KEY (SpaceID)
            REFERENCES dbo.PARKING_SPACE (SpaceID),
        CONSTRAINT FK_PARKING_TICKET_Rate FOREIGN KEY (RateID)
            REFERENCES dbo.PARKING_RATE (RateID),
        CONSTRAINT FK_PARKING_TICKET_MonthlyContract FOREIGN KEY (MonthlyContractID)
            REFERENCES dbo.PARKING_MONTHLY_CONTRACT (ContractID),
        CONSTRAINT FK_PARKING_TICKET_EntryOperator FOREIGN KEY (EntryOperatorID)
            REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_TICKET_ExitOperator FOREIGN KEY (ExitOperatorID)
            REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT CK_PARKING_TICKET_Type CHECK (ParkingType IN ('DAILY', 'MONTHLY')),
        CONSTRAINT CK_PARKING_TICKET_Status CHECK
            (TicketStatus IN ('OPEN', 'PAYMENT_PENDING', 'CLOSED', 'CANCELLED')),
        CONSTRAINT CK_PARKING_TICKET_ExitTime CHECK
            (ExitDateTime IS NULL OR ExitDateTime >= EntryDateTime),
        CONSTRAINT CK_PARKING_TICKET_ExitOperator CHECK
        (
            (ExitDateTime IS NULL AND ExitOperatorID IS NULL)
            OR
            (ExitDateTime IS NOT NULL AND ExitOperatorID IS NOT NULL)
        ),
        CONSTRAINT CK_PARKING_TICKET_BillableHours CHECK
            (BillableHours IS NULL OR BillableHours >= 0),
        CONSTRAINT CK_PARKING_TICKET_Amount CHECK
            (CalculatedAmount IS NULL OR CalculatedAmount >= 0),
        CONSTRAINT CK_PARKING_TICKET_RateAmount CHECK
            (AppliedRate IS NULL OR AppliedRate >= 0),
        CONSTRAINT CK_PARKING_TICKET_DailyOrMonthly CHECK
        (
            (
                ParkingType = 'DAILY'
                AND RateID IS NOT NULL
                AND MonthlyContractID IS NULL
                AND AppliedRate IS NOT NULL
            )
            OR
            (
                ParkingType = 'MONTHLY'
                AND RateID IS NULL
                AND MonthlyContractID IS NOT NULL
            )
        )
    );

    /* ================================================================
       9. DAILY PARKING PAYMENTS
       A unique TicketID enforces at most one final payment per ticket.
       PaymentMethod: CASH or CARD
       ================================================================ */
    CREATE TABLE dbo.PARKING_PAYMENT
    (
        PaymentID           INT IDENTITY(1,1) NOT NULL,
        PaymentNumber       VARCHAR(40) NOT NULL,
        TicketID            INT NOT NULL,
        Amount              DECIMAL(12,2) NOT NULL,
        PaymentMethod       VARCHAR(20) NOT NULL,
        PaymentStatus       VARCHAR(20) NOT NULL CONSTRAINT DF_PARKING_PAYMENT_Status DEFAULT ('COMPLETED'),
        PaymentDateTime     DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_PAYMENT_DateTime DEFAULT (SYSUTCDATETIME()),
        ReceivedByUserID    INT NOT NULL,
        ReceiptNumber       VARCHAR(40) NOT NULL,
        Remarks             NVARCHAR(500) NULL,

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_PAYMENT_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_PAYMENT PRIMARY KEY (PaymentID),
        CONSTRAINT UQ_PARKING_PAYMENT_Number UNIQUE (PaymentNumber),
        CONSTRAINT UQ_PARKING_PAYMENT_Receipt UNIQUE (ReceiptNumber),
        CONSTRAINT UQ_PARKING_PAYMENT_Ticket UNIQUE (TicketID),
        CONSTRAINT FK_PARKING_PAYMENT_Ticket FOREIGN KEY (TicketID)
            REFERENCES dbo.PARKING_TICKET (TicketID),
        CONSTRAINT FK_PARKING_PAYMENT_ReceivedBy FOREIGN KEY (ReceivedByUserID)
            REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT CK_PARKING_PAYMENT_Amount CHECK (Amount >= 0),
        CONSTRAINT CK_PARKING_PAYMENT_Method CHECK
            (PaymentMethod IN ('CASH', 'CARD')),
        CONSTRAINT CK_PARKING_PAYMENT_Status CHECK
            (PaymentStatus IN ('COMPLETED', 'CANCELLED', 'REFUNDED'))
    );

    /* ================================================================
       10. MONTHLY PAYMENTS
       A contract can have many non-overlapping payment periods.
       ================================================================ */
    CREATE TABLE dbo.PARKING_MONTHLY_PAYMENT
    (
        MonthlyPaymentID    INT IDENTITY(1,1) NOT NULL,
        PaymentNumber       VARCHAR(40) NOT NULL,
        ContractID          INT NOT NULL,
        PeriodStartDate     DATE NOT NULL,
        PeriodEndDate       DATE NOT NULL,
        Amount              DECIMAL(12,2) NOT NULL,
        PaymentMethod       VARCHAR(20) NOT NULL,
        PaymentStatus       VARCHAR(20) NOT NULL CONSTRAINT DF_PARKING_MONTHLY_PAYMENT_Status DEFAULT ('COMPLETED'),
        PaymentDateTime     DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_MONTHLY_PAYMENT_DateTime DEFAULT (SYSUTCDATETIME()),
        ReceivedByUserID    INT NOT NULL,
        ReceiptNumber       VARCHAR(40) NOT NULL,
        Remarks             NVARCHAR(500) NULL,

        CreatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_PARKING_MONTHLY_PAYMENT_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           INT NULL,
        UpdatedAt           DATETIME2(0) NULL,
        UpdatedBy           INT NULL,

        CONSTRAINT PK_PARKING_MONTHLY_PAYMENT PRIMARY KEY (MonthlyPaymentID),
        CONSTRAINT UQ_PARKING_MONTHLY_PAYMENT_Number UNIQUE (PaymentNumber),
        CONSTRAINT UQ_PARKING_MONTHLY_PAYMENT_Receipt UNIQUE (ReceiptNumber),
        CONSTRAINT UQ_PARKING_MONTHLY_PAYMENT_ContractPeriod
            UNIQUE (ContractID, PeriodStartDate, PeriodEndDate),
        CONSTRAINT FK_PARKING_MONTHLY_PAYMENT_Contract FOREIGN KEY (ContractID)
            REFERENCES dbo.PARKING_MONTHLY_CONTRACT (ContractID),
        CONSTRAINT FK_PARKING_MONTHLY_PAYMENT_ReceivedBy FOREIGN KEY (ReceivedByUserID)
            REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT CK_PARKING_MONTHLY_PAYMENT_Period CHECK
            (PeriodEndDate >= PeriodStartDate),
        CONSTRAINT CK_PARKING_MONTHLY_PAYMENT_Amount CHECK (Amount >= 0),
        CONSTRAINT CK_PARKING_MONTHLY_PAYMENT_Method CHECK
            (PaymentMethod IN ('CASH', 'CARD')),
        CONSTRAINT CK_PARKING_MONTHLY_PAYMENT_Status CHECK
            (PaymentStatus IN ('COMPLETED', 'CANCELLED', 'REFUNDED'))
    );

    /* ================================================================
       AUDIT USER FOREIGN KEYS
       These are added after all tables exist. They deliberately use no
       cascading deletes so audit history cannot be removed accidentally.
       ================================================================ */
    ALTER TABLE dbo.PARKING_USER ADD
        CONSTRAINT FK_PARKING_USER_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_USER_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_VEHICLE_TYPE ADD
        CONSTRAINT FK_PARKING_VEHICLE_TYPE_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_VEHICLE_TYPE_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_SPACE ADD
        CONSTRAINT FK_PARKING_SPACE_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_SPACE_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_RATE ADD
        CONSTRAINT FK_PARKING_RATE_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_RATE_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_CUSTOMER ADD
        CONSTRAINT FK_PARKING_CUSTOMER_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_CUSTOMER_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_CUSTOMER_VEHICLE ADD
        CONSTRAINT FK_PARKING_CUSTOMER_VEHICLE_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_CUSTOMER_VEHICLE_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_MONTHLY_CONTRACT ADD
        CONSTRAINT FK_PARKING_MONTHLY_CONTRACT_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_MONTHLY_CONTRACT_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_TICKET ADD
        CONSTRAINT FK_PARKING_TICKET_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_TICKET_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_PAYMENT ADD
        CONSTRAINT FK_PARKING_PAYMENT_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_PAYMENT_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    ALTER TABLE dbo.PARKING_MONTHLY_PAYMENT ADD
        CONSTRAINT FK_PARKING_MONTHLY_PAYMENT_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.PARKING_USER (UserID),
        CONSTRAINT FK_PARKING_MONTHLY_PAYMENT_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.PARKING_USER (UserID);

    /* ================================================================
       PERFORMANCE AND BUSINESS-RULE INDEXES
       ================================================================ */
    CREATE INDEX IX_PARKING_SPACE_TypeStatus
        ON dbo.PARKING_SPACE (VehicleTypeID, SpaceStatus, ActiveStatus);

    CREATE INDEX IX_PARKING_RATE_CurrentRate
        ON dbo.PARKING_RATE (VehicleTypeID, ActiveStatus, EffectiveFrom, EffectiveTo);

    CREATE INDEX IX_PARKING_CUSTOMER_Search
        ON dbo.PARKING_CUSTOMER (MobileNumber, CustomerName);

    CREATE INDEX IX_PARKING_CUSTOMER_VEHICLE_Customer
        ON dbo.PARKING_CUSTOMER_VEHICLE (CustomerID, ActiveStatus);

    CREATE INDEX IX_PARKING_CUSTOMER_VEHICLE_Type
        ON dbo.PARKING_CUSTOMER_VEHICLE (VehicleTypeID, ActiveStatus);

    CREATE INDEX IX_PARKING_MONTHLY_CONTRACT_Search
        ON dbo.PARKING_MONTHLY_CONTRACT (VehicleID, ContractStatus, StartDate, EndDate);

    /* Only one ACTIVE monthly contract can exist for a vehicle. */
    CREATE UNIQUE INDEX UX_PARKING_MONTHLY_CONTRACT_ActiveVehicle
        ON dbo.PARKING_MONTHLY_CONTRACT (VehicleID)
        WHERE ContractStatus = 'ACTIVE';

    CREATE INDEX IX_PARKING_TICKET_CurrentParking
        ON dbo.PARKING_TICKET (TicketStatus, EntryDateTime);

    /* A vehicle and a space may each appear in only one open visit.
       ExitDateTime must be populated when a visit is completed/cancelled. */
    CREATE UNIQUE INDEX UX_PARKING_TICKET_OpenVehicle
        ON dbo.PARKING_TICKET (VehicleID)
        WHERE ExitDateTime IS NULL;

    CREATE UNIQUE INDEX UX_PARKING_TICKET_OpenSpace
        ON dbo.PARKING_TICKET (SpaceID)
        WHERE ExitDateTime IS NULL;

    CREATE INDEX IX_PARKING_PAYMENT_Date
        ON dbo.PARKING_PAYMENT (PaymentDateTime, PaymentStatus);

    CREATE INDEX IX_PARKING_MONTHLY_PAYMENT_Date
        ON dbo.PARKING_MONTHLY_PAYMENT (PaymentDateTime, PaymentStatus);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

/* Verification: expected result is 10 tables. */
SELECT
    s.name AS SchemaName,
    t.name AS TableName
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE t.name IN
(
    'PARKING_USER',
    'PARKING_VEHICLE_TYPE',
    'PARKING_SPACE',
    'PARKING_RATE',
    'PARKING_CUSTOMER',
    'PARKING_CUSTOMER_VEHICLE',
    'PARKING_MONTHLY_CONTRACT',
    'PARKING_TICKET',
    'PARKING_PAYMENT',
    'PARKING_MONTHLY_PAYMENT'
)
ORDER BY t.name;
GO

/* Verification: expected result is 40 audit columns (4 x 10 tables). */
SELECT
    t.name AS TableName,
    c.name AS AuditColumn
FROM sys.tables AS t
INNER JOIN sys.columns AS c
    ON c.object_id = t.object_id
WHERE t.name LIKE 'PARKING[_]%'
  AND c.name IN ('CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy')
ORDER BY t.name, c.column_id;
GO
