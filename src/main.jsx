import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { VocabularyProvider } from './context/VocabularyContext';
import './styles/global.css';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VocabularyProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </VocabularyProvider>
  </React.StrictMode>,
);

// PWA: Service Worker registration handled by vite-plugin-pwa automatically
// if injectRegister is set to 'auto'. No need for manual registration here.
