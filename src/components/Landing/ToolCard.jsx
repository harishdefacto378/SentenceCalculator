import React from 'react';
import { fetchAndStoreToken } from "../../services/authService";
function CalcThumbSvg() {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor">
      <rect x="20" y="10" width="60" height="80" rx="6" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <rect x="28" y="20" width="44" height="14" rx="2" fill="rgba(255,255,255,0.85)" />
      <rect x="28" y="42" width="12" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="44" y="42" width="12" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="60" y="42" width="12" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="28" y="58" width="12" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="44" y="58" width="12" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="60" y="58" width="12" height="28" rx="2" fill="rgba(255,255,255,0.85)" />
      <rect x="28" y="74" width="28" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

function CmpThumbSvg() {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor">
      <g fill="rgba(255,255,255,0.85)">
        <rect x="18" y="60" width="14" height="26" rx="2" />
        <rect x="38" y="44" width="14" height="42" rx="2" />
        <rect x="58" y="30" width="14" height="56" rx="2" />
        <rect x="78" y="16" width="6"  height="70" rx="2" fill="rgba(255,255,255,0.4)" />
      </g>
      <line x1="14" y1="86" x2="86" y2="86" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
    </svg>
  );
}

function AboutThumbSvg() {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor">
      <circle cx="50" cy="38" r="14" fill="rgba(255,255,255,0.85)" />
      <path d="M22 86 Q22 60 50 60 Q78 60 78 86 Z" fill="rgba(255,255,255,0.85)" />
      <circle cx="50" cy="38" r="14" fill="none" stroke="rgba(255,255,255,1)" strokeWidth="2" />
    </svg>
  );
}

export const THUMB_ICONS = {
  calc: <CalcThumbSvg />,
  cmp: <CmpThumbSvg />,
  about: <AboutThumbSvg />,
};
async function handleLpClick() {
  try {
    console.log("Landing button clicked");

    const token = await fetchAndStoreToken();

    console.log("Token generated:", token);

  } catch (err) {
    console.error(err);
  }
}
export default function ToolCard({ thumbClass, svgIcon, title, description, features, openLabel, isCalculator,metaItems, onClick }) {
  return (
    <div
      className="lp-card"
      
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className={`lp-thumb ${thumbClass}`}>{svgIcon}</div>

      <div className="lp-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
        <p className="lp-feature-list">{features}</p>
    <button
  className="lp-open"
  onClick={async (e) => {
    e.stopPropagation();

    if (isCalculator) {
      await handleLpClick();
    }

    onClick(); // always navigate
  }}
>
  {openLabel} →
</button>
      </div>

      <div className="lp-meta">
        {metaItems.map((item, i) => <span key={i}>{item}</span>)}
      </div>
    </div>
  );
}