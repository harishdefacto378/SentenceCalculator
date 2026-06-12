import React from 'react';
import logoUrl from '../../../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
  return (
    <div className="lp-hero">
      <img className="lp-seal" src={logoUrl} alt="" />
      <div>
        <h1>Sentence Calculator</h1>
        <div className="lp-actname">
          The Narcotic Drugs and Psychotropic Substances Act, 1985 · India
        </div>
      </div>
      <span className="lp-pill">⚠ Aid for practitioners</span>
    </div>
  );
}
