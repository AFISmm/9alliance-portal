import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './layout/AppShell';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CalendarPage from './pages/CalendarPage';
import ClientesExternos from './pages/ClientesExternos';
import ClientDetail from './pages/ClientDetail';
import Calculadoras from './pages/Calculadoras';
import Indicadores from './pages/Indicadores';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="calendario" element={<CalendarPage />} />
            <Route path="clientes" element={<ClientesExternos />} />
            <Route path="cliente/:id" element={<ClientDetail />} />
            <Route path="calculadoras" element={<Calculadoras />} />
            <Route path="indicadores" element={<Indicadores />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
