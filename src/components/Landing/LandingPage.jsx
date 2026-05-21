import React from 'react';
import '../../assets/css/style.css';
import Navbar from './Navbar';
import Ticker from './Ticker';
import ToolsGrid from './ToolsGrid';
import InfoSection from './InfoSection';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="lp-shell">
      <Navbar />
      <Ticker />
      <ToolsGrid />
      <InfoSection />
      <Footer />
    </div>
  );
}
