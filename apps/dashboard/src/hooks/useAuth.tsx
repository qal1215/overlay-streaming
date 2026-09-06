import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  secret: string | null;
  login: (secret: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function DevAdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    const storedSecret = localStorage.getItem('DEV_ADMIN_SECRET');
    if (storedSecret) {
      setSecret(storedSecret);
    }
  }, []);

  const login = (newSecret: string) => {
    localStorage.setItem('DEV_ADMIN_SECRET', newSecret);
    setSecret(newSecret);
  };

  const logout = () => {
    localStorage.removeItem('DEV_ADMIN_SECRET');
    setSecret(null);
  };

  return (
    <AuthContext.Provider value={{ secret, login, logout, isAuthenticated: !!secret }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useDevAdminAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useDevAdminAuth must be used within a DevAdminAuthProvider');
  }
  return context;
}
