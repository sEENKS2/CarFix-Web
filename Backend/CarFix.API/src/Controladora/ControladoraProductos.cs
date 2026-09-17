using Entidades.Compras;
using Microsoft.EntityFrameworkCore;
using Modelo;
using System.Collections.ObjectModel;

namespace Controladora
{
    public class ControladoraProductos
    {
        private Context context;
        private static ControladoraProductos instancia;

        public static ControladoraProductos Instancia
        {
            get
            {
                if (instancia == null)
                    instancia = new ControladoraProductos();
                return instancia;
            }
        }

        private ControladoraProductos()
        {
            context = new Context();
        }

        public ReadOnlyCollection<Producto> RecuperarProductos()
        {
            using (var db = new Context())
            {
                return db.Productos
                         .AsNoTracking() // <- Fuerza a leer los datos frescos directo del disco/DB
                         .ToList()
                         .AsReadOnly();
            }
        }

        public void AgregarProducto(string codigo, string nombre, string descripcion, string categoria,
            decimal precioUnitario, int stockMinimo, int stockActual)
        {
            var producto = new Producto
            {
                Codigo = codigo,
                Nombre = nombre,
                Descripcion = descripcion,
                Categoria = categoria,
                PrecioUnitario = precioUnitario,
                StockMinimo = stockMinimo,
                StockActual = stockActual,
                Activo = true
            };

            context.Productos.Add(producto);
            context.SaveChanges();
        }

        public void ModificarProducto(int id, string codigo, string nombre, string descripcion, string categoria,
            decimal precioUnitario, int stockMinimo, int stockActual)
        {
            var producto = context.Productos.Find(id);
            if (producto == null)
                throw new Exception("Producto no encontrado");

            producto.Codigo = codigo;
            producto.Nombre = nombre;
            producto.Descripcion = descripcion;
            producto.Categoria = categoria;
            producto.PrecioUnitario = precioUnitario;
            producto.StockMinimo = stockMinimo;
            producto.StockActual = stockActual;

            context.SaveChanges();
        }

        public void EliminarProducto(int id)
        {
            var producto = context.Productos.Find(id);
            if (producto == null)
                throw new Exception("Producto no encontrado");

            producto.Activo = false;
            context.SaveChanges();
        }
    }
}