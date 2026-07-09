import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider }    from './auth/AuthContext';
import { DemoProvider }    from './context/DemoContext';
import { LayoutProvider }  from './context/LayoutContext';
import { ProtectedRoute }  from './auth/ProtectedRoute';
import { AppShell }        from './layout/AppShell';
import Login               from './pages/Login';
import Register            from './pages/Register';
import InicioPage             from './pages/InicioPage';
import GestionEstrategicaPage from './pages/GestionEstrategicaPage';
import GestionComercialPage   from './pages/GestionComercialPage';
import GestionOperativaPage   from './pages/GestionOperativaPage';
import InformacionGeneralPage from './pages/InformacionGeneralPage';
import AlegraPage             from './pages/AlegraPage';
import ClientesExternos       from './pages/ClientesExternos';
import ClientDetail           from './pages/ClientDetail';
import PerfilPage             from './pages/PerfilPage';
import GestionUsuariosPage    from './pages/GestionUsuariosPage';
import GestionContablePage    from './pages/GestionContablePage';

function RedirectClienteToEmpresa() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/empresa/${id}`} replace />;
}

export default function App() {
  return (
    <LayoutProvider>
    <DemoProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/inicio" replace />} />

              <Route path="inicio"              element={<InicioPage />} />
              <Route path="gestion-estrategica" element={<GestionEstrategicaPage />} />
              <Route path="gestion-financiera"  element={<AlegraPage />} />
              <Route path="gestion-comercial"   element={<GestionComercialPage />} />
              <Route path="gestion-operativa"   element={<GestionOperativaPage />} />
              <Route path="informacion-general" element={<InformacionGeneralPage />} />
              <Route path="perfil"              element={<PerfilPage />} />
              <Route path="gestion-usuarios"   element={<GestionUsuariosPage />} />
              <Route path="gestion-contable"   element={<GestionContablePage />} />

              <Route path="empresas"    element={<ClientesExternos />} />
              <Route path="empresa/:id" element={<ClientDetail />} />

              {/* Redirecciones de rutas antiguas */}
              <Route path="calendario"   element={<Navigate to="/informacion-general?tab=calendario"   replace />} />
              <Route path="calculadoras" element={<Navigate to="/informacion-general?tab=calculadoras" replace />} />
              <Route path="indicadores"  element={<Navigate to="/informacion-general?tab=indicadores"  replace />} />
              <Route path="alegra"       element={<Navigate to="/gestion-financiera" replace />} />
              <Route path="clientes"     element={<Navigate to="/empresas" replace />} />
              <Route path="cliente/:id"  element={<RedirectClienteToEmpresa />} />
            </Route>

            <Route path="*" element={<Navigate to="/gestion-estrategica" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DemoProvider>
    </LayoutProvider>
  );
}
