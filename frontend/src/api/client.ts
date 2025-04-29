import axios from 'axios';

// Create a request cache to prevent duplicate requests
const requestCache = new Map();

// Token refresh state
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Notify subscribers about token refresh
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Create axios instance
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://backend-pfe.azurewebsites.net',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    if (import.meta.env.DEV) {
      console.log('Auth token attached to request');
    }
  }
  
  if (import.meta.env.DEV) {
    console.log(`${config.method?.toUpperCase()} request to ${config.url}`);
  }
  
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Response interceptor to handle unauthorized responses and token refresh
client.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`Response from ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      if (error.response.status === 401 && 
          error.response.data && 
          error.response.data.code === 'TOKEN_EXPIRED' && 
          !originalRequest._retry) {
        
        if (isRefreshing) {
          try {
            const newToken = await new Promise<string>((resolve) => {
              subscribeTokenRefresh((token: string) => {
                resolve(token);
              });
            });
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('Error waiting for token refresh:', refreshError);
            return Promise.reject(refreshError);
          }
        }
        
        isRefreshing = true;
        originalRequest._retry = true;
        
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'https://backend-pfe.azurewebsites.net'}/api/auth/refresh-token`,
            {},
            { withCredentials: true }
          );
          
          const { token } = response.data as { token: string };
          localStorage.setItem('token', token);
          
          onTokenRefreshed(token);
          
          isRefreshing = false;
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          isRefreshing = false;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?session=expired';
          return Promise.reject(refreshError);
        }
      }
      
      if (error.response.status === 401) {
        console.log('Unauthorized access detected, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      console.error('API Error:', error.response.status, error.response.data || error.message);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
    }
    
    return Promise.reject(error);
  }
);

// Create a wrapper around the client to handle caching for GET requests
const clientWithCache = {
  get: async (url: string, config?: any) => {
    if (!config?.skipCache) {
      const cacheKey = `${url}${JSON.stringify(config || {})}`;
      
      const cachedResponse = requestCache.get(cacheKey);
      if (cachedResponse && Date.now() - cachedResponse.timestamp < 5000) {
        return cachedResponse.data;
      }
      
      const response = await client.get(url, config);
      requestCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      return response;
    }
    
    return client.get(url, config);
  },
  post: client.post.bind(client),
  put: client.put.bind(client),
  delete: client.delete.bind(client),
  patch: client.patch.bind(client)
};

export default clientWithCache;
