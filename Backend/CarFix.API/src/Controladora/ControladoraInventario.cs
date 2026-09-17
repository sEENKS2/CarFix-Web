using Entidades.Compras;
using Microsoft.EntityFrameworkCore;
using Modelo;
using System.Collections.ObjectModel;

namespace Controladora
{
    public class ControladoraInventario
    {
        private Context context;
        private static ControladoraInventario? instancia;

        public static ControladoraInventario Instancia => instancia ??= new ControladoraInventario();

        private ControladoraInventario()
        {
            context = new Context();
        }

        public ReadOnlyCollection<MovimientoStock> RecuperarMovimientos(int? productoId = null)
        {
            var query = context.MovimientosStock.AsQueryable();

            if (productoId.HasValue && productoId.Value > 0)
            {
                query = query.Where(m => m.ProductoId == productoId.Value);
            }

            return query.OrderByDescending(m => m.Fecha).ToList().AsReadOnly();
        }

        public string RegistrarAjusteManual(int productoId, int cantidadAjuste, string tipoAjuste, string motivo, string? usuario)
        {
            var producto = context.Productos.Find(productoId);
            if (producto == null) return "Producto no encontrado.";

            int stockAnterior = producto.StockActual;
            int nuevoStock = tipoAjuste == "Ingreso"
                ? stockAnterior + cantidadAjuste
                : stockAnterior - cantidadAjuste;

            if (nuevoStock < 0)
            {
                return $"Operación rechazada. El stock no puede quedar en negativo (Stock actual: {stockAnterior}).";
            }

            producto.StockActual = nuevoStock;

            var mov = new MovimientoStock
            {
                ProductoId = productoId,
                Fecha = DateTime.Now,
                TipoMovimiento = tipoAjuste == "Ingreso" ? "Entrada_Ajuste" : "Salida_Ajuste",
                Cantidad = cantidadAjuste,
                StockAnterior = stockAnterior,
                StockNuevo = nuevoStock,
                MotivoReferencia = motivo,
                Usuario = usuario ?? "Sistema"
            };

            context.MovimientosStock.Add(mov);
            context.SaveChanges();

            return "Ajuste de stock registrado correctamente.";
        }

        public List<Producto> ObtenerAlertasStockCritico()
        {
            return context.Productos
                .Where(p => p.StockActual <= p.StockMinimo)
                .OrderBy(p => p.StockActual)
                .ToList();
        }
    }
}