import { useState, useEffect } from 'react';
import api from '../services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(false);
    } catch (error) {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const result = await api.login({ username, password });
    if (!result.error) {
      setIsAuthenticated(true);
    }
    return result;
  };

  const logout = async () => {
    const result = await api.logout();
    if (!result.error) {
      setIsAuthenticated(false);
    }
    return result;
  };

  const register = async (userData: {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
  }) => {
    return await api.register(userData);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  };
}
