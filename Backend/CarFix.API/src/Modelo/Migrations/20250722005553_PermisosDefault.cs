using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Modelo.Migrations
{
    /// <inheritdoc />
    public partial class PermisosDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "GrupoPermisos",
                columns: new[] { "GruposId", "PermisosId" },
                values: new object[,]
                {
                    { 2, 1 },
                    { 2, 2 },
                    { 2, 3 },
                    { 2, 4 },
                    { 2, 9 },
                    { 2, 10 },
                    { 2, 11 },
                    { 2, 12 },
                    { 2, 13 },
                    { 2, 14 },
                    { 2, 15 },
                    { 2, 16 },
                    { 3, 13 },
                    { 3, 14 },
                    { 3, 15 },
                    { 3, 16 }
                });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Activo", "Email", "FechaCreacion", "NombreUsuario", "PasswordHash", "UltimoAcceso" },
                values: new object[,]
                {
                    { 2, true, "operador@carfix.com", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "operador", "KEtX1QmCkgYmnFP60J4nzZLp+ylHxQI5aVZCdA0SMkI=", null },
                    { 3, true, "tecnico@carfix.com", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "tecnico", "+SK/OKnavVUCb9ZIATUH3H3PUMKs4gJtaBdL+UMhEEE=", null }
                });

            migrationBuilder.InsertData(
                table: "UsuarioGrupos",
                columns: new[] { "GruposId", "UsuariosId" },
                values: new object[,]
                {
                    { 2, 2 },
                    { 3, 3 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 1 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 2 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 3 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 4 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 9 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 10 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 11 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 12 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 13 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 14 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 15 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 2, 16 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 3, 13 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 3, 14 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 3, 15 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 3, 16 });

            migrationBuilder.DeleteData(
                table: "UsuarioGrupos",
                keyColumns: new[] { "GruposId", "UsuariosId" },
                keyValues: new object[] { 2, 2 });

            migrationBuilder.DeleteData(
                table: "UsuarioGrupos",
                keyColumns: new[] { "GruposId", "UsuariosId" },
                keyValues: new object[] { 3, 3 });

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
