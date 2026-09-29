using System.ComponentModel.DataAnnotations;

namespace VehicleParking.Models
{
    public class DailyEntryRequest
    {
        [Required]
        [MaxLength(30)]
        public string VehicleNumber { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int VehicleTypeID { get; set; }

        public int? SpaceID { get; set; }

        // Temporary until your partner connects login/authentication.
        [Range(1, int.MaxValue)]
        public int OperatorUserID { get; set; }
    }
}
