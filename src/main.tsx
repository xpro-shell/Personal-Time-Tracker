import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LocalProfileProvider } from './context/LocalProfileContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <LocalProfileProvider>
      <App />
    </LocalProfileProvider>
  </ErrorBoundary>
);


