using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Controladora;
using Entidades.Compras;
using CarFix.API.DTOs;

namespace CarFix.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OrdenesCompraController : ControllerBase
    {
        private readonly ControladoraOrdenesCompra _gestorOrdenes = ControladoraOrdenesCompra.Instancia;

        [HttpGet]
        public IActionResult Listar()
        {
            try
            {
                var lista = _gestorOrdenes.RecuperarOrdenesCompra();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al recuperar órdenes de compra: {ex.Message}");
            }
        }

        [HttpPost]
        public IActionResult Crear([FromBody] OrdenCompraAltaDTO dto)
        {
            try
            {
                var detalles = dto.Detalles.Select(d => new DetalleOrdenCompra
                {
                    ProductoId = d.ProductoId,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Subtotal = d.Cantidad * d.PrecioUnitario
                }).ToList();

                _gestorOrdenes.CrearOrdenCompra(dto.ProveedorId, detalles, dto.Observaciones ?? "");
                return Ok(new { mensaje = "Orden de compra creada exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al crear orden de compra: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] ModificarOrdenDTO dto)
        {
            try
            {
                _gestorOrdenes.ModificarOrden(id, dto.NuevoProveedorId, dto.NuevasObservaciones ?? "");
                return Ok(new { mensaje = "Orden modificada exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al modificar orden de compra: {ex.Message}");
            }
        }

        [HttpPut("{id}/estado")]
        public IActionResult CambiarEstado(int id, [FromBody] CambiarEstadoOrdenDTO dto)
        {
            try
            {
                _gestorOrdenes.CambiarEstadoOrden(id, (OrdenCompra.EstadoOrden)dto.Estado);
                return Ok(new { mensaje = "Estado de orden actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al actualizar estado de la orden: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id, [FromQuery] string motivo = "")
        {
            try
            {
                _gestorOrdenes.EliminarOrden(id, motivo);
                return Ok(new { mensaje = "Orden eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al eliminar orden de compra: {ex.Message}");
            }
        }
    }
}