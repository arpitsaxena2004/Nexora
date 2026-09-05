import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: any | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('agentflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('agentflow_token');
      if (storedToken) {
        try {
          const [userRes, profileRes] = await Promise.all([
            authApi.getMe(),
            authApi.getProfile().catch(() => ({ data: { profile: null } })),
          ]);
          setUser(userRes.data.user);
          setProfile(profileRes.data.profile);
        } catch (err) {
          console.warn('Session expired, clearing tokens');
          localStorage.removeItem('agentflow_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    const { token, user } = res.data;
    localStorage.setItem('agentflow_token', token);
    setToken(token);
    setUser(user);

    try {
      const profileRes = await authApi.getProfile();
      setProfile(profileRes.data.profile);
    } catch (e) {
      // Non-blocking
    }
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const res = await authApi.register(data);
    const { token, user } = res.data;
    localStorage.setItem('agentflow_token', token);
    setToken(token);
    setUser(user);

    try {
      const profileRes = await authApi.getProfile();
      setProfile(profileRes.data.profile);
    } catch (e) {
      // Non-blocking
    }
  };

  const loginAsDemo = async () => {
    try {
      await login({ email: 'demo@nexora.ai', password: 'DemoPassword123!' });
    } catch (err) {
      // If demo user does not exist yet, register first
      await register({ name: 'Demo Founder', email: 'demo@nexora.ai', password: 'DemoPassword123!' });
    }
  };

  const logout = () => {
    localStorage.removeItem('agentflow_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const res = await authApi.getProfile();
        setProfile(res.data.profile);
      } catch (e) {
        console.error('Failed to refresh profile', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginAsDemo,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
