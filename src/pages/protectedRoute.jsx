// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("admin_token");
  
  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  // Si hay token, mostrar el componente protegido
  return children;
}