import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
// If VITE_API_URL is unset, empty, or points to internal docker service 'api:5000',
// use empty string '' so browser requests go to current origin (e.g. http://localhost:5173/api/...)
// which Vite proxy forwards to backend container!
const isDockerInternal = typeof envUrl === 'string' && (envUrl.includes('api:') || envUrl.includes('//api'));
const baseURL = (envUrl && !isDockerInternal) ? envUrl : '';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
