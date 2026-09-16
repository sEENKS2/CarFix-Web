namespace CarFix.API.DTOs
{
    public class ClienteDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public int Dni { get; set; }
        public string Correo { get; set; } = string.Empty;
        public int Telefono { get; set; }
    }

    public class VehiculoDTO
    {
        public int ClienteId { get; set; }
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public int Año { get; set; }
        public string Dominio { get; set; } = string.Empty;
    }

    public class CrearUsuarioDTO
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int? GrupoId { get; set; }
    }

    public class CambiarPasswordDTO
    {
        public string PasswordNuevo { get; set; } = string.Empty;
    }

    public class AsignarGrupoDTO
    {
        public int UsuarioId { get; set; }
        public int GrupoId { get; set; }
    }
}