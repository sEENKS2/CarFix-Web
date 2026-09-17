using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace Entidades.Core
{
    public class Usuario
    {
        private int id;
        private string nombreUsuario;
        private string email;
        private string passwordHash;
        private DateTime fechaCreacion;
        private DateTime? ultimoAcceso;
        private bool activo;
        private List<Grupo> grupos;

        [Key]
        public int Id { get => id; set => id = value; }

        [Required]
        [StringLength(50)]
        public string NombreUsuario { get => nombreUsuario; set => nombreUsuario = value; }

        [Required]
        [StringLength(100)]
        public string Email { get => email; set => email = value; }

        [Required]
        [StringLength(255)]
        public string PasswordHash { get => passwordHash; set => passwordHash = value; }

        public DateTime FechaCreacion { get => fechaCreacion; set => fechaCreacion = value; }
        public DateTime? UltimoAcceso { get => ultimoAcceso; set => ultimoAcceso = value; }
        public bool Activo { get => activo; set => activo = value; }

        public virtual List<Grupo> Grupos { get => grupos ?? new List<Grupo>(); set => grupos = value; }

        // Método para establecer contraseña con hash
        public void EstablecerPassword(string password)
        {
            PasswordHash = HashPassword(password);
        }

        // Método para verificar contraseña
        public bool VerificarPassword(string password)
        {
            return PasswordHash == HashPassword(password);
        }

        // Hash
        private string HashPassword(string password)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(password + "CarFixSalt"));
                return Convert.ToBase64String(bytes);
            }
        }
    }
}