import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './src/components/Landing/LandingPage';
import ComparisonPage from './src/components/Comparison/ComparisonPage';
import AboutPage from './src/components/About/AboutPage';
import { SUBSTANCES, UNITS, AGGRAVATING, MITIGATING } from './data';

// ────────────────────────────────────────────────────────────────────────────
// Calculation helpers
// ────────────────────────────────────────────────────────────────────────────

// Calculation moved to Dataverse custom API. Front-end calls the configured
// API endpoint (`window.API_CALC_ENDPOINT` or `/api/calculate`) to receive
// the base sentence/fine. The client keeps only formatting helpers.

function daysToYMD(days) {
  if (!days) return { y: 0, m: 0, d: 0 };
  const y = Math.floor(days / 365);
  const r = days - y * 365;
  const m = Math.floor(r / 30);
  const d = r - m * 30;
  return { y, m, d };
}

function fmtRupees(n) {
  if (!n) return "₹0.00";
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNum(n) {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-IN");
}
function fmtYMD({ y, m, d }) {
  return `${y} year(s) ${m} month(s) ${d} day(s)`;
}

// ────────────────────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────────────────────

function ProportionalCalc({ state, setState, base, onCalc, calculated }) {
  const subs = SUBSTANCES;
  const sub = subs.find(s => s.name === state.substance);

  return (
    <div className="card">
      <div className="card-head">
        <h2>Proportional Calculation</h2>
        <div className="actions"><button className="btn ghost" onClick={() => setState({ substance: "", qty: "", unit: "Gram", date: "" })}>Reset</button></div>
      </div>
      <div className="card-body">
        <div className="form-row">
          <label>Substance Name</label>
          <select className="select" style={{ width: 220 }} value={state.substance} onChange={e => setState({ ...state, substance: e.target.value })}>
            <option value="">Select…</option>
            {subs.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Quantity Detained</label>
          <div className="input-group">
            <input className="input num" placeholder="0" value={state.qty} onChange={e => setState({ ...state, qty: e.target.value.replace(/[^\d.]/g, "") })} />
            <select className="select" value={state.unit} onChange={e => setState({ ...state, unit: e.target.value })}>
              {Object.keys(UNITS).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <label>Date of Confiscation <span className="sub-label">(optional)</span></label>
          <input className="input" type="date" style={{ width: 160 }} value={state.date} onChange={e => setState({ ...state, date: e.target.value })} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button className="btn" disabled={!state.substance || !state.qty} onClick={onCalc}>Calculate</button>
        </div>

        <div className="results">
          <div className="result-row"><span>Punishable Under Section:</span><span className="v">{calculated ? base.section : "NA"}</span></div>
          <div className="result-row"><span>SENTENCE in day(s):</span><span className="v big">{calculated ? fmtNum(base.sentenceDays) + " days" : "0 days"}</span></div>
          <div className="result-row"><span>SENTENCE in year(s), month(s) and day(s):</span><span className="v">{calculated ? fmtYMD(daysToYMD(base.sentenceDays)) : "0 year(s) 0 month(s) 0 day(s)"}</span></div>
          <div className="result-row"><span>FINE (in Rupees):</span><span className="v big">{calculated ? fmtRupees(base.fine) : "₹0.00"}</span></div>
          <div className="result-row"><span>Quantity Type:</span><span className="v">{calculated ? base.type : "NA"}</span></div>
          <div className="result-row"><span>Drug Quantity in % to Upper Limit of Intermediate:</span><span className="v">{calculated ? base.pctOfUpper + "%" : "—"}</span></div>
        </div>
      </div>
    </div>
  );
}

function DiscretionCalc({ state, setState, base, discretion, onCalc, calculated }) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Calculation as per Discretion of the Court</h2>
        <div className="actions"><button className="btn ghost" onClick={() => setState({ inc: 0, dec: 0 })}>Reset</button></div>
      </div>
      <div className="card-body">
        <div className="form-row">
          <label>%age Increase in SENTENCE/FINE<span className="sub-label">(System default 0%)</span></label>
          <input className="input sm" type="number" min="0" max="100" value={state.inc} onChange={e => setState({ ...state, inc: Math.max(0, Math.min(100, +e.target.value || 0)) })} />
        </div>
        <div className="form-row">
          <label>%age Decrease in SENTENCE/FINE<span className="sub-label">(System default 0%)</span></label>
          <input className="input sm" type="number" min="0" max="100" value={state.dec} onChange={e => setState({ ...state, dec: Math.max(0, Math.min(100, +e.target.value || 0)) })} />
        </div>
        <div className="banner">We strongly recommend to decrease default to make median at 50%</div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn" disabled={!calculated} onClick={onCalc}>Calculate</button>
        </div>
        <div className="results">
          <div className="result-row"><span>SENTENCE in day(s):</span><span className="v big">{discretion ? fmtNum(discretion.sentenceDays) + " days" : "0 days"}</span></div>
          <div className="result-row"><span>SENTENCE in year(s), month(s) and day(s):</span><span className="v">{discretion ? fmtYMD(daysToYMD(discretion.sentenceDays)) : "0 year(s) 0 month(s) 0 day(s)"}</span></div>
          <div className="result-row"><span>FINE (in Rupees):</span><span className="v big">{discretion ? fmtRupees(discretion.fine) : "₹0.00"}</span></div>
        </div>
      </div>
    </div>
  );
}

function FactorSummary({ aggSentTotal, aggFineTotal, mitSentTotal, mitFineTotal, baseSentenceDays, baseFine, final }) {
  const netSent = aggSentTotal - mitSentTotal;
  const netFine = aggFineTotal - mitFineTotal;
  return (
    <div className="card">
      <div className="card-head">
        <h2>Calculation on the Basis of Aggravating & Mitigating Factors</h2>
        <div className="actions"><button className="btn ghost">Calculate</button></div>
      </div>
      <div className="card-body">
        <div className="summary-grid">
          <div className="summary-row"><span>%age Increase/Decrease in SENTENCE:</span><span className="v" style={{ color: netSent > 0 ? "var(--aggrav)" : netSent < 0 ? "var(--mitig)" : "var(--ink)" }}>{netSent > 0 ? "+" : ""}{netSent}%</span></div>
          <div className="summary-row"><span>%age Increase/Decrease in FINE:</span><span className="v" style={{ color: netFine > 0 ? "var(--aggrav)" : netFine < 0 ? "var(--mitig)" : "var(--ink)" }}>{netFine > 0 ? "+" : ""}{netFine}%</span></div>
          <div className="summary-row"><span>NEW SENTENCE in day(s):</span><span className="v big">{fmtNum(final.sentenceDays)} days</span></div>
          <div className="summary-row"><span>NEW SENTENCE in year(s), month(s) and day(s):</span><span className="v">{fmtYMD(daysToYMD(final.sentenceDays))}</span></div>
          <div className="summary-row"><span>NEW FINE (in Rupees):</span><span className="v big">{fmtRupees(final.fine)}</span></div>
        </div>
        <div className="banner cap">Default capped at 100%</div>
      </div>
    </div>
  );
}

function FactorTable({ kind, factors, setFactors, totalSent, totalFine }) {
  const isAggrav = kind === "aggrav";
  const arrow = isAggrav ? "↑" : "↓";
  const heading = isAggrav ? "Aggravating Factors Considered By The Court" : "Mitigating Factors Considered By the Court";
  const headLbl = isAggrav ? "Aggravating Factors" : "Mitigating Factors";
  const sentColLbl = isAggrav ? "Increase in Sentence (%)" : "Decrease in Sentence (%)";
  const fineColLbl = isAggrav ? "Increase in Fine (%)" : "Decrease in Fine (%)";
  const [custom, setCustom] = useState("");

  function setField(id, key, val) {
    setFactors(factors.map(f => f.id === id ? { ...f, [key]: Math.max(0, Math.min(100, +val || 0)) } : f));
  }
  function addCustom() {
    if (!custom.trim()) return;
    setFactors([...factors, { id: kind + "-c" + Date.now(), label: custom.trim(), sentence: 0, fine: 0, avg: 0, custom: true }]);
    setCustom("");
  }

  return (
    <div className="card">
      <div className="card-head" style={{ borderColor: "transparent" }}>
        <h2 className={isAggrav ? "" : ""} style={{ color: isAggrav ? "var(--aggrav)" : "var(--mitig)" }}>{heading}</h2>
        <div className="actions"><button className="btn ghost" onClick={() => setFactors(factors.map(f => ({ ...f, sentence: 0, fine: 0 })))}>Reset</button></div>
      </div>
      <div className="table-head">
        <div></div>
        <div style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{headLbl}</div>
        <div className="num-col">{sentColLbl}<em>(Please fill)</em></div>
        <div className="num-col">{fineColLbl}<em>(Please fill)</em></div>
        <div className="num-col">Average suggested by survey (%)</div>
      </div>
      <div>
        {factors.map((f, i) => (
          <div key={f.id} className={"factor-row " + kind}>
            <div className="idx"><span className="arrow">{arrow}</span><span>{i + 1}.</span></div>
            <div className="label">
              {f.label}
              {f.options && (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                  {f.options.map(o => (
                    <label key={o} style={{ fontSize: 12, color: "var(--ink-2)", display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="radio" name={f.id} /> {o}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="cell"><input className="input sm" type="number" min="0" max="100" value={f.sentence} onChange={e => setField(f.id, "sentence", e.target.value)} /></div>
            <div className="cell"><input className="input sm" type="number" min="0" max="100" value={f.fine} onChange={e => setField(f.id, "fine", e.target.value)} /></div>
            <div className="cell"><input className="input sm" readOnly value={f.avg + "%"} style={{ background: "#f5f6fa", color: "var(--ink-3)" }} /></div>
          </div>
        ))}
      </div>
      <div className="custom-row">
        <input placeholder={isAggrav ? "Enter Custom Aggravating Factor" : "Enter Custom Mitigating Factor"} value={custom} onChange={e => setCustom(e.target.value)} />
        <button className="btn" disabled={!custom.trim()} onClick={addCustom}>Add</button>
      </div>
      <div className="table-foot">
        <div className="label">{isAggrav ? "Total Increase in Sentence (%)" : "Total Decrease in Sentence (%)"}</div>
        <div className={"val " + (isAggrav ? "aggrav" : "mitig")}>{totalSent}%</div>
        <div className={"val " + (isAggrav ? "aggrav" : "mitig")}>{totalFine}%</div>
      </div>
    </div>
  );
}

function ReportCard({ substance, base, discretion, final, tab, setTab, onCopy }) {
  const sub = substance;
  const na = "NA";
  return (
    <div className="card">
      <div className="report-head">
        <h2>Report</h2>
        <div className="report-tabs">
          <button className={"btn tab " + (tab === "sentence" ? "active" : "")} onClick={() => setTab("sentence")}>Copy with Sentence</button>
          <button className={"btn tab " + (tab === "basic" ? "active" : "")} onClick={() => setTab("basic")}>Copy Basic</button>
          <button className={"btn tab " + (tab === "factors" ? "active" : "")} onClick={() => setTab("factors")}>Copy With Sentence & Factors</button>
          <button className="btn" onClick={onCopy}>Copy</button>
        </div>
      </div>
      <div className="report-body">
        <div className="report-section">
          <h3>Specified as Small &amp; Commercial in S.2(viia) &amp; 2(xxiiia) NDPS Act, 1985</h3>
          <Spec k="Notification Link" v={sub ? sub.notifLink : na} />
          <Spec k="Notification No." v={sub ? sub.notif : na} />
          <Spec k="Dated" v={sub ? sub.notifDate : "01-01-1970"} />
          <Spec k="SR. No." v={sub ? String(SUBSTANCES.indexOf(sub) + 1) : na} />
          <Spec k="Common Name (Name of Narcotic Drug and Psychotropic Substance — International non-proprietary name (INN))" v={sub ? sub.common : na} />
          <Spec k="Other Non-proprietary Name" v={sub ? sub.otherName : na} />
          <Spec k="Chemical Name" v={sub ? sub.chemical : na} />
          <Spec k="Small Quantity" v={sub ? `≤ ${sub.smallQty} ${sub.unit}` : "< 0 Gram"} />
          <Spec k="Commercial Quantity" v={sub ? `≥ ${sub.commercialQty} ${sub.unit}` : "> 0 Gram"} />
        </div>

        <div className="report-section">
          <h3>Declared as punishable under NDPS Act and as per schedule defined in S.2(viia) &amp; 2(xxiiia) NDPS Act, 1985</h3>
          <Spec k="Notification Link" v={sub ? sub.notifLink : na} />
          <Spec k="Notification No." v={sub ? sub.notif : na} />
          <Spec k="Dated" v={sub ? sub.notifDate : "—"} />
          <Spec k="SR. No." v={sub ? String(SUBSTANCES.indexOf(sub) + 1) : na} />
          <Spec k="Common Name (Name of Narcotic Drug and Psychotropic Substance — International non-proprietary name (INN))" v={sub ? sub.common : na} />
          <Spec k="Other Non-proprietary Name" v={sub ? sub.otherName : na} />
          <Spec k="Chemical Name" v={sub ? sub.chemical : na} />

          <div className="disclaimer-box">
            <span className="ic">⚠</span>
            <div className="body"><b>Disclaimer</b>You are advised to re-verify all details from the Gazette of India and official notifications.</div>
          </div>
        </div>

        <div className="report-section">
          <h3>Drug's Small &amp; Commercial Qty. suggested by Committee Report</h3>
          <Spec k="Notification No. &amp; Date" v={sub ? `${sub.notif} · ${sub.notifDate}` : na} />
          <Spec k="Notification Link" v={sub ? sub.notifLink : na} />
          <Spec k="IUPAC — Weblink" v={sub ? sub.iupacWeb : "—"} />
          <Spec k="IUPAC Name" v={sub ? sub.iupacName : na} />
        </div>

        {sub && tab !== "basic" && (
          <div className="report-section">
            <h3>Computed Sentence Summary</h3>
            <Spec k="Punishable Under Section" v={base.section} />
            <Spec k="Quantity Type" v={base.type} />
            <Spec k="Base Sentence" v={fmtYMD(daysToYMD(base.sentenceDays))} />
            <Spec k="Base Fine" v={fmtRupees(base.fine)} />
            <Spec k="After Discretion (Sentence)" v={fmtYMD(daysToYMD(discretion.sentenceDays))} />
            <Spec k="After Discretion (Fine)" v={fmtRupees(discretion.fine)} />
            {tab === "factors" && (
              <>
                <Spec k="Final Sentence (with Factors)" v={fmtYMD(daysToYMD(final.sentenceDays))} />
                <Spec k="Final Fine (with Factors)" v={fmtRupees(final.fine)} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Spec({ k, v }) {
  const na = v === "NA" || v === "—" || v === "" || v == null;
  return (
    <div className="spec-row">
      <div className="k" dangerouslySetInnerHTML={{ __html: k }} />
      <div className={"v " + (na ? "na" : "")}>{na ? "NA" : v}</div>
    </div>
  );
}

function FabBar({ active, setActive, onHome }) {
  const Icon = ({ name }) => {
    const paths = {
      up:   <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
      home: <path d="M3 11l9-8 9 8M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
      bars: <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="6"/><line x1="19" y1="20" x2="19" y2="14"/></g>,
      book: <path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5zM8 7h8M8 11h6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
      info: <g stroke="currentColor" strokeWidth="1.8" fill="none"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16" strokeLinecap="round"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/></g>,
    };
    return <svg viewBox="0 0 24 24">{paths[name]}</svg>;
  };
  return (
    <div className="fab-bar">
      <button className="fab" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Icon name="up" /></button>
      <button className={"fab " + (active === "home" ? "active" : "")} onClick={onHome || (() => setActive("home"))}><Icon name="home" /></button>
      <button className={"fab " + (active === "stats" ? "active" : "")} onClick={() => setActive("stats")}><Icon name="bars" /></button>
      <button className={"fab " + (active === "report" ? "active" : "")} onClick={() => setActive("report")}><Icon name="book" /></button>
      <button className={"fab " + (active === "info" ? "active" : "")} onClick={() => setActive("info")}><Icon name="info" /></button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// App
// ────────────────────────────────────────────────────────────────────────────

function App({ onBackToLanding }) {
  const [propState, setPropState] = useState({ substance: "Heroin (Diacetylmorphine)", qty: "50", unit: "Gram", date: "" });
  const [discState, setDiscState] = useState({ inc: 0, dec: 0 });
  const [aggravFactors, setAggravFactors] = useState(AGGRAVATING);
  const [mitigFactors, setMitigFactors] = useState(MITIGATING);
  const [calculated, setCalculated] = useState(true);
  const [discCalculated, setDiscCalculated] = useState(true);
  const [reportTab, setReportTab] = useState("sentence");
  const [fabActive, setFabActive] = useState("home");

  const substance = useMemo(() =>
    SUBSTANCES.find(s => s.name === propState.substance),
    [propState.substance]
  );

  const qtyInGrams = useMemo(() => {
    const n = parseFloat(propState.qty);
    if (!isFinite(n)) return 0;
    return n * (UNITS[propState.unit] || 1);
  }, [propState.qty, propState.unit]);

  const [base, setBase] = useState({ sentenceDays: 0, fine: 0, type: "NA", pctOfUpper: 0, section: "NA" });

  async function fetchBase(sub, qty) {
    const endpoint = window.API_CALC_ENDPOINT || "/api/calculate";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ substanceName: sub?.name, qty }),
      });
      if (!res.ok) throw new Error("Calculation API error");
      const data = await res.json();
      setBase(data);
      return data;
    } catch (err) {
      console.error("Calc API failed:", err);
      return null;
    }
  }

  useEffect(() => {
    // Fetch base calculation when substance or quantity changes (keeps UI in sync).
    fetchBase(substance, qtyInGrams);
  }, [substance, qtyInGrams]);

  const discretion = useMemo(() => {
    const net = (discState.inc - discState.dec) / 100;
    return {
      sentenceDays: Math.max(0, Math.round(base.sentenceDays * (1 + net))),
      fine: Math.max(0, Math.round(base.fine * (1 + net))),
    };
  }, [base, discState]);

  const aggSentTotal = useMemo(() => Math.min(100, aggravFactors.reduce((a, f) => a + (+f.sentence || 0), 0)), [aggravFactors]);
  const aggFineTotal = useMemo(() => Math.min(100, aggravFactors.reduce((a, f) => a + (+f.fine || 0), 0)), [aggravFactors]);
  const mitSentTotal = useMemo(() => Math.min(100, mitigFactors.reduce((a, f) => a + (+f.sentence || 0), 0)), [mitigFactors]);
  const mitFineTotal = useMemo(() => Math.min(100, mitigFactors.reduce((a, f) => a + (+f.fine || 0), 0)), [mitigFactors]);

  const final = useMemo(() => {
    const sentNet = (aggSentTotal - mitSentTotal) / 100;
    const fineNet = (aggFineTotal - mitFineTotal) / 100;
    return {
      sentenceDays: Math.max(0, Math.round(discretion.sentenceDays * (1 + sentNet))),
      fine: Math.max(0, Math.round(discretion.fine * (1 + fineNet))),
    };
  }, [discretion, aggSentTotal, aggFineTotal, mitSentTotal, mitFineTotal]);

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1400);
  }

  function copyReport() {
    const lines = [
      `Substance: ${substance?.name || "—"}`,
      `Quantity: ${propState.qty} ${propState.unit}`,
      `Section: ${base.section}`,
      `Quantity Type: ${base.type}`,
      `Base Sentence: ${fmtYMD(daysToYMD(base.sentenceDays))}`,
      `Base Fine: ${fmtRupees(base.fine)}`,
      `After Discretion: ${fmtYMD(daysToYMD(discretion.sentenceDays))} · ${fmtRupees(discretion.fine)}`,
      `Final (w/ Factors): ${fmtYMD(daysToYMD(final.sentenceDays))} · ${fmtRupees(final.fine)}`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    toast("Report copied to clipboard");
  }

  return (
    <>
      <div className="shell">
        <div className="col">
          <ProportionalCalc
            state={propState} setState={setPropState}
            base={base} calculated={calculated}
            onCalc={async () => { await fetchBase(substance, qtyInGrams); setCalculated(true); toast("Proportional calculation updated"); }}
          />
          <ReportCard substance={substance} base={base} discretion={discretion} final={final} tab={reportTab} setTab={setReportTab} onCopy={copyReport} />
        </div>

        <div className="col">
          <DiscretionCalc
            state={discState} setState={setDiscState}
            base={base} discretion={discretion}
            calculated={calculated} onCalc={() => { setDiscCalculated(true); toast("Discretion applied"); }}
          />
          <FactorSummary
            aggSentTotal={aggSentTotal} aggFineTotal={aggFineTotal}
            mitSentTotal={mitSentTotal} mitFineTotal={mitFineTotal}
            baseSentenceDays={discretion.sentenceDays} baseFine={discretion.fine}
            final={final}
          />
          <FactorTable kind="aggrav" factors={aggravFactors} setFactors={setAggravFactors} totalSent={aggSentTotal} totalFine={aggFineTotal} />
          <FactorTable kind="mitig"  factors={mitigFactors} setFactors={setMitigFactors} totalSent={mitSentTotal} totalFine={mitFineTotal} />
        </div>
      </div>

      <FabBar active={fabActive} setActive={setFabActive} onHome={onBackToLanding} />

      <footer className="site">
        <div className="pip">Justice Anoop Chitkara <span style={{ opacity: 0.7 }}>©</span></div>
        <div className="pip">Send feedback: <a href="mailto:sentencecalculator.in@gmail.com">sentencecalculator.in@gmail.com</a></div>
        <div className="pip survey"><a href="#">📊 Participate in Survey</a></div>
        <div className="pip">For any query: <a href="mailto:customer.support@defactoinfotech.com">customer.support@defactoinfotech.com</a></div>
        <div className="pip"><a href="#">Cookies</a></div>
      </footer>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Root — manages navigation between the landing page and the calculator
// ────────────────────────────────────────────────────────────────────────────

function Root() {
  const [page, setPage] = useState("landing");

  // Show the static app header only for the calculator page.
  useEffect(() => {
    const header = document.getElementById("app-header");
    if (header) header.style.display = page === "calculator" ? "" : "none";
  }, [page]);

  // Expose navigation for the static header's onclick links.
  useEffect(() => {
    window.__navigate = (to) => setPage(to);
    return () => { window.__navigate = null; };
  }, []);

  function handleNavigate(to) {
    setPage(to);
  }

  if (page === "landing")    return <LandingPage onNavigate={handleNavigate} />;
  if (page === "comparison") return <ComparisonPage onNavigate={handleNavigate} />;
  if (page === "about")      return <AboutPage onNavigate={handleNavigate} />;

  return <App onBackToLanding={() => setPage("landing")} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
