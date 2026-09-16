import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Productos from './pages/Productos';
import Proveedores from './pages/Proveedores';
import OrdenesCompra from './pages/OrdenesCompra';
import Auditoria from './pages/Auditoria';
import ClientesVehiculos from './pages/ClientesVehiculos';
import SeguridadUsuarios from './pages/SeguridadUsuarios';
import Tecnicos from './pages/Tecnicos';

function RutaPrivada({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <RutaPrivada>
                <MainLayout />
              </RutaPrivada>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="productos" element={<Productos />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="ordenes-compra" element={<OrdenesCompra />} />
            <Route path="auditoria" element={<Auditoria />} />
            <Route path="tecnicos" element={<Tecnicos />} />
            <Route path="clientes-vehiculos" element={<ClientesVehiculos />} />
            <Route path="usuarios" element={<SeguridadUsuarios />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}