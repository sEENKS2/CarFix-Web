using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Modelo.Migrations
{
    /// <inheritdoc />
    public partial class ModuloCompras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    StockMinimo = table.Column<int>(type: "int", nullable: false),
                    StockActual = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Proveedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cuit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proveedores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrdenesCompra",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Numero = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEnvio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaRecepcion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProveedorId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenesCompra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenesCompra_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DetallesOrdenesCompra",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OrdenCompraId = table.Column<int>(type: "int", nullable: false),
                    ProductoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetallesOrdenesCompra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DetallesOrdenesCompra_OrdenesCompra_OrdenCompraId",
                        column: x => x.OrdenCompraId,
                        principalTable: "OrdenesCompra",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DetallesOrdenesCompra_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Permisos",
                columns: new[] { "Id", "Descripcion", "Modulo", "Nombre" },
                values: new object[,]
                {
                    { 20, "Ver órdenes de compra", "Compras", "COMPRAS_VER" },
                    { 21, "Crear órdenes de compra", "Compras", "COMPRAS_CREAR" },
                    { 22, "Editar órdenes de compra", "Compras", "COMPRAS_EDITAR" },
                    { 23, "Eliminar órdenes de compra", "Compras", "COMPRAS_ELIMINAR" },
                    { 24, "Ver proveedores", "Compras", "PROVEEDORES_VER" },
                    { 25, "Crear proveedores", "Compras", "PROVEEDORES_CREAR" },
                    { 26, "Ver productos", "Compras", "PRODUCTOS_VER" },
                    { 27, "Crear productos", "Compras", "PRODUCTOS_CREAR" }
                });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "Activo", "Categoria", "Codigo", "Descripcion", "Nombre", "PrecioUnitario", "StockActual", "StockMinimo" },
                values: new object[,]
                {
                    { 1, true, "Filtros", "P001", "Filtro de aceite universal", "Filtro de Aceite", 15.50m, 25, 10 },
                    { 2, true, "Lubricantes", "P002", "Aceite sintético 5W30", "Aceite Motor 5W30", 45.00m, 12, 5 },
                    { 3, true, "Frenos", "P003", "Pastillas delanteras universales", "Pastillas de Freno", 85.00m, 15, 8 }
                });

            migrationBuilder.InsertData(
                table: "Proveedores",
                columns: new[] { "Id", "Activo", "Cuit", "Direccion", "Email", "Nombre", "Telefono" },
                values: new object[,]
                {
                    { 1, true, "20-12345678-9", "Av. Principal 123", "ventas@repuestos.com", "Repuestos SA", "123456789" },
                    { 2, true, "20-98765432-1", "Calle Secundaria 456", "pedidos@autopartes.com", "AutoPartes SRL", "987654321" }
                });

            migrationBuilder.InsertData(
                table: "GrupoPermisos",
                columns: new[] { "GruposId", "PermisosId" },
                values: new object[,]
                {
                    { 1, 20 },
                    { 1, 21 },
                    { 1, 22 },
                    { 1, 23 },
                    { 1, 24 },
                    { 1, 25 },
                    { 1, 26 },
                    { 1, 27 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_DetallesOrdenesCompra_OrdenCompraId",
                table: "DetallesOrdenesCompra",
                column: "OrdenCompraId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesOrdenesCompra_ProductoId",
                table: "DetallesOrdenesCompra",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_ProveedorId",
                table: "OrdenesCompra",
                column: "ProveedorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DetallesOrdenesCompra");

            migrationBuilder.DropTable(
                name: "OrdenesCompra");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Proveedores");

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 20 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 21 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 22 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 23 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 24 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 25 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 26 });

            migrationBuilder.DeleteData(
                table: "GrupoPermisos",
                keyColumns: new[] { "GruposId", "PermisosId" },
                keyValues: new object[] { 1, 27 });

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "Permisos",
                keyColumn: "Id",
                keyValue: 27);
        }
    }
}
