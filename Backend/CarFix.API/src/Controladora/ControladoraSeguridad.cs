using Entidades.Core;
using Entidades.Validaciones;
using Microsoft.EntityFrameworkCore;
using Modelo;

namespace Controladora
{
    public class ControladoraSeguridad
    {
        private static ControladoraSeguridad instancia;
        private static readonly object lockObject = new object();
        private Usuario usuarioActual;

        private ControladoraSeguridad() { }

        public static ControladoraSeguridad Instancia
        {
            get
            {
                if (instancia == null)
                {
                    lock (lockObject)
                    {
                        if (instancia == null)
                            instancia = new ControladoraSeguridad();
                    }
                }
                return instancia;
            }
        }

        public Usuario UsuarioActual => usuarioActual;

        public bool IniciarSesion(string nombreUsuario, string password)
        {
            try
            {
                using (var context = new Context())
                {
                    var usuario = context.Usuarios
                        .Include(u => u.Grupos)
                        .ThenInclude(g => g.Permisos)
                        .FirstOrDefault(u => u.NombreUsuario == nombreUsuario && u.Activo);

                    if (usuario != null && usuario.VerificarPassword(password))
                    {
                        usuario.UltimoAcceso = DateTime.Now;
                        context.SaveChanges();
                        usuarioActual = usuario;

                        RegistrarAuditoriaLogin(usuario.Id, nombreUsuario, "LOGIN");
                        return true;
                    }
                    else
                    {
                        RegistrarAuditoriaLogin(0, nombreUsuario, "INTENTO_FALLIDO");
                        return false;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al iniciar sesión: {ex.Message}");
            }
        }

        public void CerrarSesion()
        {
            if (usuarioActual != null)
            {
                RegistrarAuditoriaLogin(usuarioActual.Id, usuarioActual.NombreUsuario, "LOGOUT");
                usuarioActual = null;
            }
        }

        public bool TienePermiso(string nombrePermiso)
        {
            if (usuarioActual == null) return false;

            return usuarioActual.Grupos
                .SelectMany(g => g.Permisos)
                .Any(p => p.Nombre == nombrePermiso);
        }

        public List<Usuario> ObtenerUsuarios()
        {
            using (var context = new Context())
            {
                return context.Usuarios
                    .Include(u => u.Grupos)
                    .ToList();
            }
        }

        public bool CrearUsuario(Usuario usuario, string password)
        {
            try
            {
                using (var context = new Context())
                {
                    // Verificar si ya existe
                    if (context.Usuarios.Any(u => u.NombreUsuario == usuario.NombreUsuario))
                        throw new Exception("El nombre de usuario ya existe");

                    usuario.EstablecerPassword(password);
                    usuario.FechaCreacion = DateTime.Now;
                    usuario.Activo = true;

                    context.Usuarios.Add(usuario);
                    context.SaveChanges();
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al crear usuario: {ex.Message}");
            }
        }

        public bool ActualizarUsuario(Usuario usuario)
        {
            try
            {
                using (var context = new Context())
                {
                    var usuarioExistente = context.Usuarios.Find(usuario.Id);
                    if (usuarioExistente == null) return false;

                    usuarioExistente.NombreUsuario = usuario.NombreUsuario;
                    usuarioExistente.Email = usuario.Email;
                    usuarioExistente.Activo = usuario.Activo;

                    context.SaveChanges();
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al actualizar usuario: {ex.Message}");
            }
        }

        public bool EliminarUsuario(int usuarioId)
        {
            try
            {
                using (var context = new Context())
                {
                    var usuario = context.Usuarios.Find(usuarioId);
                    if (usuario == null) return false;

                    // No eliminar, solo desactivar
                    usuario.Activo = false;
                    context.SaveChanges();
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al eliminar usuario: {ex.Message}");
            }
        }

        public bool CambiarPassword(int usuarioId, string passwordActual, string passwordNuevo)
        {
            try
            {
                using (var context = new Context())
                {
                    var usuario = context.Usuarios.Find(usuarioId);
                    if (usuario == null || !usuario.VerificarPassword(passwordActual))
                        return false;

                    usuario.EstablecerPassword(passwordNuevo);
                    context.SaveChanges();
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al cambiar contraseña: {ex.Message}");
            }
        }

        public bool ResetearPassword(int usuarioId, string passwordNuevo)
        {
            try
            {
                using (var context = new Context())
                {
                    var usuario = context.Usuarios.Find(usuarioId);
                    if (usuario == null) return false;

                    usuario.EstablecerPassword(passwordNuevo);
                    context.SaveChanges();
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al resetear contraseña: {ex.Message}");
            }
        }

        public List<Grupo> ObtenerGrupos()
        {
            using (var context = new Context())
            {
                return context.Grupos
                    .Include(g => g.Permisos)
                    .Include(g => g.Usuarios)
                    .ToList();
            }
        }

        public bool CrearGrupo(Grupo grupo)
        {
            try
            {
                using (var context = new Context())
                {
                    context.Grupos.Add(grupo);
                    context.SaveChanges();
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al crear grupo: {ex.Message}");
            }
        }

        public bool ActualizarGrupo(Grupo grupo)
        {
            try
            {
                using (var context = new Context())
                {
                    var grupoExistente = context.Grupos.Find(grupo.Id);
                    if (grupoExistente == null) return false;

                    grupoExistente.Nombre = grupo.Nombre;
                    grupoExistente.Descripcion = grupo.Descripcion;

                    context.SaveChanges();
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al actualizar grupo: {ex.Message}");
            }
        }

        public bool EliminarGrupo(int grupoId)
        {
            try
            {
                using (var context = new Context())
                {
                    var grupo = context.Grupos
                        .Include(g => g.Usuarios)
                        .FirstOrDefault(g => g.Id == grupoId);

                    if (grupo == null) return false;

                    if (grupo.Usuarios.Any())
                        throw new Exception("No se puede eliminar un grupo que tiene usuarios asignados");

                    context.Grupos.Remove(grupo);
                    context.SaveChanges();
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al eliminar grupo: {ex.Message}");
            }
        }

        public bool AsignarUsuarioAGrupo(int usuarioId, int grupoId)
        {
            try
            {
                using (var context = new Context())
                {
                    var usuario = context.Usuarios.Include(u => u.Grupos).FirstOrDefault(u => u.Id == usuarioId);
                    var grupo = context.Grupos.Find(grupoId);

                    if (usuario == null || grupo == null) return false;

                    if (!usuario.Grupos.Any(g => g.Id == grupoId))
                    {
                        usuario.Grupos.Add(grupo);
                        context.SaveChanges();
                    }
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al asignar usuario a grupo: {ex.Message}");
            }
        }

        public bool RemoverUsuarioDeGrupo(int usuarioId, int grupoId)
        {
            try
            {
                using (var context = new Context())
                {
                    var usuario = context.Usuarios.Include(u => u.Grupos).FirstOrDefault(u => u.Id == usuarioId);

                    if (usuario == null) return false;

                    var grupo = usuario.Grupos.FirstOrDefault(g => g.Id == grupoId);
                    if (grupo != null)
                    {
                        usuario.Grupos.Remove(grupo);
                        context.SaveChanges();
                    }
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al remover usuario de grupo: {ex.Message}");
            }
        }

        public List<Permiso> ObtenerPermisos()
        {
            using (var context = new Context())
            {
                return context.Permisos.ToList();
            }
        }

        public bool AsignarPermisoAGrupo(int grupoId, int permisoId)
        {
            try
            {
                using (var context = new Context())
                {
                    var grupo = context.Grupos.Include(g => g.Permisos).FirstOrDefault(g => g.Id == grupoId);
                    var permiso = context.Permisos.Find(permisoId);

                    if (grupo == null || permiso == null) return false;

                    if (!grupo.Permisos.Any(p => p.Id == permisoId))
                    {
                        grupo.Permisos.Add(permiso);
                        context.SaveChanges();
                    }
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al asignar permiso a grupo: {ex.Message}");
            }
        }

        public bool RemoverPermisoDeGrupo(int grupoId, int permisoId)
        {
            try
            {
                using (var context = new Context())
                {
                    var grupo = context.Grupos.Include(g => g.Permisos).FirstOrDefault(g => g.Id == grupoId);

                    if (grupo == null) return false;

                    var permiso = grupo.Permisos.FirstOrDefault(p => p.Id == permisoId);
                    if (permiso != null)
                    {
                        grupo.Permisos.Remove(permiso);
                        context.SaveChanges();
                    }
                    return true;
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al remover permiso de grupo: {ex.Message}");
            }
        }

        // AUDITORÍA
        private void RegistrarAuditoriaLogin(int usuarioId, string nombreUsuario, string tipoEvento)
        {
            try
            {
                using (var context = new Context())
                {
                    var auditoria = new AuditoriaLogin
                    {
                        UsuarioId = usuarioId,
                        NombreUsuario = nombreUsuario,
                        FechaHora = DateTime.Now,
                        TipoEvento = tipoEvento,
                        DireccionIP = "127.0.0.1"
                    };

                    context.AuditoriasLogin.Add(auditoria);
                    context.SaveChanges();
                }
            }
            catch
            {
                // No fallar si la auditoría falla
            }
        }

        public List<AuditoriaLogin> ObtenerAuditoriaLogin(DateTime? fechaDesde = null, DateTime? fechaHasta = null)
        {
            using (var context = new Context())
            {
                var query = context.AuditoriasLogin.Include(a => a.Usuario).AsQueryable();

                if (fechaDesde.HasValue)
                    query = query.Where(a => a.FechaHora >= fechaDesde.Value);

                if (fechaHasta.HasValue)
                    query = query.Where(a => a.FechaHora <= fechaHasta.Value);

                return query.OrderByDescending(a => a.FechaHora).ToList();
            }
        }
    }
}