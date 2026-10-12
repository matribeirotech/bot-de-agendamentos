import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Registra o Service Worker do PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Lypsyos Service Worker registrado com sucesso:', reg.scope))
      .catch((err) => console.warn('Erro ao registrar Service Worker:', err));
  });
} else if ('serviceWorker' in navigator) {
  // Registra também em ambiente local para testes de push e PWA
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
