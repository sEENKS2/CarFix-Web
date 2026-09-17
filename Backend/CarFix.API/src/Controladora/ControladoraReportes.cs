using Entidades.Tickets;
using Entidades.Validaciones;
using Microsoft.EntityFrameworkCore;
using Modelo;

namespace Controladora
{
    public class ControladoraReportes
    {
        private static ControladoraReportes _instancia;
        private static readonly object _lock = new object();
        private Context context;

        private ControladoraReportes()
        {
            context = new Context();
        }

        public static ControladoraReportes Instancia
        {
            get
            {
                if (_instancia == null)
                {
                    lock (_lock)
                    {
                        if (_instancia == null)
                            _instancia = new ControladoraReportes();
                    }
                }
                return _instancia;
            }
        }

        public List<ProductividadTecnico> GenerarReporteProductividadTecnicos(DateTime? fechaDesde = null, DateTime? fechaHasta = null)
        {
            try
            {
                // Establecer fechas por defecto si no se proporcionan
                var desde = fechaDesde ?? DateTime.Now.AddMonths(-6);
                var hasta = fechaHasta ?? DateTime.Now;

                var tecnicos = context.Tecnicos.ToList();

                // Obtener tickets del período con sus relaciones
                var tickets = context.Tickets
                    .Include(t => t.Tecnico)
                    .Where(t => t.FechaCreacion >= desde && t.FechaCreacion <= hasta)
                    .ToList();

                var reporte = new List<ProductividadTecnico>();

                foreach (var tecnico in tecnicos)
                {
                    var ticketsTecnico = tickets.Where(t => t.TecnicoId == tecnico.Id).ToList();

                    var totalTickets = ticketsTecnico.Count;
                    var finalizados = ticketsTecnico.Count(t => t.Estado == EnumEstados.Finalizado);
                    var enProceso = ticketsTecnico.Count(t => t.Estado == EnumEstados.EnProceso);
                    var asignados = ticketsTecnico.Count(t => t.Estado == EnumEstados.Asignado);

                    var porcentajeFinalizados = totalTickets > 0 ? (double)finalizados / totalTickets * 100 : 0;

                    var mesesPeriodo = Math.Max(1, (hasta - desde).Days / 30.0);
                    var promedioMensual = totalTickets / mesesPeriodo;

                    var ultimoTicket = ticketsTecnico.OrderByDescending(t => t.FechaCreacion).FirstOrDefault();

                    var productividad = new ProductividadTecnico
                    {
                        TecnicoId = tecnico.Id,
                        NombreTecnico = tecnico.NombreCompleto,
                        Especialidad = tecnico.Especialidad.ToString(),
                        TotalTickets = totalTickets,
                        TicketsFinalizados = finalizados,
                        TicketsEnProceso = enProceso,
                        TicketsAsignados = asignados,
                        PorcentajeFinalizados = Math.Round(porcentajeFinalizados, 2),
                        PromedioTicketsPorMes = Math.Round(promedioMensual, 2),
                        UltimoTicketFecha = ultimoTicket?.FechaCreacion
                    };

                    reporte.Add(productividad);
                }

                return reporte.OrderByDescending(r => r.TotalTickets).ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al generar reporte de productividad: {ex.Message}");
            }
        }

        public Dictionary<string, int> ObtenerTicketsPorEstado(DateTime? fechaDesde = null, DateTime? fechaHasta = null)
        {
            try
            {
                var desde = fechaDesde ?? DateTime.Now.AddMonths(-3);
                var hasta = fechaHasta ?? DateTime.Now;

                var tickets = context.Tickets
                    .Where(t => t.FechaCreacion >= desde && t.FechaCreacion <= hasta)
                    .ToList();

                return new Dictionary<string, int>
                {
                    ["Asignados"] = tickets.Count(t => t.Estado == EnumEstados.Asignado),
                    ["En Proceso"] = tickets.Count(t => t.Estado == EnumEstados.EnProceso),
                    ["Finalizados"] = tickets.Count(t => t.Estado == EnumEstados.Finalizado)
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener tickets por estado: {ex.Message}");
            }
        }

        public List<dynamic> ObtenerTicketsPorMes(int cantidadMeses = 6)
        {
            try
            {
                var fechaDesde = DateTime.Now.AddMonths(-cantidadMeses);

                var tickets = context.Tickets
                    .Where(t => t.FechaCreacion >= fechaDesde)
                    .ToList();

                var ticketsPorMes = tickets
                    .GroupBy(t => new { t.FechaCreacion.Year, t.FechaCreacion.Month })
                    .Select(g => new
                    {
                        Mes = $"{g.Key.Month:00}/{g.Key.Year}",
                        Cantidad = g.Count(),
                        Finalizados = g.Count(t => t.Estado == EnumEstados.Finalizado)
                    })
                    .OrderBy(x => x.Mes)
                    .ToList<dynamic>();

                return ticketsPorMes;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener tickets por mes: {ex.Message}");
            }
        }

        public Dictionary<string, object> ObtenerEstadisticasGenerales()
        {
            try
            {
                var totalTickets = context.Tickets.Count();
                var ticketsHoy = context.Tickets.Count(t => t.FechaCreacion.Date == DateTime.Today);
                var ticketsEsteMes = context.Tickets.Count(t => t.FechaCreacion.Month == DateTime.Now.Month
                                                              && t.FechaCreacion.Year == DateTime.Now.Year);

                var tecnicoMasProductivo = GenerarReporteProductividadTecnicos()
                    .OrderByDescending(t => t.TotalTickets)
                    .FirstOrDefault();

                return new Dictionary<string, object>
                {
                    ["TotalTickets"] = totalTickets,
                    ["TicketsHoy"] = ticketsHoy,
                    ["TicketsEsteMes"] = ticketsEsteMes,
                    ["TecnicoMasProductivo"] = tecnicoMasProductivo?.NombreTecnico ?? "N/A",
                    ["PromedioTicketsPorTecnico"] = tecnicoMasProductivo?.PromedioTicketsPorMes ?? 0
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener estadísticas generales: {ex.Message}");
            }
        }
    }
}