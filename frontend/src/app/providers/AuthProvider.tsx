import { loginService } from '@/features/auth/login/services/login.service';
import React, { createContext, useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  roleId: number;
  firstName: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await loginService.checkSession();
        if (response.success && response.data) {
          // remap snake_case from /api/auth/me to camelCase
          setUser({
            id: response.data.id,
            email: response.data.email,
            roleId: response.data.role_id,
            firstName: response.data.first_name,
          });
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
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
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
