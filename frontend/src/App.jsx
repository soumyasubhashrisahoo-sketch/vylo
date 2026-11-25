import { useEffect } from 'react';
import { startVylo } from './legacy/vyloApp.js';

import Header from './components/Header.jsx';
import RoutesPanel from './components/RoutesPanel.jsx';
import MapPanel from './components/MapPanel.jsx';
import SafetyPanel from './components/SafetyPanel.jsx';
import PanicPanel from './components/PanicPanel.jsx';
import CloserLookModal from './components/CloserLookModal.jsx';
import RateRouteModal from './components/RateRouteModal.jsx';
import MetroMapModal from './components/MetroMapModal.jsx';
import GpsHelpModal from './components/GpsHelpModal.jsx';
import ToastContainer from './components/ToastContainer.jsx';

export default function App() {
  // Equivalent of the original window 'DOMContentLoaded' handler: runs once, after the markup is in the DOM.
  useEffect(() => {
    startVylo();
  }, []);

  return (
    <>
      {/* ==================== GLOBAL TOP NAVIGATION BAR ==================== */}
      <Header />

      {/* ==================== MAIN VIEWPORT ==================== */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        <RoutesPanel />
        <MapPanel />
        <SafetyPanel />
        <PanicPanel />
      </main>

      {/* ==================== MODALS ==================== */}
      <CloserLookModal />
      <RateRouteModal />
      <MetroMapModal />
      <GpsHelpModal />

      {/* Toast Container */}
      <ToastContainer />
    </>
  );
}
