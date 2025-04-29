import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { User } from '../types/user';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userData: User) => void;
  refreshToken: () => Promise<string | null>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create and export useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a CSRF token for protection against CSRF attacks
  const generateCsrfToken = useCallback(() => {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    localStorage.setItem('csrfToken', token);
    return token;
  }, []);

  // Update user data
  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    // Store user data securely - avoid storing sensitive information
    const safeUserData = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      username: userData.username,
      grade: userData.grade,
      createdAt: userData.createdAt
    };
    localStorage.setItem('user', JSON.stringify(safeUserData));
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      generateCsrfToken();
      toast.success('Login successful');
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        toast.error(axiosError.response?.data?.message || 'Failed to login');
      } else {
        toast.error('Failed to login. Please check your connection.');
      }
      throw error;
    }
  }, [generateCsrfToken]);

  // Signup function
  const signup = useCallback(async (userData: any) => {
    try {
      const data = await authAPI.signup(userData);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      generateCsrfToken();
      toast.success('Account created successfully');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        toast.error(axiosError.response?.data?.message || 'Failed to signup');
      } else {
        toast.error('Failed to create account. Please try again.');
      }
      throw error;
    }
  }, [generateCsrfToken]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('csrfToken');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  // Token refresh function
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await authAPI.refreshToken();
      const { token, user: userData } = response;
      
      if (token && userData) {
        localStorage.setItem('token', token);
        updateUser(userData as User);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return null;
    }
  }, [logout, updateUser]);

  // Verify token on initial load
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Try to verify the token
          const response = await authAPI.verifyToken(token);
          
          if (response.valid) {
            setUser(JSON.parse(storedUser));
          } else {
            // If token is invalid, try to refresh it
            const newToken = await refreshToken();
            if (!newToken) {
              // If refresh fails, clear storage
              logout();
            }
          }
        } catch (error) {
          console.error('Token verification error:', error);
          // Clear storage on verification error
          logout();
        }
      }
      
      setIsLoading(false);
    };
    
    verifyToken();
    
    // Generate CSRF token if it doesn't exist
    if (!localStorage.getItem('csrfToken')) {
      generateCsrfToken();
    }
  }, [logout, refreshToken, generateCsrfToken]);

  const value = {
    user,
    login,
    signup,
    logout,
    isLoading,
    updateUser,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 