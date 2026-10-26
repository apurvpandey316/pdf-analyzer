import axios from 'axios'

// Shared axios instance. withCredentials sends the auth cookie to the API.
// In development VITE_API_URL points at the Express server (localhost:5000);
// in production it is unset and the API is on the same domain as the website.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  withCredentials: true,
})

// Turns an axios error into a message that can be shown to the user.
export function errorMessage(err) {
  return err.response?.data?.error || 'Could not reach the server. Please try again.'
}

export default api
