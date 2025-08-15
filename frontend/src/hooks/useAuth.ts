import { useState, useEffect } from "react";
import {
  isAuthenticated,
  getCurrentUser,
  logout as logoutService,
} from "@/services/authService";
import { User } from "@/services/authService";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  const refreshUser = () => {
    checkAuth();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };
};
