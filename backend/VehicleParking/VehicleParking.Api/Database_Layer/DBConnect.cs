using Microsoft.Data.SqlClient;

namespace VehicleParking.Data

{
    public class DBConnect
    {
        private readonly IConfiguration _configuration;

        public DBConnect(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<SqlConnection> GetOpenConnectionAsync()
        {
            string connectionString =
                _configuration.GetConnectionString("ParkingDb")
                ?? throw new InvalidOperationException(
                    "Connection string 'ParkingDb' is missing.");

            var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            return connection;
        }
    }
}
