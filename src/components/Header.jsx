import React from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="header" id="app-header">
      <div className="header-inner">
        <img className="seal" src="/assets/logo.png" alt="Sentence Calculator" />
        <div className="header-title">
          <h1>Sentence Calculator</h1>
          <div className="actname">The Narcotic Drugs and Psychotropic Substances Act, 1985 (India)</div>
        </div>
        <nav className="header-nav">
          <a
            href="#"
            className="header-nav-link"
            onClick={e => { e.preventDefault(); navigate('/comparison'); }}
          >Compare</a>
          <a
            href="#"
            className="header-nav-link"
            onClick={e => { e.preventDefault(); navigate('/about'); }}
          >About</a>
          <button className="pill-warn"><span className="ic">⚠</span> Consider without Relying</button>
        </nav>
      </div>
      <div className="header-nav-mobile">
        <a href="#" onClick={e => { e.preventDefault(); navigate('/comparison'); }}>Compare</a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('/about'); }}>About</a>
      </div>
      <div className="disclaimer-strip">
        Computed values are an aid for legal practitioners. They are not to be treated as decisive
        or replace the Court's independent reasoning.
      </div>
    </header>
  );
}
