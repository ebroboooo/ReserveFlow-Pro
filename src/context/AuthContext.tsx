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

const AUTH_STORAGE_KEY = 'smilecare_auth_session';
const LEGACY_AUTH_STORAGE_KEY = 'reserveflow_auth_session';

const ROLE_RANK: Record<UserRole, number> = {
  SuperAdmin: 4,
  BusinessOwner: 3,
  Receptionist: 2,
  Employee: 1
};

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  SuperAdmin: 'System Administrator',
  BusinessOwner: 'Clinic Owner',
  Receptionist: 'Front Desk',
  Employee: 'Dr. Staff Member'
};

function migrateLegacyAuthSession(): string | null {
  const current = localStorage.getItem(AUTH_STORAGE_KEY);
  if (current) return current;

  const legacy = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
  if (legacy) {
    localStorage.setItem(AUTH_STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    return legacy;
  }

  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = migrateLegacyAuthSession();
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to restore auth session', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, role: UserRole, branchId: string | null = null): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const user: User = {
      id: `usr-${role.toLowerCase()}-${Math.random().toString(36).substring(7)}`,
      orgId: 'org-smilecare-pro',
      email,
      role,
      name: ROLE_DISPLAY_NAMES[role],
      branchId: branchId ?? (role === 'Receptionist' || role === 'Employee' ? 'br-main' : null),
      isActive: true
    };

    setCurrentUser(user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!currentUser) return false;
    return ROLE_RANK[currentUser.role] >= ROLE_RANK[requiredRole];
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
};
