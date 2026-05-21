// LandingPage.jsx — Landing page component for Sentence Calculator
// Loaded as type="text/babel"; exposes window.LandingPage for use in app.jsx.

// ── SVG thumbnails ────────────────────────────────────────────────────────────

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

// ── Hero ──────────────────────────────────────────────────────────────────────

function LandingHero() {
  return (
    <div className="lp-hero">
      <img className="lp-seal" src="assets/logo.png" alt="" />
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

// ── Ticker ────────────────────────────────────────────────────────────────────

function LandingTicker() {
  return (
    <div className="lp-ticker">
      Computed values are an aid for legal practitioners. They are not decisive
      and do not replace the Court's independent reasoning.
    </div>
  );
}

// ── Reusable tool card ────────────────────────────────────────────────────────

function LandingCard({ thumbClass, svgIcon, title, description, features, openLabel, metaItems, onClick }) {
  return (
    <div
      className="lp-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
    >
      <div className={`lp-thumb ${thumbClass}`}>{svgIcon}</div>

      <div className="lp-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
        <p className="lp-feature-list">{features}</p>
        <button
          className="lp-open"
          onClick={e => { e.stopPropagation(); onClick(); }}
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

// ── Info section ──────────────────────────────────────────────────────────────

function LandingInfo() {
  return (
    <div className="lp-info">
      <h3>Using the calculator</h3>
      <p>
        Select a notified substance from the drop-down, enter the seized quantity
        with the right unit, and pick the offence date. The base sentence and fine
        are computed proportionally across the small-quantity / intermediate /
        commercial bands defined under the NDPS Act, 1985.
      </p>
      <p>
        Use the <strong>Discretion</strong> sliders to express the Court's increase
        or decrease percentage, and tick the <strong>Aggravating</strong> and{" "}
        <strong>Mitigating</strong> factors that apply. The live{" "}
        <strong>Report</strong> tab summarises the inputs, the chemical and
        statutory specification, and the resulting sentence and fine.
      </p>
      <p>
        For comparing multiple hypotheticals — different substances, different
        quantities, or the same case under varying judicial discretion — open the{" "}
        <strong>Comparison</strong> page.
      </p>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="lp-footer">
      <span>Justice Anoop Chitkara <span style={{ opacity: 0.7 }}>©</span></span>
      <span>
        Feedback:{" "}
        <a href="mailto:sentencecalculator.in@gmail.com">
          sentencecalculator.in@gmail.com
        </a>
      </span>
      <span>
        Support:{" "}
        <a href="mailto:customer.support@defactoinfotech.com">
          customer.support@defactoinfotech.com
        </a>
      </span>
    </footer>
  );
}

// ── LandingPage (main export) ─────────────────────────────────────────────────

function LandingPage({ onNavigate }) {
  return (
    <div className="lp-shell">
      <LandingHero />
      <LandingTicker />

      <h2 className="lp-section-heading">Choose a tool</h2>

      <div className="lp-grid">
        <LandingCard
          thumbClass="lp-thumb-calc"
          svgIcon={<CalcThumbSvg />}
          title="Calculator"
          description="Proportional sentence &amp; fine based on substance, quantity, and date. Includes judicial discretion and aggravating / mitigating factors."
          features="Substance picker · Qty + unit · Discretion ± % · Factor tables · Live report"
          openLabel="Open calculator"
          metaItems={["📐 Section 21(c), 20(b)(ii), 17(c), 22(c)", "⚖ NDPS Act 1985"]}
          onClick={() => onNavigate("calculator")}
        />

        <LandingCard
          thumbClass="lp-thumb-cmp"
          svgIcon={<CmpThumbSvg />}
          title="Comparison"
          description="Build up to six scenarios and compare them side-by-side. Sentence range, fine range, and a 0–20 year statutory spectrum."
          features="Scenario chips · KPI strip · Table view · Chart view · Spectrum view"
          openLabel="Open comparison"
          metaItems={["📊 3 views", "↕ Up to 6 scenarios"]}
          onClick={() => onNavigate("comparison")}
        />

        <LandingCard
          thumbClass="lp-thumb-about"
          svgIcon={<AboutThumbSvg />}
          title="About"
          description="Team, methodology, instructional videos in English / Hindi / Punjabi, and contact for support and feedback."
          features="Conceived by Justice Anoop Chitkara · de facto infotech · Research team"
          openLabel="Open about"
          metaItems={["🎥 3 videos", "👥 Team & credits"]}
          onClick={() => onNavigate("about")}
        />
      </div>

      <LandingInfo />
      <LandingFooter />
    </div>
  );
}

// Register globally so app.jsx (loaded after this file) can reference it.
window.LandingPage = LandingPage;
