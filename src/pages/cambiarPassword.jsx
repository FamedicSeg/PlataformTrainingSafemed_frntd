import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/cambiarPassword.css';

export default function CambiarPassword() {
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [showNuevaPassword, setShowNuevaPassword] = useState(false); // ✅ Estado para nueva contraseña
    const [showConfirmarPassword, setShowConfirmarPassword] = useState(false); // ✅ Estado para confirmar contraseña
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('admin_proceso_user');
        if (!userData){
            navigate('/admin/login');
            return;
        }
        const parsedUser = JSON.parse(userData);

        if (!parsedUser.primer_login) {
            const rutas = {
                "ADMIN_PROCESO": "/admin/principal",
            };
            navigate(rutas[parsedUser.rol] || "/admin/principal");
            return;
        }
        setUser(parsedUser);
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (nuevaPassword.length < 6){
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (nuevaPassword !== confirmarPassword){
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (!user) {
            setError('Usuario no encontrado. Por favor, inicia sesión nuevamente.');
            return;
        }

        setCargando(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/procesos/cambiar-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}`,
                },
                body: JSON.stringify({ 
                    newPassword: nuevaPassword 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Error al cambiar la contraseña');
            }

            const _data = await response.json();
            
            // Actualizar usuario en localStorage con primer_login en false
            const usuarioActualizado = { ...user, primer_login: false };
            localStorage.setItem('admin_proceso_user', JSON.stringify(usuarioActualizado));
            
            alert('¡Contraseña cambiada exitosamente!');
            
            // Redirigir según rol
            const rutas = {
                "ADMIN_PROCESO": "/admin/principal",
            };
            navigate(rutas[user.rol] || "/admin/principal");
        } catch (err) {
            console.error('Error cambiando contraseña:', err);
            setError(err.message || 'Error al cambiar la contraseña. Intenta nuevamente.');
        } finally {
            setCargando(false);
        }
    };

    const handleCancel = () => {
        //si cancela, cerrar sesión
        localStorage.removeItem('admin_proceso_user');
        navigate('/admin/login');
    };

    if (!user) {
        return (
            <div className="cambiar-password-container">
                <div className="cambiar-password-card">
                    <p>Cargando...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="cambiar-password-container">
            <div className="cambiar-password-card">
                <div className="cambiar-password-header">
                    <h2>Cambio de Contraseña</h2>
                    <p className="primer-login-mensaje">
                        Es tu primera vez iniciando sesión, por seguridad debes cambiar tu contraseña antes de continuar.
                    </p>
                    <div className="usuario-info">
                        <p><strong>Usuario:</strong> {user?.nombre || 'N/A'}</p>
                        <p><strong>Rol:</strong> {user?.rol || 'N/A'}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    
                    {/* ✅ CAMPO NUEVA CONTRASEÑA CON ICONO */}
                    <div className="form-group">
                        <label htmlFor="nuevaPassword">Nueva Contraseña:</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showNuevaPassword ? "text" : "password"}
                                id="nuevaPassword"
                                value={nuevaPassword}
                                onChange={(e) => setNuevaPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                autoFocus
                                disabled={cargando}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowNuevaPassword(!showNuevaPassword)}
                                disabled={cargando}
                            >
                                {showNuevaPassword ? "🔓" : "🔑"}
                            </button>
                        </div>
                        <small className="password-hint">
                            Usa al menos 6 caracteres
                        </small>
                    </div>

                    {/* ✅ CAMPO CONFIRMAR CONTRASEÑA CON ICONO */}
                    <div className="form-group">
                        <label htmlFor="confirmarPassword">Confirmar Contraseña:</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showConfirmarPassword ? "text" : "password"}
                                id="confirmarPassword"
                                value={confirmarPassword}
                                onChange={(e) => setConfirmarPassword(e.target.value)}
                                placeholder="Repite la contraseña"
                                required
                                disabled={cargando}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmarPassword(!showConfirmarPassword)}
                                disabled={cargando}
                            >
                                {showConfirmarPassword ? "🔓" : "🔑"}
                            </button>
                        </div>
                    </div>

                    <div className="password-requirements">
                        <p className={`requirement ${nuevaPassword.length >= 6 ? 'valid' : ''}`}>
                            ✓ Mínimo 6 caracteres
                        </p>
                        <p className={`requirement ${nuevaPassword && nuevaPassword === confirmarPassword ? 'valid' : ''}`}>
                            ✓ Las contraseñas coinciden
                        </p>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn-cambiar"
                            disabled={cargando}
                        >
                            {cargando ? 'CAMBIANDO...' : 'CAMBIAR CONTRASEÑA'}
                        </button>
                        <button 
                            type="button" 
                            className="btn-cancelar"
                            onClick={handleCancel}
                            disabled={cargando}
                        >
                            CANCELAR
                        </button>
                    </div>
                </form>
                <div className="cambiar-password-footer">
                    <p>⚠️ Recuerda: Tu nueva contraseña debe ser fácil de recordar pero difícil de adivinar.</p>
                </div>
            </div>
        </div>
    );
}