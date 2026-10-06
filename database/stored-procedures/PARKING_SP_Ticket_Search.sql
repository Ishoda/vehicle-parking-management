 USE [VehicleParkingManagementDB];
GO
 
 /* current parking / exit lookup.    
 Action 1: list all currently parked vehicles.    
 Action 2: search current parking by ticket number, vehicle number,              
 customer name or mobile number.    
 Action 3: get one currently open ticket by TicketID.    
 The backend must authorize the caller for these operations. */  
 
 CREATE OR ALTER PROCEDURE dbo.PARKING_SP_Ticket_Search     
 @ActionType INT,     
 @SearchTerm NVARCHAR(200) = NULL,     
 @TicketID INT = NULL AS BEGIN     
 
 SET NOCOUNT ON;     
 SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), N'');      
 
 IF @ActionType NOT IN (1, 2, 3)     
 BEGIN         
 SELECT 400 AS StatusCode, N'Invalid ActionType.' AS Message;         
 RETURN;     
 END;     
 
 IF @ActionType = 2 AND @SearchTerm IS NULL     
 BEGIN         
 SELECT 400 AS StatusCode, N'Search term is required.' AS Message;         
 RETURN;     
 END;     
 
 IF @ActionType = 3 AND @TicketID IS NULL     
 BEGIN         
 SELECT 400 AS StatusCode, N'TicketID is required.' AS Message;         
 RETURN;     
 END;      
 
 SELECT t.TicketID, t.TicketNumber, t.ParkingType, t.TicketStatus,            
 t.EntryDateTime, t.SpaceID, s.SpaceCode,            
 v.VehicleID, v.VehicleNumber, v.VehicleTypeID, vt.TypeName AS VehicleType,            
 c.CustomerID, c.CustomerName, c.MobileNumber,            
 t.MonthlyContractID,            
 t.HourlyRateID, t.DailyRateID,            
 t.AppliedHourlyRate, t.AppliedDailyRate,            
 t.EntryOperatorID     
 FROM dbo.PARKING_TICKET AS t     
 JOIN dbo.PARKING_CUSTOMER_VEHICLE AS v ON v.VehicleID = t.VehicleID     
 JOIN dbo.PARKING_VEHICLE_TYPE AS vt ON vt.VehicleTypeID = v.VehicleTypeID     
 JOIN dbo.PARKING_SPACE AS s ON s.SpaceID = t.SpaceID     
 LEFT JOIN dbo.PARKING_CUSTOMER AS c ON c.CustomerID = v.CustomerID    
 WHERE t.ExitDateTime IS NULL AND t.TicketStatus = 'OPEN'       
 AND       (         
 @ActionType = 1  OR 
 (@ActionType = 3 AND t.TicketID = @TicketID)         
 OR (@ActionType = 2 AND             
 (                 
 t.TicketNumber = @SearchTerm                 
 OR v.VehicleNumber = @SearchTerm                 
 OR c.CustomerName LIKE N'%' + @SearchTerm + N'%'                 
 OR c.MobileNumber LIKE N'%' + @SearchTerm + N'%'             
 ))       
 )     
 ORDER BY t.EntryDateTime DESC, t.TicketID DESC; END; 

 GO