using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Controladora;
using CarFix.API.DTOs;

namespace CarFix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly ControladoraSeguridad _seguridad = ControladoraSeguridad.Instancia;
        private readonly IConfiguration _configuration;

        public UsuariosController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO login)
        {
            try
            {
                bool loginExitoso = _seguridad.IniciarSesion(login.NombreUsuario, login.Password);

                if (!loginExitoso)
                    return Unauthorized("Credenciales inválidas");

                var usuario = _seguridad.UsuarioActual;

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                    new Claim(ClaimTypes.Name, usuario.NombreUsuario),
                    new Claim(ClaimTypes.Email, usuario.Email ?? "")
                };

                if (usuario.Grupos != null)
                {
                    foreach (var grupo in usuario.Grupos)
                    {
                        claims.Add(new Claim(ClaimTypes.Role, grupo.Nombre));
                    }
                }

                var jwtKey = _configuration["Jwt:Key"] ?? "CarFixSuperSecretaClaveParaElProyectoFinal2026";
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var tokenDescriptor = new JwtSecurityToken(
                    issuer: _configuration["Jwt:Issuer"] ?? "CarFixAPI",
                    audience: _configuration["Jwt:Audience"] ?? "CarFixReactApp",
                    claims: claims,
                    expires: DateTime.UtcNow.AddDays(7),
                    signingCredentials: creds
                );

                var jwtToken = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);

                return Ok(new
                {
                    mensaje = "Acceso concedido",
                    id = usuario.Id,
                    nombreUsuario = usuario.NombreUsuario,
                    email = usuario.Email,
                    roles = usuario.Grupos?.Select(g => g.Nombre).ToList() ?? new List<string>(),
                    token = jwtToken
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error en el servidor: {ex.Message}");
            }
        }

        [Authorize]
        [HttpGet]
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
                    Grupos = u.Grupos?.Select(g => g.Nombre).ToList()
                });
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al obtener usuarios: {ex.Message}");
            }
        }
    }
}