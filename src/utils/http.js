import axios from 'axios'

export const http = axios.create({
  //baseURL: 'http://localhost:5050', 
  baseURL: 'https://caresync-ai-backend-on5p.onrender.com',
  timeout: 20000,
})

export function withAuth(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

