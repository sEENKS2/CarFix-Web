using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Controladora;
using Entidades.Core;
using CarFix.API.DTOs;

namespace CarFix.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SeguridadController : ControllerBase
    {
        private readonly ControladoraSeguridad _seguridad = ControladoraSeguridad.Instancia;

        [HttpGet("usuarios")]
        public IActionResult ListarUsuarios()
        {
            try
            {
                var usuarios = _seguridad.ObtenerUsuarios().Select(u => new
                {
                    u.Id,
                    u.NombreUsuario,
                    u.Email,
                    u.Activo,
                    u.FechaCreacion,
                    u.UltimoAcceso,
                    Grupos = u.Grupos.Select(g => g.Nombre).ToList()
                });
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("grupos")]
        public IActionResult ListarGrupos()
        {
            try
            {
                var grupos = _seguridad.ObtenerGrupos().Select(g => new
                {
                    g.Id,
                    g.Nombre,
                    g.Descripcion,
                    Permisos = g.Permisos.Select(p => p.Nombre).ToList()
                });
                return Ok(grupos);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("usuarios")]
        public IActionResult CrearUsuario([FromBody] CrearUsuarioDTO dto)
        {
            try
            {
                var nuevoUsuario = new Usuario
                {
                    NombreUsuario = dto.NombreUsuario,
                    Email = dto.Email
                };

                var creado = _seguridad.CrearUsuario(nuevoUsuario, dto.Password);
                if (creado && dto.GrupoId.HasValue)
                {
                    _seguridad.AsignarUsuarioAGrupo(nuevoUsuario.Id, dto.GrupoId.Value);
                }

                return Ok(new { mensaje = "Usuario creado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("usuarios/{id}/password")]
        public IActionResult ResetPassword(int id, [FromBody] CambiarPasswordDTO dto)
        {
            try
            {
                var res = _seguridad.ResetearPassword(id, dto.PasswordNuevo);
                if (!res) return NotFound("Usuario no encontrado");
                return Ok(new { mensaje = "Contraseña reestablecida exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("usuarios/{id}")]
        public IActionResult DesactivarUsuario(int id)
        {
            try
            {
                var res = _seguridad.EliminarUsuario(id);
                if (!res) return NotFound("Usuario no encontrado");
                return Ok(new { mensaje = "Usuario desactivado del sistema" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}