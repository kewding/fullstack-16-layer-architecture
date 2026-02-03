import React, { createContext, useContext, useState } from "react";

type AuthContextType = {
    isAuthenticated: boolean;
};

const AuthContext = createContext <AuthContextType | null> (null);

export function AuthProvider({children}: { children: React.ReactNode}) {
    const [isAuthenticated] = useState(false);

    return (
        <AuthContext.Provider value = {{ isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}