using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Modelo.Migrations
{
    /// <inheritdoc />
    public partial class test2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Vehiculos",
                columns: new[] { "Id", "Año", "ClienteId", "Dominio", "Marca", "Modelo" },
                values: new object[,]
                {
                    { 1, 2020, 1, "ABC123D", "Ford", "Fiesta" },
                    { 2, 2018, 2, "XYZ789W", "Chevrolet", "Cruze" },
                    { 3, 2022, 3, "LMN456K", "Toyota", "Corolla" }
                });

            migrationBuilder.InsertData(
                table: "Tickets",
                columns: new[] { "Id", "ClienteId", "Descripcion", "Estado", "FechaCreacion", "TecnicoId", "VehiculoId" },
                values: new object[,]
                {
                    { 1, 1, "Cambio de aceite y filtro", 0, new DateTime(2023, 2, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, 1 },
                    { 2, 2, "Reparación de parabrisas", 0, new DateTime(2023, 2, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, 2 },
                    { 3, 3, "Falla en instrumental", 0, new DateTime(2023, 2, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), 2, 3 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Tickets",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Tickets",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Tickets",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Vehiculos",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Vehiculos",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Vehiculos",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
