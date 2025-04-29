import client from './client';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    username: string;
    role: string;
    grade?: string;
    createdAt: string;
    enrolledCourses: any[];
  };
}

interface SignupResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    username: string;
    role: string;
    grade?: string;
    createdAt: string;
    enrolledCourses: any[];
  };
}

interface TokenResponse {
  valid: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  message?: string;
}

interface RefreshTokenResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await client.post<LoginResponse>('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error);
      throw error;
    }
  },

  signup: async (userData: {
    name?: string;
    email: string;
    password: string;
    username: string;
    phone: string;
    role: string;
    grade?: string;
  }): Promise<SignupResponse> => {
    try {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(userData.password)) {
        throw new Error(
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (@$!%*?&#)'
        );
      }

      const response = await client.post<SignupResponse>('/api/auth/signup', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.details) {
        throw new Error(error.response.data.details);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to create account. Please check your password requirements and try again.');
      }
    }
  },

  verifyToken: async (token: string): Promise<TokenResponse> => {
    try {
      const response = await client.post<TokenResponse>('/api/auth/verify', { token });
      return response.data;
    } catch (error: any) {
      console.error('Token verification error:', error);
      throw error;
    }
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    try {
      const response = await client.post<RefreshTokenResponse>('/api/auth/refresh-token');
      return response.data;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  updateProfile: async (userData: {
    name: string;
    email: string;
    phone: string;
    grade?: string;
  }): Promise<LoginResponse> => {
    try {
      console.log('Making update profile request with data:', userData);
      const response = await client.put<LoginResponse>('/api/auth/profile', userData);
      console.log('Update profile response:', response.data);
      if (!response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid server response');
      }
      return response.data;
    } catch (error: any) {
      console.error('Profile update error:', error);
      if (error.response?.status === 404) {
        throw new Error('Profile update endpoint not found');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update profile');
    }
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    try {
      const response = await client.post<{ message: string }>('/api/auth/change-password', passwordData);
      return response.data;
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to change password');
    }
  },

  createCourse: async (courseData: {
    id: string;
    title: string;
    description: string;
    duration: string;
    category: string;
    level: string;
    price: number;
    image: string;
    instructor: string;
  }) => {
    try {
      const response = await client.post('/api/courses', courseData);
      return response.data;
    } catch (error: any) {
      console.error('Course creation error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create course');
    }
  }
};

export const getToken = (): string => {
  return localStorage.getItem('token') || '';
};
