import axios from "axios";

// FORCE REBUILD - API Configuration for Railway deployment
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const baseURL = isLocalhost ? "http://127.0.0.1:8000" : 'https://fin-lytics.com';
console.log('Frontend API Config v3 - Auth Fix Deploy:', { hostname, isLocalhost, baseURL });

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

// Add request interceptor for debugging and authentication
api.interceptors.request.use(
  (config) => {
    // Automatically add Authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added Authorization header to request');
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.baseURL);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

//if we see a 401 response, log the user out
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data, error.config?.url);
    if (error.response && error.response.status === 401) {
      console.log("🚨 401 error intercepted, logging out and redirecting...");
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
