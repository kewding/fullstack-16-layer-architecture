import React, { createContext, useContext, useState } from 'react';

//authentication type initialization
type AuthContextType = {
  isAuthenticated: boolean;
};

//creates state handling for null
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider(
  { children }: { children: React.ReactNode } /*tells the component that it accepts children*/,
) {
  const [isAuthenticated] = useState(true);

  return <AuthContext.Provider value={{ isAuthenticated }}>{children}</AuthContext.Provider>;
}

//handling missing AuthProvider when using AuthContext
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be inside AuthProvider');
  }

  return context;
}
