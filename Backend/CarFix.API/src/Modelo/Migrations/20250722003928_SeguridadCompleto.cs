using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Modelo.Migrations
{
    /// <inheritdoc />
    public partial class SeguridadCompleto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Grupos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Grupos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Permisos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Modulo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permisos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreUsuario = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UltimoAcceso = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GrupoPermisos",
                columns: table => new
                {
                    GruposId = table.Column<int>(type: "int", nullable: false),
                    PermisosId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrupoPermisos", x => new { x.GruposId, x.PermisosId });
                    table.ForeignKey(
                        name: "FK_GrupoPermisos_Grupos_GruposId",
                        column: x => x.GruposId,
                        principalTable: "Grupos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GrupoPermisos_Permisos_PermisosId",
                        column: x => x.PermisosId,
                        principalTable: "Permisos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditoriasLogin",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    NombreUsuario = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaHora = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TipoEvento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DireccionIP = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriasLogin", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditoriasLogin_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioGrupos",
                columns: table => new
                {
                    UsuariosId = table.Column<int>(type: "int", nullable: false),
                    GruposId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioGrupos", x => new { x.UsuariosId, x.GruposId });
                    table.ForeignKey(
                        name: "FK_UsuarioGrupos_Grupos_GruposId",
                        column: x => x.GruposId,
                        principalTable: "Grupos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioGrupos_Usuarios_UsuariosId",
                        column: x => x.UsuariosId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Grupos",
                columns: new[] { "Id", "Descripcion", "Nombre" },
                values: new object[,]
                {
                    { 1, "Acceso total al sistema", "Administradores" },
                    { 2, "Acceso limitado para operaciones diarias", "Operadores" },
                    { 3, "Acceso para tecnicos del taller", "Tecnicos" }
                });

            migrationBuilder.InsertData(
                table: "Permisos",
                columns: new[] { "Id", "Descripcion", "Modulo", "Nombre" },
                values: new object[,]
                {
                    { 1, "Ver clientes", "Clientes", "CLIENTES_VER" },
                    { 2, "Crear clientes", "Clientes", "CLIENTES_CREAR" },
                    { 3, "Editar clientes", "Clientes", "CLIENTES_EDITAR" },
                    { 4, "Eliminar clientes", "Clientes", "CLIENTES_ELIMINAR" },
                    { 5, "Ver tecnicos", "Tecnicos", "TECNICOS_VER" },
                    { 6, "Crear tecnicos", "Tecnicos", "TECNICOS_CREAR" },
                    { 7, "Editar tecnicos", "Tecnicos", "TECNICOS_EDITAR" },
                    { 8, "Eliminar tecnicos", "Tecnicos", "TECNICOS_ELIMINAR" },
                    { 9, "Ver vehiculos", "Vehiculos", "VEHICULOS_VER" },
                    { 10, "Crear vehiculos", "Vehiculos", "VEHICULOS_CREAR" },
                    { 11, "Editar vehiculos", "Vehiculos", "VEHICULOS_EDITAR" },
                    { 12, "Eliminar vehiculos", "Vehiculos", "VEHICULOS_ELIMINAR" },
                    { 13, "Ver tickets", "Tickets", "TICKETS_VER" },
                    { 14, "Crear tickets", "Tickets", "TICKETS_CREAR" },
                    { 15, "Editar tickets", "Tickets", "TICKETS_EDITAR" },
                    { 16, "Eliminar tickets", "Tickets", "TICKETS_ELIMINAR" },
                    { 17, "Administrar usuarios", "Administracion", "ADMIN_USUARIOS" },
                    { 18, "Administrar grupos", "Administracion", "ADMIN_GRUPOS" },
                    { 19, "Administrar permisos", "Administracion", "ADMIN_PERMISOS" }
                });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Activo", "Email", "FechaCreacion", "NombreUsuario", "PasswordHash", "UltimoAcceso" },
                values: new object[] { 1, true, "admin@carfix.com", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "admin", "7eGKCEt+3dTARc3W9axlX1JfVJgDMgZejXz+LJ3i5jA=", null });

            migrationBuilder.InsertData(
                table: "GrupoPermisos",
                columns: new[] { "GruposId", "PermisosId" },
                values: new object[,]
                {
                    { 1, 1 },
                    { 1, 2 },
                    { 1, 3 },
                    { 1, 4 },
                    { 1, 5 },
                    { 1, 6 },
                    { 1, 7 },
                    { 1, 8 },
                    { 1, 9 },
                    { 1, 10 },
                    { 1, 11 },
                    { 1, 12 },
                    { 1, 13 },
                    { 1, 14 },
                    { 1, 15 },
                    { 1, 16 },
                    { 1, 17 },
                    { 1, 18 },
                    { 1, 19 }
                });

            migrationBuilder.InsertData(
                table: "UsuarioGrupos",
                columns: new[] { "GruposId", "UsuariosId" },
                values: new object[] { 1, 1 });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasLogin_UsuarioId",
                table: "AuditoriasLogin",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_GrupoPermisos_PermisosId",
                table: "GrupoPermisos",
                column: "PermisosId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioGrupos_GruposId",
                table: "UsuarioGrupos",
                column: "GruposId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditoriasLogin");

            migrationBuilder.DropTable(
                name: "GrupoPermisos");

            migrationBuilder.DropTable(
                name: "UsuarioGrupos");

            migrationBuilder.DropTable(
                name: "Permisos");

            migrationBuilder.DropTable(
                name: "Grupos");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
