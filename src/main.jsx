import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import LandingPage    from './components/Landing/LandingPage';
import ComparisonPage from './components/Comparison/ComparisonPage';
import AboutPage      from './components/About/AboutPage';
import { CalculatorPage } from './components/Calculator/CalculatorPage';
import { Header }     from './components/Header';
import { NotFound }   from './components/NotFound';

function AppRouter() {
  const location = useLocation();
  const isCalculator = location.pathname === '/calculator';

  return (
    <>
      {/* Header renders only on the calculator route — pure React, no DOM hacks */}
      {isCalculator && <Header />}
      <Routes>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
        <Route path="/about"      element={<AboutPage />} />
        <Route path="*"           element={<NotFound />} />
      </Routes>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppRouter />
  </BrowserRouter>
);
