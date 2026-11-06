import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


// Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
//npm run dev //  to tun application


//https://macroviz.vercel.app