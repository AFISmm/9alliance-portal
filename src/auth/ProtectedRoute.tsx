import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useDemo } from '../context/DemoContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isDemoMode }    = useDemo();

  if (loading && !isDemoMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-900">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !isDemoMode) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
