using Entidades.Tickets;
using Microsoft.EntityFrameworkCore;
using Modelo;
using System.Collections.ObjectModel;

namespace Controladora
{
    public class ControladoraVehiculos
    {
        private Context context;

        private static ControladoraVehiculos instancia;

        public static ControladoraVehiculos Instancia
        {
            get
            {
                if (instancia == null)
                {
                    instancia = new ControladoraVehiculos();
                }
                return instancia;
            }
        }

        ControladoraVehiculos()
        {
            context = new Context();
        }

        public ReadOnlyCollection<Vehiculo> RecuperarVehiculos()
        {
            try
            {
                return context.Vehiculos
                              .Include(v => v.Dueño) // Cargar la relación Cliente (Dueño)
                              .ToList().AsReadOnly();
            }

            catch (Exception)
            {
                throw;
            }
        }

        public void AgregarVehiculo(int clienteId, string marca, string modelo, int año, string dominio)
        {
            var cliente = context.Clientes.Find(clienteId);

            if (cliente == null)
            {
                throw new Exception("Uno de los elementos seleccionados no existe en la base de datos.");
            }

            var vehiculo = new Vehiculo
            {
                Dueño = cliente,
                Marca = marca,
                Modelo = modelo,
                Año = año,
                Dominio = dominio
            };

            context.Vehiculos.Add(vehiculo);
            context.SaveChanges();
        }

        public void ModificarVehiculo(int vehiculoID, int clienteId, string marca, string modelo, int año, string dominio)
        {
            var vehiculo = context.Vehiculos.Find(vehiculoID);

            if (vehiculo == null)
            {
                throw new Exception("El vehiculo no existe en la base de datos.");
            }

            var cliente = context.Clientes.Find(clienteId);

            if (vehiculo == null || cliente == null)
            {
                throw new Exception("Uno de los elementos seleccionados no existe en la base de datos.");
            }

            vehiculo.Dueño = cliente;
            vehiculo.Marca = marca;
            vehiculo.Modelo = modelo;
            vehiculo.Año = año;
            vehiculo.Dominio = dominio;

            context.SaveChanges();
        }

        public string EliminarVehiculo(int vehiculoId)
        {
            try
            {
                var vehiculoEncontrado = context.Vehiculos.Find(vehiculoId);

                if (vehiculoEncontrado == null)
                {
                    return $"No se pudo eliminar el vehiculo. No existe.";
                }

                context.Vehiculos.Remove(vehiculoEncontrado);
                context.SaveChanges();

                return $"El vehiculo ha sido eliminado correctamente";
            }
            catch (Exception ex)
            {
                return $"Ocurrió un error al eliminar el vehiculo: {ex.Message}";
            }
        }
    }
}
