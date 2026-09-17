using Entidades.Tickets;
using Modelo;
using System.Collections.ObjectModel;
using static Entidades.Tickets.Tecnico;

namespace Controladora
{
    public class ControladoraTecnicos
    {
        private Context context;

        private static ControladoraTecnicos instancia;

        public static ControladoraTecnicos Instancia
        {
            get
            {
                if (instancia == null)
                {
                    instancia = new ControladoraTecnicos();
                }
                return instancia;
            }
        }

        ControladoraTecnicos()
        {
            context = new Context();
        }

        public ReadOnlyCollection<Tecnico> RecuperarTecnicos()
        {
            try
            {
                return context.Tecnicos.ToList().AsReadOnly();
            }

            catch (Exception)
            {
                throw;
            }
        }
        public void AgregarTecnico(string nombre, string apellido, int dni, string correo, EnumEspecialidad especialidad)
        {
            var tecnicoEncontrado = context.Tecnicos.Find(dni);

            var tecnico = new Tecnico
            {
                Nombre = nombre,
                Apellido = apellido,
                Dni = dni,
                Correo = correo,
                Especialidad = especialidad
            };

            context.Tecnicos.Add(tecnico);
            context.SaveChanges();
        }
        public void ModificarTecnico(int id, string nombre, string apellido, int dni, string correo, EnumEspecialidad especialidad)
        {
            var tecnicoEncontrado = context.Tecnicos.Find(id);

            if (tecnicoEncontrado == null)
            {
                throw new Exception("El tecnico no existe en la base de datos.");
            }

            tecnicoEncontrado.Nombre = nombre;
            tecnicoEncontrado.Apellido = apellido;
            tecnicoEncontrado.Dni = dni;
            tecnicoEncontrado.Correo = correo;
            tecnicoEncontrado.Especialidad = especialidad;

            context.SaveChanges();
        }

        public string EliminarTecnico(int id)
        {
            try
            {
                var tecnicoEncontrado = context.Tecnicos.Find(id);

                if (tecnicoEncontrado == null)
                {
                    return $"No se pudo eliminar el tecnico. No existe.";
                }

                context.Tecnicos.Remove(tecnicoEncontrado);
                context.SaveChanges();

                return $"El tecnico ha sido eliminado correctamente";
            }
            catch (Exception ex)
            {
                return $"Ocurrió un error al eliminar el tecnico: {ex.Message}";
            }
        }
    }
}
