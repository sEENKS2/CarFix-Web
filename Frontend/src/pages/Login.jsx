import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(nombreUsuario, password);
      toast.success(`Bienvenido/a, ${nombreUsuario}`);
      navigate('/tickets', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Credenciales inválidas';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-badge">
            <Wrench size={32} />
          </div>
          <h2 className="login-title">CarFix</h2>
          <p className="login-subtitle">Gestión Integral de Taller</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              required
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              className="form-input"
              placeholder="admin"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-login-submit"
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}