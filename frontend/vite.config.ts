import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { ProxyOptions } from 'vite'

/** Strip browser Origin so backend services don't reject proxied dev requests. */
function devProxy(target: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin')
        proxyReq.removeHeader('referer')
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sockjs-client references Node's `global` — polyfill it for the browser
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      '/api/auth': devProxy('http://localhost:8081'),
      '/api/users': devProxy('http://localhost:8082'),
      '/api/files': devProxy('http://localhost:8082'),
      '/api/problems': devProxy('http://localhost:8082'),
      '/api/practice': devProxy('http://localhost:8082'),
      '/api/coding-challenges': devProxy('http://localhost:8082'),
      '/api/admin/problems': devProxy('http://localhost:8082'),
      '/api/admin/coding-challenges': devProxy('http://localhost:8082'),
      '/api/pair-programming': devProxy('http://localhost:8082'),
      '/api/pair': devProxy('http://localhost:8082'),
      '/api/mentors/problems': devProxy('http://localhost:8082'),
      '/api/mentors/coding-challenges': devProxy('http://localhost:8082'),
      '/api/mentors/problems': devProxy('http://localhost:8082'),
      '/uploads/community': devProxy('http://localhost:8082'),
      '/api/matching': devProxy('http://localhost:8085'),
      '/api/mentors': devProxy('http://localhost:8086'),
      '/api/admin/mentor-applications': devProxy('http://localhost:8086'),
      '/api/admin/mentors': devProxy('http://localhost:8086'),
      '/api/marketplace': devProxy('http://localhost:8086'),
      '/api/mentorship': devProxy('http://localhost:8086'),
      '/api/ai-review': devProxy('http://localhost:8086'),
      '/api/ai-interview': devProxy('http://localhost:8086'),
      '/api/payment/code-review': devProxy('http://localhost:8086'),
      '/api/mock-interviews': devProxy('http://localhost:8086'),
      '/api/mock-interviewers': devProxy('http://localhost:8086'),
      '/api/mentor': devProxy('http://localhost:8086'),
      '/api/videos': devProxy('http://localhost:8086'),
      '/uploads': devProxy('http://localhost:8086'),
      '/api/payments': devProxy('http://localhost:8089'),
      '/api/recruiter': devProxy('http://localhost:8089'),
      '/api/chats': devProxy('http://localhost:8083'),
      '/api/notifications': devProxy('http://localhost:8084'),
      '/actuator': devProxy('http://localhost:8080'),
      '/api': devProxy('http://localhost:8080'),
      // WebSocket signaling goes directly to chat-service (port 8083) to bypass
      // gateway CORS and avoid double-proxying of the SockJS handshake.
      '/ws': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
