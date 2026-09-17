using Entidades.Compras;
using Modelo;
using System.Collections.ObjectModel;

namespace Controladora
{
    public class ControladoraProveedores
    {
        private Context context;
        private static ControladoraProveedores instancia;

        public static ControladoraProveedores Instancia
        {
            get
            {
                if (instancia == null)
                    instancia = new ControladoraProveedores();
                return instancia;
            }
        }

        private ControladoraProveedores()
        {
            context = new Context();
        }

        public ReadOnlyCollection<Proveedor> RecuperarProveedores()
        {
            return context.Proveedores.Where(p => p.Activo).ToList().AsReadOnly();
        }

        public void AgregarProveedor(string nombre, string telefono, string email, string direccion, string cuit)
        {
            var proveedor = new Proveedor
            {
                Nombre = nombre,
                Telefono = telefono,
                Email = email,
                Direccion = direccion,
                Cuit = cuit,
                Activo = true
            };

            context.Proveedores.Add(proveedor);
            context.SaveChanges();
        }

        public void ModificarProveedor(int id, string nombre, string telefono, string email, string direccion, string cuit)
        {
            var proveedor = context.Proveedores.Find(id);
            if (proveedor == null)
                throw new Exception("Proveedor no encontrado");

            proveedor.Nombre = nombre;
            proveedor.Telefono = telefono;
            proveedor.Email = email;
            proveedor.Direccion = direccion;
            proveedor.Cuit = cuit;

            context.SaveChanges();
        }

        public void EliminarProveedor(int id)
        {
            var proveedor = context.Proveedores.Find(id);
            if (proveedor == null)
                throw new Exception("Proveedor no encontrado");

            proveedor.Activo = false;
            context.SaveChanges();
        }
    }
}
