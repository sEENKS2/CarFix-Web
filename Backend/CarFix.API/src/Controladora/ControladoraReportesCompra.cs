using Entidades.Compras;
using Microsoft.EntityFrameworkCore;
using Modelo;

namespace Controladora
{
    public class ReporteCompras
    {
        public string Periodo { get; set; }
        public int CantidadOrdenes { get; set; }
        public decimal MontoTotal { get; set; }
        public int ProductosComprados { get; set; }
    }

    public class ReporteProveedor
    {
        public string NombreProveedor { get; set; }
        public int CantidadOrdenes { get; set; }
        public decimal MontoTotal { get; set; }
        public decimal PorcentajeTotal { get; set; }
    }

    public class ControladoraReportesCompras
    {
        private Context context;
        private static ControladoraReportesCompras instancia;

        public static ControladoraReportesCompras Instancia
        {
            get
            {
                if (instancia == null)
                    instancia = new ControladoraReportesCompras();
                return instancia;
            }
        }

        private ControladoraReportesCompras()
        {
            context = new Context();
        }

        public List<ReporteCompras> GenerarReporteComprasPorMes(DateTime fechaDesde, DateTime fechaHasta)
        {
            var ordenes = context.OrdenesCompra
                .Include(o => o.Detalles)
                .Where(o => o.FechaCreacion >= fechaDesde && o.FechaCreacion <= fechaHasta)
                .ToList();

            var reportePorMes = ordenes
                .GroupBy(o => new { Año = o.FechaCreacion.Year, Mes = o.FechaCreacion.Month })
                .Select(g => new ReporteCompras
                {
                    Periodo = $"{g.Key.Mes:D2}/{g.Key.Año}",
                    CantidadOrdenes = g.Count(),
                    MontoTotal = g.Sum(o => o.Total),
                    ProductosComprados = g.Sum(o => o.Detalles.Sum(d => d.Cantidad))
                })
                .OrderBy(r => r.Periodo)
                .ToList();

            return reportePorMes;
        }

        public List<ReporteProveedor> GenerarReporteProveedores(DateTime fechaDesde, DateTime fechaHasta)
        {
            var ordenes = context.OrdenesCompra
                .Include(o => o.Proveedor)
                .Where(o => o.FechaCreacion >= fechaDesde && o.FechaCreacion <= fechaHasta)
                .ToList();

            var montoTotal = ordenes.Sum(o => o.Total);

            var reporteProveedores = ordenes
                .GroupBy(o => o.Proveedor.Nombre)
                .Select(g => new ReporteProveedor
                {
                    NombreProveedor = g.Key,
                    CantidadOrdenes = g.Count(),
                    MontoTotal = g.Sum(o => o.Total),
                    PorcentajeTotal = montoTotal > 0 ? (g.Sum(o => o.Total) / montoTotal) * 100 : 0
                })
                .OrderByDescending(r => r.MontoTotal)
                .ToList();

            return reporteProveedores;
        }

        public List<Producto> RecuperarProductosBajoStock()
        {
            return context.Productos
                .Where(p => p.Activo && p.StockActual <= p.StockMinimo)
                .ToList();
        }
    }
}