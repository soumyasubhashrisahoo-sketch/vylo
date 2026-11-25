import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App.jsx';

// Not wrapped in <StrictMode>: the app boots the Leaflet map and live GPS exactly once, as in the original page.
createRoot(document.getElementById('root')).render(<App />);
