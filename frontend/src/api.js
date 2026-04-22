import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (data) => api.post('/register', data);
export const login = (data) => api.post('/login', data);
export const getUser = () => api.get('/user');
export const getMeals = (date) => api.get('/meals', { params: { date } });
export const addMeal = (data) => api.post('/meals', data);
export const deleteMeal = (mealId, foodId) => api.delete(`/meals/${mealId}`, { params: { foodId } });
export const getActivities = (date) => api.get('/activities', { params: { date } });
export const addActivity = (data) => api.post('/activities', data);
export const deleteActivity = (activityId) => api.delete(`/activities/${activityId}`);