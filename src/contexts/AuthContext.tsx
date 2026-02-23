import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User, UserRole } from "@/types";
import { mockUsers } from "@/data/mock-users";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string, city: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("civictrack_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, _password: string) => {
    const found = mockUsers.find((u) => u.email === email);
    if (!found) return { success: false, error: "Invalid email or password." };
    setUser(found);
    localStorage.setItem("civictrack_user", JSON.stringify(found));
    return { success: true };
  }, []);

  const register = useCallback((name: string, email: string, _password: string, city: string) => {
    if (mockUsers.find((u) => u.email === email)) {
      return { success: false, error: "An account with this email already exists." };
    }
    const newUser: User = {
      id: `citizen_${Date.now()}`,
      name,
      email,
      role: "citizen",
      city,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    setUser(newUser);
    localStorage.setItem("civictrack_user", JSON.stringify(newUser));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("civictrack_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
