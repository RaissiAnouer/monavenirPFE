import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { User } from '../types/user';
import { toast } from 'react-hot-toast';


interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userData: User) => void;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const generateCsrfToken = useCallback(() => {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    localStorage.setItem('csrfToken', token);
    return token;
  }, []);

  const updateUser = useCallback((userData: User) => {
    console.log('Updating user in context with data:', userData);

    if (!userData.id || !userData.name || !userData.email || !userData.username) {
      console.error('Missing required user data fields:', userData);
      return;
    }

    // Ensure phone is preserved and not empty
    const safeUserData: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '', // Make sure phone is included
      username: userData.username,
      role: userData.role || 'student',
      grade: userData.grade || '',
      createdAt: userData.createdAt || new Date().toISOString(),
      enrolledCourses: userData.enrolledCourses || []
    };

    setUser(safeUserData);
    localStorage.setItem('user', JSON.stringify(safeUserData));
    console.log('User state updated and saved to localStorage:', safeUserData);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password);
      
      // Ensure user data is complete before updating
      if (!data.user.phone) {
        console.error('Phone number missing from user data:', data.user);
      }
      
      updateUser(data.user as User);
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
  }, [generateCsrfToken, updateUser]);

  const signup = useCallback(async (userData: any) => {
    try {
      const data = await authAPI.signup(userData);
      updateUser(data.user as User);
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
  }, [generateCsrfToken, updateUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('csrfToken');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await authAPI.refreshToken();
      const { token, user: userData } = response;
      
      if (token && userData) {
        // Ensure we have all required user data
        if (!(userData as User).phone) {
          console.warn('Phone number missing from refreshed user data');
          
          // Try to recover phone from localStorage if available
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.phone) {
              (userData as User).phone = parsedUser.phone;
            }
          }
        }
        
        updateUser(userData as User);
        localStorage.setItem('token', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return null;
    }
  }, [logout, updateUser]);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const response = await authAPI.verifyToken(token);
          if (response.valid) {
            const userData = JSON.parse(storedUser) as User;
            
            // Ensure we have a valid user with all required fields
            if (!userData.phone) {
              console.warn('Phone missing from stored user data, trying to refresh');
              const newToken = await refreshToken();
              if (!newToken) {
                logout();
              }
            } else {
              updateUser(userData);
              console.log('Loaded user data from localStorage:', userData);
            }
          } else {
            const newToken = await refreshToken();
            if (!newToken) {
              logout();
            }
          }
        } catch (error) {
          console.error('Token verification error:', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    
    verifyToken();
    if (!localStorage.getItem('csrfToken')) {
      generateCsrfToken();
    }
  }, [logout, refreshToken, generateCsrfToken, updateUser]);

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