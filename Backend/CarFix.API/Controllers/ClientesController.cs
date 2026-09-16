using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Controladora;
using CarFix.API.DTOs;

namespace CarFix.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly ControladoraClientes _gestor = ControladoraClientes.Instancia;

        [HttpGet]
        public IActionResult Listar()
        {
            try
            {
                var clientes = _gestor.RecuperarClientes();
                return Ok(clientes);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al recuperar clientes: {ex.Message}");
            }
        }

        [HttpPost]
        public IActionResult Crear([FromBody] ClienteDTO dto)
        {
            try
            {
                _gestor.AgregarCliente(dto.Nombre, dto.Apellido, dto.Dni, dto.Correo, dto.Telefono);
                return Ok(new { mensaje = "Cliente registrado con éxito" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] ClienteDTO dto)
        {
            try
            {
                _gestor.ModificarCliente(id, dto.Nombre, dto.Apellido, dto.Dni, dto.Correo, dto.Telefono);
                return Ok(new { mensaje = "Cliente modificado con éxito" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            try
            {
                var msg = _gestor.EliminarCliente(id);
                return Ok(new { mensaje = msg });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}