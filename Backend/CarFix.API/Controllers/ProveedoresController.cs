using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Controladora;
using CarFix.API.DTOs;

namespace CarFix.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly ControladoraProveedores _gestorProveedores = ControladoraProveedores.Instancia;

        [HttpGet]
        public IActionResult Listar()
        {
            try
            {
                var lista = _gestorProveedores.RecuperarProveedores();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al recuperar proveedores: {ex.Message}");
            }
        }

        [HttpPost]
        public IActionResult Crear([FromBody] ProveedorAltaDTO dto)
        {
            try
            {
                _gestorProveedores.AgregarProveedor(
                    dto.Nombre,
                    dto.Telefono,
                    dto.Email,
                    dto.Direccion,
                    dto.Cuit
                );
                return Ok(new { mensaje = "Proveedor agregado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al registrar proveedor: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] ProveedorAltaDTO dto)
        {
            try
            {
                _gestorProveedores.ModificarProveedor(
                    id,
                    dto.Nombre,
                    dto.Telefono,
                    dto.Email,
                    dto.Direccion,
                    dto.Cuit
                );
                return Ok(new { mensaje = "Proveedor modificado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al modificar proveedor: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            try
            {
                _gestorProveedores.EliminarProveedor(id);
                return Ok(new { mensaje = "Proveedor dado de baja exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al eliminar proveedor: {ex.Message}");
            }
        }
    }
}