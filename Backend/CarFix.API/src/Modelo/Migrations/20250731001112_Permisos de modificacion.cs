using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Modelo.Migrations
{
    /// <inheritdoc />
    public partial class Permisosdemodificacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Permisos",
                columns: new[] { "Id", "Descripcion", "Modulo", "Nombre" },
                values: new object[,]
                {
                    { 28, "Modificar cliente en tickets", "Tickets", "TICKETS_MODIFICAR_CLIENTE" },
                    { 29, "Modificar vehículo en tickets", "Tickets", "TICKETS_MODIFICAR_VEHICULO" }
                });

            migrationBuilder.InsertData(
                table: "GrupoPermisos",
                columns: new[] { "GruposId", "PermisosId" },
                values: new object[,]
                {
                    { 1, 28 },
                    { 1, 29 },
                    { 2, 28 },
                    { 2, 29 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 28 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 29 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 28 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 29 });

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 29);
        }
    }
}
