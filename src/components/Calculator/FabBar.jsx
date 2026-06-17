import React from 'react';
import { useNavigate } from 'react-router-dom';

// Defined outside FabBar to prevent re-creation on every render
const ICON_PATHS = {
  up:   <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  bars: <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="6"/><line x1="19" y1="20" x2="19" y2="14"/></g>,
  book: <path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5zM8 7h8M8 11h6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  info: <g stroke="currentColor" strokeWidth="1.8" fill="none"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16" strokeLinecap="round"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/></g>,
};

function Icon({ name }) {
  return <svg viewBox="0 0 24 24">{ICON_PATHS[name]}</svg>;
}

export function FabBar({ active, setActive }) {
  const navigate = useNavigate();

  return (
    <div className="fab-bar">
      <button className="fab" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Icon name="up" /></button>
      <button className={"fab " + (active === "home" ? "active" : "")} onClick={() => navigate('/')}><Icon name="home" /></button>
      <button className={"fab " + (active === "stats" ? "active" : "")} onClick={() => { setActive("stats"); navigate('/comparison'); }}><Icon name="bars" /></button>
      <button className={"fab " + (active === "report" ? "active" : "")} onClick={() => { setActive("report"); navigate('/about'); }}><Icon name="book" /></button>
      <button className={"fab " + (active === "info" ? "active" : "")} onClick={() =>  { setActive("info"); navigate('/about'); }}><Icon name="info" /></button>
    </div>
  );
}
