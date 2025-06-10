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
  baseURL: import.meta.env.DEV 
    ? 'http://localhost:5000'
    : 'https://pfe-backend-hac7djg2eubjbsar.canadacentral-01.azurewebsites.net',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Add retry logic
client.interceptors.response.use(
  (response) => response, // Fix: Provide a fulfilled function that returns the response unchanged
  async (err) => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }
  config.retry -= 1;
  const delayRetry = new Promise(resolve => {
    setTimeout(resolve, config.retryDelay || 1000);
  });
  await delayRetry;
  return client(config);
  }
);

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
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
  }, 
  (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
  }
);

// Handle token refresh logic
const handleTokenRefresh = async (originalRequest: any) => {
        if (isRefreshing) {
    const newToken = await new Promise<string>(resolve => {
      subscribeTokenRefresh(token => resolve(token));
    });
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return axios(originalRequest);
        }
        
        isRefreshing = true;
        originalRequest._retry = true;
        
        try {
          const response = await axios.post(
            `${client.defaults.baseURL}/api/auth/refresh-token`,
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
    throw refreshError;
        }
};
      
// Handle unauthorized responses
const handleUnauthorized = () => {
        console.log('Unauthorized access detected, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
};
      
// Handle API errors
const handleApiError = (error: any) => {
  if (error.response) {
      console.error('API Error:', error.response.status, error.response.data || error.message);
    if (error.response.status === 429) {
      console.error('Rate limit exceeded');
    }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
  }
};

// Response interceptor
client.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`Response from ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && 
        error.response.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      try {
        return await handleTokenRefresh(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      handleUnauthorized();
    }

    handleApiError(error);
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