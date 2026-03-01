import { loginService } from '@/features/auth/login/services/login.service';
import React, { createContext, useEffect, useState } from 'react';

type User = { id: string; email: string; roleId: number };
type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // This call sends the HttpOnly cookie automatically
        const response = await loginService.checkSession();
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData: User) => setUser(userData);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
      }}
    >
      {/* Prevent rendering the app until the session check is finished */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);

  // Ensures that useAuth is only used within components wrapped by AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
