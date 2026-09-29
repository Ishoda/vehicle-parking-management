namespace VehicleParking.Models
{
    public class DailyEntryResponse
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;

        public int? TicketID { get; set; }
        public string? TicketNumber { get; set; }
        public int? VehicleID { get; set; }
        public string? VehicleNumber { get; set; }
        public int? SpaceID { get; set; }
        public DateTime? EntryDateTime { get; set; }

        public int? HourlyRateID { get; set; }
        public int? DailyRateID { get; set; }
        public decimal? AppliedHourlyRate { get; set; }
        public decimal? AppliedDailyRate { get; set; }
    }
}
