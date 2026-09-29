using VehicleParking.Models;

namespace VehicleParking.Interfaces
{
    public interface IVehicleEntry
    {
        Task<DailyEntryResponse> CreateDailyEntryAsync(DailyEntryRequest request);
    }
}
