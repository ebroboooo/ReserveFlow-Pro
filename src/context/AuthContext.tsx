import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, role: UserRole, branchId?: string | null) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_RANK: Record<UserRole, number> = {
  SuperAdmin: 4,
  BusinessOwner: 3,
  Receptionist: 2,
  Employee: 1
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("reserveflow_auth_session");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to restore auth session", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, role: UserRole, branchId: string | null = null): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 400));
    
    const user: User = {
      id: `usr-${role.toLowerCase()}-${Math.random().toString(36).substring(7)}`,
      orgId: "org-reserveflow-pro",
      email,
      role,
      name: email.split('@')[0].toUpperCase(),
      branchId: branchId ?? (role === 'Receptionist' || role === 'Employee' ? 'br-main' : null),
      isActive: true
    };

    setCurrentUser(user);
    localStorage.setItem("reserveflow_auth_session", JSON.stringify(user));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("reserveflow_auth_session");
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!currentUser) return false;
    return ROLE_RANK[currentUser.role] >= ROLE_RANK[requiredRole];
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950">
      <AuthContext.Provider value={{ currentUser, login, logout, isLoading, hasPermission }}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
};
