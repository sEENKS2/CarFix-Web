using Entidades.Compras;
using Entidades.Facturacion;
using Microsoft.EntityFrameworkCore;
using Modelo;
using System.Collections.ObjectModel;

namespace Controladora
{
    public class ControladoraFacturas
    {
        private Context context;

        // Campo estático que almacena la instancia única de la clase
        private static ControladoraFacturas instancia;

        public static ControladoraFacturas Instancia
        {
            get
            {
                if (instancia == null)
                {
                    instancia = new ControladoraFacturas();
                }
                return instancia;
            }
        }

        private ControladoraFacturas()
        {
            context = new Context();
        }

        #region Consultas

        public ReadOnlyCollection<Factura> RecuperarFacturas()
        {
            using (var db = new Context())
            {
                return db.Facturas
                    .AsNoTracking()
                    .Include(f => f.Cliente)
                    .Include(f => f.Detalles)
                    .Include(f => f.Pagos)
                    .OrderByDescending(f => f.FechaEmision)
                    .ToList()
                    .AsReadOnly();
            }
        }

        public Factura? ObtenerFacturaPorId(int id)
        {
            return context.Facturas
                .Include(f => f.Detalles)
                .Include(f => f.Pagos)
                .FirstOrDefault(f => f.Id == id);
        }

        public ReadOnlyCollection<Factura> RecuperarFacturasPorCliente(int clienteId)
        {
            return context.Facturas
                .Include(f => f.Detalles)
                .Include(f => f.Pagos)
                .Where(f => f.ClienteId == clienteId)
                .OrderByDescending(f => f.FechaEmision)
                .ToList()
                .AsReadOnly();
        }

        public Factura? ObtenerFacturaPorTicket(int ticketId)
        {
            return context.Facturas
                .Include(f => f.Detalles)
                .Include(f => f.Pagos)
                .FirstOrDefault(f => f.TicketId == ticketId && f.Estado != "Anulada");
        }

        #endregion

        #region Generación de Facturas

        private string GenerarNumeroFactura()
        {
            int correlativo = context.Facturas.Count() + 1;
            return $"FAC-{DateTime.Now.Year}-{correlativo.ToString().PadLeft(6, '0')}";
        }

        public string AgregarFactura(int ticketId, int clienteId, decimal descuento, string? observaciones, List<DetalleFactura> detalles)
        {
            try
            {
                if (detalles == null || !detalles.Any())
                {
                    return "La factura debe contener al menos un ítem.";
                }

                if (ticketId > 0)
                {
                    bool yaExiste = context.Facturas.Any(f => f.TicketId == ticketId && f.Estado != "Anulada");
                    if (yaExiste)
                    {
                        return $"El ticket #{ticketId} ya cuenta con una factura activa asociada.";
                    }
                }

                decimal subtotal = detalles.Sum(d => d.Cantidad * d.PrecioUnitario);
                decimal total = Math.Max(0, subtotal - descuento);

                var nuevaFactura = new Factura
                {
                    TicketId = ticketId,
                    ClienteId = clienteId,
                    NumeroFactura = GenerarNumeroFactura(),
                    FechaEmision = DateTime.Now,
                    Subtotal = subtotal,
                    Descuento = descuento,
                    Total = total,
                    SaldoPendiente = total,
                    Estado = total == 0 ? "Pagada" : "Pendiente",
                    Observaciones = observaciones,
                    Detalles = detalles
                };

                context.Facturas.Add(nuevaFactura);

                // Descuento automático de stock para repuestos asociados a un producto
                foreach (var det in detalles.Where(d => d.Tipo == "Repuesto" && d.ProductoId.HasValue))
                {
                    var producto = context.Productos.Find(det.ProductoId.Value);
                    if (producto != null)
                    {
                        int stockAnterior = producto.StockActual;
                        producto.StockActual -= det.Cantidad;

                        context.MovimientosStock.Add(new MovimientoStock
                        {
                            ProductoId = producto.Id,
                            Fecha = DateTime.Now,
                            TipoMovimiento = "Salida_Taller",
                            Cantidad = det.Cantidad,
                            StockAnterior = stockAnterior,
                            StockNuevo = producto.StockActual,
                            MotivoReferencia = $"Factura #{nuevaFactura.NumeroFactura} (Ticket #{ticketId})",
                            Usuario = "Sistema"
                        });
                    }
                }

                context.SaveChanges();

                return "La factura ha sido generada correctamente.";
            }
            catch (Exception ex)
            {
                return $"Ocurrió un error al generar la factura: {ex.Message}";
            }
        }

        #endregion

        #region Gestión de Pagos

        public string RegistrarPago(int facturaId, decimal monto, string metodoPago, string? referencia)
        {
            try
            {
                if (monto <= 0)
                {
                    return "El monto del pago debe ser mayor a 0.";
                }

                var factura = context.Facturas
                    .Include(f => f.Pagos)
                    .FirstOrDefault(f => f.Id == facturaId);

                if (factura == null)
                {
                    return "No se encontró la factura indicada.";
                }

                if (factura.Estado == "Anulada")
                {
                    return "No se pueden asentar pagos en una factura anulada.";
                }

                if (factura.SaldoPendiente <= 0)
                {
                    return "La factura ya está totalmente saldada.";
                }

                if (monto > factura.SaldoPendiente)
                {
                    return $"El monto ingresado excede el saldo pendiente ({factura.SaldoPendiente:C}).";
                }

                var pago = new Pago
                {
                    FacturaId = facturaId,
                    FechaPago = DateTime.Now,
                    Monto = monto,
                    MetodoPago = metodoPago,
                    ReferenciaComprobante = referencia
                };

                factura.SaldoPendiente -= monto;
                factura.Estado = factura.SaldoPendiente == 0 ? "Pagada" : "PagadaParcial";

                context.Pagos.Add(pago);
                context.SaveChanges();

                return "El pago ha sido registrado correctamente.";
            }
            catch (Exception ex)
            {
                return $"Ocurrió un error al registrar el pago: {ex.Message}";
            }
        }

        #endregion

        #region Anulación

        public string AnularFactura(int facturaId, string motivo)
        {
            try
            {
                var factura = context.Facturas
                    .Include(f => f.Pagos)
                    .FirstOrDefault(f => f.Id == facturaId);

                if (factura == null)
                {
                    return "No se encontró la factura.";
                }

                if (factura.Pagos.Any())
                {
                    return "No se puede anular una factura que ya posee cobros registrados.";
                }

                factura.Estado = "Anulada";
                factura.Observaciones = string.IsNullOrEmpty(factura.Observaciones)
                    ? $"Anulada: {motivo}"
                    : $"{factura.Observaciones} | Anulada: {motivo}";

                context.SaveChanges();

                return "La factura ha sido anulada correctamente.";
            }
            catch (Exception ex)
            {
                return $"Ocurrió un error al anular la factura: {ex.Message}";
            }
        }

        #endregion
    }
}