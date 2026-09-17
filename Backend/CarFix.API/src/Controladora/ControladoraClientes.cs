using Entidades.Tickets;
using Modelo;
using System.Collections.ObjectModel;

namespace Controladora
{
    public class ControladoraClientes
    {
        private Context context;

        //Campo estatico que almacena la instancia unica de la clase
        private static ControladoraClientes instancia;

        public static ControladoraClientes Instancia
        {
            get
            {
                if (instancia == null)
                {
                    instancia = new ControladoraClientes();
                }
                return instancia;
            }
        }

        ControladoraClientes()
        {
            context = new Context();
        }

        public ReadOnlyCollection<Cliente> RecuperarClientes()
        {
            try
            {
                return context.Clientes.ToList().AsReadOnly();
            }

            catch (Exception)
            {
                throw;
            }
        }

        public void AgregarCliente(string nombre, string apellido, int dni, string correo, int telefono)
        {
            var clienteEncontrado = context.Clientes.Find(dni);

            var cliente = new Cliente
            {
                Nombre = nombre,
                Apellido = apellido,
                Dni = dni,
                Correo = correo,
                Telefono = telefono
            };

            context.Clientes.Add(cliente);
            context.SaveChanges();
        }

        public void ModificarCliente(int id, string nombre, string apellido, int dni, string correo, int telefono)
        {
            var clienteEncontrado = context.Clientes.Find(id);

            if (clienteEncontrado == null)
            {
                throw new Exception("El cliente no existe en la base de datos.");
            }

            clienteEncontrado.Nombre = nombre;
            clienteEncontrado.Apellido = apellido;
            clienteEncontrado.Dni = dni;
            clienteEncontrado.Correo = correo;
            clienteEncontrado.Telefono = telefono;

            context.SaveChanges();
        }

        public string EliminarCliente(int id)
        {
            try
            {
                var clienteEncontrado = context.Clientes.Find(id);

                if (clienteEncontrado == null)
                {
                    return $"No se pudo eliminar el cliente. No existe.";
                }

                context.Clientes.Remove(clienteEncontrado);
                context.SaveChanges();

                return $"El cliente ha sido eliminado correctamente";
            }
            catch (Exception ex)
            { 
                return $"Ocurrió un error al eliminar el cliente: {ex.Message}";
            }
        }
    }
}
