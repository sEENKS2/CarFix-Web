using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Modelo.Migrations
{
    /// <inheritdoc />
    public partial class Auditoria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditoriasOrdenesCompra",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrdenCompraId = table.Column<int>(type: "int", nullable: false),
                    Accion = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Campo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ValorAnterior = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ValorNuevo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    FechaHora = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriasOrdenesCompra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditoriasOrdenesCompra_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditoriasTickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    Accion = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Campo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ValorAnterior = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ValorNuevo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    FechaHora = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriasTickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditoriasTickets_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasOrdenesCompra_Accion",
                table: "AuditoriasOrdenesCompra",
                column: "Accion");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasOrdenesCompra_FechaHora",
                table: "AuditoriasOrdenesCompra",
                column: "FechaHora");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasOrdenesCompra_OrdenCompraId",
                table: "AuditoriasOrdenesCompra",
                column: "OrdenCompraId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasOrdenesCompra_UsuarioId",
                table: "AuditoriasOrdenesCompra",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasTickets_Accion",
                table: "AuditoriasTickets",
                column: "Accion");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasTickets_FechaHora",
                table: "AuditoriasTickets",
                column: "FechaHora");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasTickets_TicketId",
                table: "AuditoriasTickets",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasTickets_UsuarioId",
                table: "AuditoriasTickets",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditoriasOrdenesCompra");

            migrationBuilder.DropTable(
                name: "AuditoriasTickets");
        }
    }
}
