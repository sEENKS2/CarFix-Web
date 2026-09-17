using Entidades.Compras;
using Entidades.Core;
using Entidades.Tickets;
using Entidades.Validaciones;
using Entidades.Facturacion;
using Entidades.Turnos;
using Microsoft.EntityFrameworkCore;

namespace Modelo
{
    public class Context : DbContext
    {
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Tecnico> Tecnicos { get; set; }
        public DbSet<Vehiculo> Vehiculos { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Grupo> Grupos { get; set; }
        public DbSet<Permiso> Permisos { get; set; }
        public DbSet<AuditoriaLogin> AuditoriasLogin { get; set; }
        public DbSet<Proveedor> Proveedores { get; set; }
        public DbSet<Producto> Productos { get; set; }
        public DbSet<OrdenCompra> OrdenesCompra { get; set; }
        public DbSet<DetalleOrdenCompra> DetallesOrdenesCompra { get; set; }
        public DbSet<AuditoriaOrdenesCompra> AuditoriasOrdenesCompra { get; set; }
        public DbSet<AuditoriaTickets> AuditoriasTickets { get; set; }
        public DbSet<Factura> Facturas { get; set; }
        public DbSet<DetalleFactura> DetallesFactura { get; set; }
        public DbSet<Pago> Pagos { get; set; }
        public DbSet<MovimientoStock> MovimientosStock { get; set; }
        public DbSet<HistorialDescripcion> HistorialesDescripciones { get; set; }
        public DbSet<Turno> Turnos { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer(@"Server=.\SQLEXPRESS; Database=MiBaseDeDatos; Trusted_Connection=True; TrustServerCertificate=True;").EnableSensitiveDataLogging();
        }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            var cliente1 = new Cliente { Id = 1, Nombre = "Sofia", Apellido = "Mendoza", Dni = 38765432, Correo = "sofia.mendoza@example.com", Telefono = 11223, };
            var cliente2 = new Cliente { Id = 2, Nombre = "Juan", Apellido = "Ramirez", Dni = 27654321, Correo = "juan.ramirez@example.com", Telefono = 11667, };
            var cliente3 = new Cliente { Id = 3, Nombre = "Ana", Apellido = "Flores", Dni = 49876543, Correo = "ana.flores@example.com", Telefono = 11990, };
            modelBuilder.Entity<Cliente>().HasData(cliente1, cliente2, cliente3);

            var tecnico1 = new Tecnico { Id = 1, Nombre = "Juan", Apellido = "Pérez", Dni = 12345678, Correo = "juan.perez@tecnico.com", Especialidad = EnumEspecialidad.Motorista };
            var tecnico2 = new Tecnico { Id = 2, Nombre = "María", Apellido = "Sánchez", Dni = 98765432, Correo = "maria.sanchez@tecnico.com", Especialidad = EnumEspecialidad.Electricista };
            var tecnico3 = new Tecnico { Id = 3, Nombre = "Carlos", Apellido = "López", Dni = 55555555, Correo = "carlos.lopez@tecnico.com", Especialidad = EnumEspecialidad.Chapista };
            modelBuilder.Entity<Tecnico>().HasData(tecnico1, tecnico2, tecnico3);

            var vehiculo1 = new Vehiculo { Id = 1, Marca = "Ford", Modelo = "Fiesta", Año = 2020, Dominio = "ABC123D", ClienteId = cliente1.Id };
            var vehiculo2 = new Vehiculo { Id = 2, Marca = "Chevrolet", Modelo = "Cruze", Año = 2018, Dominio = "XYZ789W", ClienteId = cliente2.Id };
            var vehiculo3 = new Vehiculo { Id = 3, Marca = "Toyota", Modelo = "Corolla", Año = 2022, Dominio = "LMN456K", ClienteId = cliente3.Id };
            modelBuilder.Entity<Vehiculo>().HasData(vehiculo1, vehiculo2, vehiculo3);

            var ticket1 = new Ticket { Id = 1, Descripcion = "Cambio de aceite y filtro", FechaCreacion = new DateTime(2023, 02, 12), Estado = EnumEstados.Asignado, ClienteId = cliente1.Id, VehiculoId = vehiculo1.Id, TecnicoId = tecnico1.Id };
            var ticket2 = new Ticket { Id = 2, Descripcion = "Reparación de parabrisas", FechaCreacion = new DateTime(2023, 02, 12), Estado = EnumEstados.Asignado, ClienteId = cliente2.Id, VehiculoId = vehiculo2.Id, TecnicoId = tecnico3.Id };
            var ticket3 = new Ticket { Id = 3, Descripcion = "Falla en instrumental", FechaCreacion = new DateTime(2023, 02, 12), Estado = EnumEstados.Asignado, ClienteId = cliente3.Id, VehiculoId = vehiculo3.Id, TecnicoId = tecnico2.Id };
            modelBuilder.Entity<Ticket>().HasData(ticket1, ticket2, ticket3);

            var proveedor1 = new Proveedor { Id = 1, Nombre = "Repuestos SA", Telefono = "123456789", Email = "ventas@repuestos.com", Direccion = "Av. Principal 123", Cuit = "20-12345678-9", Activo = true };
            var proveedor2 = new Proveedor { Id = 2, Nombre = "AutoPartes SRL", Telefono = "987654321", Email = "pedidos@autopartes.com", Direccion = "Calle Secundaria 456", Cuit = "20-98765432-1", Activo = true };
            modelBuilder.Entity<Proveedor>().HasData(proveedor1, proveedor2);

            var producto1 = new Producto { Id = 1, Codigo = "P001", Nombre = "Filtro de Aceite", Descripcion = "Filtro de aceite universal", Categoria = "Filtros", PrecioUnitario = 15.50m, StockMinimo = 10, StockActual = 25, Activo = true };
            var producto2 = new Producto { Id = 2, Codigo = "P002", Nombre = "Aceite Motor 5W30", Descripcion = "Aceite sintético 5W30", Categoria = "Lubricantes", PrecioUnitario = 45.00m, StockMinimo = 5, StockActual = 12, Activo = true };
            var producto3 = new Producto { Id = 3, Codigo = "P003", Nombre = "Pastillas de Freno", Descripcion = "Pastillas delanteras universales", Categoria = "Frenos", PrecioUnitario = 85.00m, StockMinimo = 8, StockActual = 15, Activo = true };
            modelBuilder.Entity<Producto>().HasData(producto1, producto2, producto3);

            //Datos iniciales de seguridad.
            var adminGroup = new Grupo { Id = 1, Nombre = "Administradores", Descripcion = "Acceso total al sistema" };
            var operatorGroup = new Grupo { Id = 2, Nombre = "Operadores", Descripcion = "Acceso limitado para operaciones diarias" };
            var technicianGroup = new Grupo { Id = 3, Nombre = "Tecnicos", Descripcion = "Acceso para tecnicos del taller" };
            modelBuilder.Entity<Grupo>().HasData(adminGroup, operatorGroup, technicianGroup);

            // Permisos
            var permisos = new[]
            {
                new Permiso { Id = 1, Nombre = "CLIENTES_VER", Descripcion = "Ver clientes", Modulo = "Clientes" },
                new Permiso { Id = 2, Nombre = "CLIENTES_CREAR", Descripcion = "Crear clientes", Modulo = "Clientes" },
                new Permiso { Id = 3, Nombre = "CLIENTES_EDITAR", Descripcion = "Editar clientes", Modulo = "Clientes" },
                new Permiso { Id = 4, Nombre = "CLIENTES_ELIMINAR", Descripcion = "Eliminar clientes", Modulo = "Clientes" },
                new Permiso { Id = 5, Nombre = "TECNICOS_VER", Descripcion = "Ver tecnicos", Modulo = "Tecnicos" },
                new Permiso { Id = 6, Nombre = "TECNICOS_CREAR", Descripcion = "Crear tecnicos", Modulo = "Tecnicos" },
                new Permiso { Id = 7, Nombre = "TECNICOS_EDITAR", Descripcion = "Editar tecnicos", Modulo = "Tecnicos" },
                new Permiso { Id = 8, Nombre = "TECNICOS_ELIMINAR", Descripcion = "Eliminar tecnicos", Modulo = "Tecnicos" },
                new Permiso { Id = 9, Nombre = "VEHICULOS_VER", Descripcion = "Ver vehiculos", Modulo = "Vehiculos" },
                new Permiso { Id = 10, Nombre = "VEHICULOS_CREAR", Descripcion = "Crear vehiculos", Modulo = "Vehiculos" },
                new Permiso { Id = 11, Nombre = "VEHICULOS_EDITAR", Descripcion = "Editar vehiculos", Modulo = "Vehiculos" },
                new Permiso { Id = 12, Nombre = "VEHICULOS_ELIMINAR", Descripcion = "Eliminar vehiculos", Modulo = "Vehiculos" },
                new Permiso { Id = 13, Nombre = "TICKETS_VER", Descripcion = "Ver tickets", Modulo = "Tickets" },
                new Permiso { Id = 14, Nombre = "TICKETS_CREAR", Descripcion = "Crear tickets", Modulo = "Tickets" },
                new Permiso { Id = 15, Nombre = "TICKETS_EDITAR", Descripcion = "Editar tickets", Modulo = "Tickets" },
                new Permiso { Id = 16, Nombre = "TICKETS_ELIMINAR", Descripcion = "Eliminar tickets", Modulo = "Tickets" },
                new Permiso { Id = 17, Nombre = "ADMIN_USUARIOS", Descripcion = "Administrar usuarios", Modulo = "Administracion" },
                new Permiso { Id = 18, Nombre = "ADMIN_GRUPOS", Descripcion = "Administrar grupos", Modulo = "Administracion" },
                new Permiso { Id = 19, Nombre = "ADMIN_PERMISOS", Descripcion = "Administrar permisos", Modulo = "Administracion" },
                new Permiso { Id = 20, Nombre = "COMPRAS_VER", Descripcion = "Ver órdenes de compra", Modulo = "Compras" },
                new Permiso { Id = 21, Nombre = "COMPRAS_CREAR", Descripcion = "Crear órdenes de compra", Modulo = "Compras" },
                new Permiso { Id = 22, Nombre = "COMPRAS_EDITAR", Descripcion = "Editar órdenes de compra", Modulo = "Compras" },
                new Permiso { Id = 23, Nombre = "COMPRAS_ELIMINAR", Descripcion = "Eliminar órdenes de compra", Modulo = "Compras" },
                new Permiso { Id = 24, Nombre = "PROVEEDORES_VER", Descripcion = "Ver proveedores", Modulo = "Compras" },
                new Permiso { Id = 25, Nombre = "PROVEEDORES_CREAR", Descripcion = "Crear proveedores", Modulo = "Compras" },
                new Permiso { Id = 26, Nombre = "PRODUCTOS_VER", Descripcion = "Ver productos", Modulo = "Compras" },
                new Permiso { Id = 27, Nombre = "PRODUCTOS_CREAR", Descripcion = "Crear productos", Modulo = "Compras" },
                new Permiso { Id = 28, Nombre = "TICKETS_MODIFICAR_CLIENTE", Descripcion = "Modificar cliente en tickets", Modulo = "Tickets" },
                new Permiso { Id = 29, Nombre = "TICKETS_MODIFICAR_VEHICULO", Descripcion = "Modificar vehículo en tickets", Modulo = "Tickets" }
            };
            modelBuilder.Entity<Permiso>().HasData(permisos);

            var adminPermisos = new[]
            {
                new { GruposId = 1, PermisosId = 1 },   // CLIENTES_VER
                new { GruposId = 1, PermisosId = 2 },   // CLIENTES_CREAR
                new { GruposId = 1, PermisosId = 3 },   // CLIENTES_EDITAR
                new { GruposId = 1, PermisosId = 4 },   // CLIENTES_ELIMINAR
                new { GruposId = 1, PermisosId = 5 },   // TECNICOS_VER
                new { GruposId = 1, PermisosId = 6 },   // TECNICOS_CREAR
                new { GruposId = 1, PermisosId = 7 },   // TECNICOS_EDITAR
                new { GruposId = 1, PermisosId = 8 },   // TECNICOS_ELIMINAR
                new { GruposId = 1, PermisosId = 9 },   // VEHICULOS_VER
                new { GruposId = 1, PermisosId = 10 },  // VEHICULOS_CREAR
                new { GruposId = 1, PermisosId = 11 },  // VEHICULOS_EDITAR
                new { GruposId = 1, PermisosId = 12 },  // VEHICULOS_ELIMINAR
                new { GruposId = 1, PermisosId = 13 },  // TICKETS_VER
                new { GruposId = 1, PermisosId = 14 },  // TICKETS_CREAR
                new { GruposId = 1, PermisosId = 15 },  // TICKETS_EDITAR
                new { GruposId = 1, PermisosId = 16 },  // TICKETS_ELIMINAR
                new { GruposId = 1, PermisosId = 17 },  // ADMIN_USUARIOS
                new { GruposId = 1, PermisosId = 18 },  // ADMIN_GRUPOS
                new { GruposId = 1, PermisosId = 19 },   // ADMIN_PERMISOS
                new { GruposId = 1, PermisosId = 20 },  // COMPRAS_VER
                new { GruposId = 1, PermisosId = 21 },  // COMPRAS_CREAR
                new { GruposId = 1, PermisosId = 22 },  // COMPRAS_EDITAR
                new { GruposId = 1, PermisosId = 23 },  // COMPRAS_ELIMINAR
                new { GruposId = 1, PermisosId = 24 },  // PROVEEDORES_VER
                new { GruposId = 1, PermisosId = 25 },  // PROVEEDORES_CREAR
                new { GruposId = 1, PermisosId = 26 },  // PRODUCTOS_VER
                new { GruposId = 1, PermisosId = 27 },  // PRODUCTOS_CREAR
                new { GruposId = 1, PermisosId = 28 }, // TICKETS_MODIFICAR_CLIENTES
                new { GruposId = 1, PermisosId = 29 }, // TICKETS_MODIFICAR_VEHICULOS
            };

            modelBuilder.Entity("GrupoPermisos").HasData(adminPermisos);

            var permisosTecnicos = new[]
            {
                new { GruposId = 3, PermisosId = 13 },  // TICKETS_VER
                new { GruposId = 3, PermisosId = 14 },  // TICKETS_CREAR
                new { GruposId = 3, PermisosId = 15 },  // TICKETS_EDITAR
                new { GruposId = 3, PermisosId = 16 }   // TICKETS_ELIMINAR
            };

            modelBuilder.Entity("GrupoPermisos").HasData(permisosTecnicos);

            var permisosOperadores = new[]
            {
                new { GruposId = 2, PermisosId = 1 },   // CLIENTES_VER
                new { GruposId = 2, PermisosId = 2 },   // CLIENTES_CREAR
                new { GruposId = 2, PermisosId = 3 },   // CLIENTES_EDITAR
                new { GruposId = 2, PermisosId = 4 },   // CLIENTES_ELIMINAR
                new { GruposId = 2, PermisosId = 9 },   // VEHICULOS_VER
                new { GruposId = 2, PermisosId = 10 },  // VEHICULOS_CREAR
                new { GruposId = 2, PermisosId = 11 },  // VEHICULOS_EDITAR
                new { GruposId = 2, PermisosId = 12 },  // VEHICULOS_ELIMINAR
                new { GruposId = 2, PermisosId = 13 },  // TICKETS_VER
                new { GruposId = 2, PermisosId = 14 },  // TICKETS_CREAR
                new { GruposId = 2, PermisosId = 15 },  // TICKETS_EDITAR
                new { GruposId = 2, PermisosId = 16 },  // TICKETS_ELIMINAR
                new { GruposId = 2, PermisosId = 28 }, // TICKETS_MODIFICAR_CLIENTES
                new { GruposId = 2, PermisosId = 29 }, // TICKETS_MODIFICAR_VEHICULOS
            };

            modelBuilder.Entity("GrupoPermisos").HasData(permisosOperadores);

            modelBuilder.Entity<Vehiculo>()
                .HasOne(v => v.Dueño)
                .WithMany()
                .HasForeignKey(v => v.ClienteId);

            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Cliente)
                .WithMany()
                .HasForeignKey(t => t.ClienteId);

            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Vehiculo)
                .WithMany()
                .HasForeignKey(t => t.VehiculoId);

            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Tecnico)
                .WithMany()
                .HasForeignKey(t => t.TecnicoId);

            modelBuilder.Entity<Usuario>()
                .HasMany(u => u.Grupos)
                .WithMany(g => g.Usuarios)
                .UsingEntity<Dictionary<string, object>>(
                    "UsuarioGrupos",
                    j => j.HasOne<Grupo>().WithMany().HasForeignKey("GruposId"),
                    j => j.HasOne<Usuario>().WithMany().HasForeignKey("UsuariosId"),
                    j =>
                    {
                        j.HasKey("UsuariosId", "GruposId");
                        j.ToTable("UsuarioGrupos");
                    });

            modelBuilder.Entity<Grupo>()
                .HasMany(g => g.Permisos)
                .WithMany(p => p.Grupos)
                .UsingEntity<Dictionary<string, object>>(
                    "GrupoPermisos",
                    j => j.HasOne<Permiso>().WithMany().HasForeignKey("PermisosId"),
                    j => j.HasOne<Grupo>().WithMany().HasForeignKey("GruposId"),
                    j =>
                    {
                        j.HasKey("GruposId", "PermisosId");
                        j.ToTable("GrupoPermisos");
                    });

            modelBuilder.Entity<AuditoriaLogin>()
                .HasOne(a => a.Usuario)
                .WithMany()
                .HasForeignKey(a => a.UsuarioId);

            modelBuilder.Entity<OrdenCompra>()
            .HasOne(o => o.Proveedor)
            .WithMany()
            .HasForeignKey(o => o.ProveedorId);

            modelBuilder.Entity<DetalleOrdenCompra>()
                .HasOne(d => d.OrdenCompra)
                .WithMany(o => o.Detalles)
                .HasForeignKey(d => d.OrdenCompraId);

            modelBuilder.Entity<DetalleOrdenCompra>()
                .HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId);

            modelBuilder.Entity<AuditoriaOrdenesCompra>()
            .HasOne(a => a.Usuario)
            .WithMany()
            .HasForeignKey(a => a.UsuarioId);

            modelBuilder.Entity<AuditoriaTickets>()
                .HasOne(a => a.Usuario)
                .WithMany()
                .HasForeignKey(a => a.UsuarioId);

            // Configuracion Indices
            modelBuilder.Entity<AuditoriaOrdenesCompra>()
                .HasIndex(a => a.OrdenCompraId);

            modelBuilder.Entity<AuditoriaOrdenesCompra>()
                .HasIndex(a => a.FechaHora);

            modelBuilder.Entity<AuditoriaOrdenesCompra>()
                .HasIndex(a => a.Accion);

            modelBuilder.Entity<AuditoriaTickets>()
                .HasIndex(a => a.TicketId);

            modelBuilder.Entity<AuditoriaTickets>()
                .HasIndex(a => a.FechaHora);

            modelBuilder.Entity<AuditoriaTickets>()
                .HasIndex(a => a.Accion);

            modelBuilder.Entity<AuditoriaOrdenesCompra>()
                .Property(a => a.ValorAnterior)
                .HasMaxLength(1000);

            modelBuilder.Entity<AuditoriaOrdenesCompra>()
                .Property(a => a.ValorNuevo)
                .HasMaxLength(1000);

            modelBuilder.Entity<AuditoriaOrdenesCompra>()
                .Property(a => a.Observaciones)
                .HasMaxLength(500);

            modelBuilder.Entity<AuditoriaTickets>()
                .Property(a => a.ValorAnterior)
                .HasMaxLength(1000);

            modelBuilder.Entity<AuditoriaTickets>()
                .Property(a => a.ValorNuevo)
                .HasMaxLength(1000);

            modelBuilder.Entity<AuditoriaTickets>()
                .Property(a => a.Observaciones)
                .HasMaxLength(500);

            modelBuilder.Entity<HistorialDescripcion>()
                .HasOne(h => h.Ticket)
                .WithMany()
                .HasForeignKey(h => h.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<HistorialDescripcion>()
                .HasIndex(h => h.TicketId);

            modelBuilder.Entity<HistorialDescripcion>()
                .HasIndex(h => h.FechaCambio);

            // Usuario administrador
            var adminUser = new Usuario
            {
                Id = 1,
                NombreUsuario = "admin",
                Email = "admin@carfix.com",
                FechaCreacion = new DateTime(2024, 1, 1),
                Activo = true
            };
            adminUser.EstablecerPassword("admin123");
            modelBuilder.Entity<Usuario>().HasData(new
            {
                Id = adminUser.Id,
                NombreUsuario = adminUser.NombreUsuario,
                Email = adminUser.Email,
                PasswordHash = adminUser.PasswordHash,
                FechaCreacion = adminUser.FechaCreacion,
                UltimoAcceso = (DateTime?)null,
                Activo = adminUser.Activo
            });

            // Usuario Operador
            var operadorUser = new Usuario
            {
                Id = 2,
                NombreUsuario = "operador",
                Email = "operador@carfix.com",
                FechaCreacion = new DateTime(2024, 1, 1),
                Activo = true
            };
            operadorUser.EstablecerPassword("operador123");
            modelBuilder.Entity<Usuario>().HasData(new
            {
                Id = operadorUser.Id,
                NombreUsuario = operadorUser.NombreUsuario,
                Email = operadorUser.Email,
                PasswordHash = operadorUser.PasswordHash,
                FechaCreacion = operadorUser.FechaCreacion,
                UltimoAcceso = (DateTime?)null,
                Activo = operadorUser.Activo
            });

            // Usuario Técnico
            var tecnicoUser = new Usuario
            {
                Id = 3,
                NombreUsuario = "tecnico",
                Email = "tecnico@carfix.com",
                FechaCreacion = new DateTime(2024, 1, 1),
                Activo = true
            };
            tecnicoUser.EstablecerPassword("tecnico123");
            modelBuilder.Entity<Usuario>().HasData(new
            {
                Id = tecnicoUser.Id,
                NombreUsuario = tecnicoUser.NombreUsuario,
                Email = tecnicoUser.Email,
                PasswordHash = tecnicoUser.PasswordHash,
                FechaCreacion = tecnicoUser.FechaCreacion,
                UltimoAcceso = (DateTime?)null,
                Activo = tecnicoUser.Activo
            });

            modelBuilder.Entity("UsuarioGrupos").HasData(new { UsuariosId = 1, GruposId = 1 });
            modelBuilder.Entity("UsuarioGrupos").HasData(new { UsuariosId = 2, GruposId = 2 });
            modelBuilder.Entity("UsuarioGrupos").HasData(new { UsuariosId = 3, GruposId = 3 });
        }
    }
}
