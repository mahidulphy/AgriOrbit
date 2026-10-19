import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LangProvider } from './lang.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
);

