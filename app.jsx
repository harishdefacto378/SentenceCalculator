import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ENV from './src/config/env';
import LandingPage from './src/components/Landing/LandingPage';
import ComparisonPage from './src/components/Comparison/ComparisonPage';
import AboutPage from './src/components/About/AboutPage';
import { SUBSTANCES, UNITS, AGGRAVATING, MITIGATING } from './data';
import { fetchAndStoreToken } from "./src/services/authService";
import { fetchDrugList } from "./src/services/drugListService";
// ────────────────────────────────────────────────────────────────────────────
// Calculation helpers
// ────────────────────────────────────────────────────────────────────────────

// Calculation moved to Dataverse custom API. Front-end calls the configured
// API endpoint (`window.API_CALC_ENDPOINT` or `/api/calculate`) to receive
// the base sentence/fine. The client keeps only formatting helpers.

function daysToYMD(days) {
  if (!days) return { y: 0, m: 0, d: 0 };
  const y = Math.floor(days / 365);
  const rem = days % 365;
  const m = Math.floor(rem / 30.42);
  const d = Math.floor(rem % 30.42);
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
// Client-side sentence calculation from Dataverse drug record
// ────────────────────────────────────────────────────────────────────────────

const EMPTY_BASE = {
  section: "NA",
  sentenceDays: 0,
  sentenceInYearsMonthsDays: "0 year(s) 0 month(s) 0 day(s)",
  fine: "₹0.00",
  quantityType: "NA",
  quantityPercent: "0.00",
  _fineNum: 0,
};

function calculateSentence(drugRecord, quantityGrams) {
  if (!drugRecord) return { ...EMPTY_BASE };

  const safeNum = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };

  // Slab boundaries
  const smallQty      = safeNum(drugRecord.cr3e9_df_smallquantitygram);
  const commercialQty = safeNum(drugRecord.cr3e9_df_commercialquantitygram);
  const qty           = Math.max(0, safeNum(quantityGrams));

  // Commercial upper bound: if API provides it, use it; otherwise double commercial as fallback
  const commercialMaxQty = safeNum(drugRecord.cr3e9_df_commercialmaxquantitygram) || commercialQty * 2;

  // Sentence field helpers
  const sent = {
    smallMin:  safeNum(drugRecord.cr3e9_df_smallminsent),
    smallMax:  safeNum(drugRecord.cr3e9_df_smallmaxsent),
    interMin:  safeNum(drugRecord.cr3e9_df_interminsent),
    interMax:  safeNum(drugRecord.cr3e9_df_intermaxsent),
    commMin:   safeNum(drugRecord.cr3e9_df_commminsent),
    commMax:   safeNum(drugRecord.cr3e9_df_commmaxsent),
  };
  const fine = {
    smallMin:  safeNum(drugRecord.cr3e9_df_smallminfine),
    smallMax:  safeNum(drugRecord.cr3e9_df_smallmaxfine),
    interMin:  safeNum(drugRecord.cr3e9_df_interminfine),
    interMax:  safeNum(drugRecord.cr3e9_df_intermaxfine),
    commMin:   safeNum(drugRecord.cr3e9_df_commminfine),
    commMax:   safeNum(drugRecord.cr3e9_df_commmaxfine),
  };

  // Sentence rounding: decimal < 0.5 → floor, else ceil
  const roundSent = v => (v % 1 < 0.5) ? Math.floor(v) : Math.ceil(v);
  // Fine rounding: nearest 1000
  const roundFine = v => Math.round(v / 1000) * 1000;

  let type, section, rawSent, rawFine;

  if (qty < smallQty) {
    // ── SMALL ──────────────────────────────────────────────────────────────
    type    = "Small";
    section = drugRecord.cr3e9_df_punishableundersectionsmall        || "NA";

    const ratio = smallQty > 0 ? qty / smallQty : 0;
    rawSent = sent.smallMin + (sent.smallMax - sent.smallMin) * ratio;
    rawFine = smallQty > 0
      ? fine.smallMin + ((fine.smallMax - fine.smallMin) / smallQty) * qty
      : fine.smallMin;

  } else if (qty <= commercialQty) {
    // ── INTERMEDIATE ───────────────────────────────────────────────────────
    type    = "Intermediate";
    section = drugRecord.cr3e9_df_punishableundersectionintermediate || "NA";

    const interQty = commercialQty - smallQty;
    const ratio    = interQty > 0 ? (qty - smallQty) / interQty : 0;
    rawSent = sent.interMin + (sent.interMax - sent.interMin) * ratio;
    rawFine = interQty > 0
      ? fine.interMin + ((fine.interMax - fine.interMin) / interQty) * (qty - smallQty)
      : fine.interMin;

  } else {
    // ── COMMERCIAL ─────────────────────────────────────────────────────────
    type    = "Commercial";
    section = drugRecord.cr3e9_df_punishableundersectioncommercial   || "NA";

    const commQty = commercialMaxQty - commercialQty;
    const ratio   = commQty > 0 ? (qty - commercialQty) / commQty : 0;
    rawSent = sent.commMin + (sent.commMax - sent.commMin) * ratio;
    rawFine = commQty > 0
      ? fine.commMin + ((fine.commMax - fine.commMin) / commQty) * (qty - commercialQty)
      : fine.commMin;
  }

  // Clamp to [min, max] before rounding
  const clampedSent = Math.max(
    type === "Small" ? sent.smallMin : type === "Intermediate" ? sent.interMin : sent.commMin,
    Math.min(
      type === "Small" ? sent.smallMax : type === "Intermediate" ? sent.interMax : sent.commMax,
      rawSent
    )
  );
  const clampedFine = Math.max(
    type === "Small" ? fine.smallMin : type === "Intermediate" ? fine.interMin : fine.commMin,
    Math.min(
      type === "Small" ? fine.smallMax : type === "Intermediate" ? fine.interMax : fine.commMax,
      rawFine
    )
  );

  const sentenceDays              = Math.max(0, roundSent(clampedSent));
  const _fineNum                  = Math.max(0, roundFine(clampedFine));
  const sentenceInYearsMonthsDays = fmtYMD(daysToYMD(sentenceDays));
  const fineFormatted             = fmtRupees(_fineNum);

  // Percentage: quantity vs commercial upper limit
  const quantityPercent = commercialQty > 0
    ? ((qty / commercialQty) * 100).toFixed(2)
    : "0.00";

  return {
    section,
    sentenceDays,
    sentenceInYearsMonthsDays,
    fine: fineFormatted,
    quantityType: type,
    quantityPercent,
    _fineNum,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────────────────────

function ProportionalCalc({ state, setState, base, onCalc, calculated, drugsData }) {
  const subs                                  = drugsData.map(d => ({ name: d.cr3e9_df_drugidentifier, id: d.cr3e9_df_drugidentifier }));
  const [substanceInput, setSubstanceInput]   = useState(state.substance || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRecord, setSelectedRecord]   = useState(null);
  const [filtered, setFiltered]               = useState(subs);

  useEffect(() => {
    const q = substanceInput.trim().toLowerCase();
    setFiltered(q ? subs.filter(s => s.name.toLowerCase().includes(q)) : subs);
  }, [substanceInput, drugsData]);

  function handleSubstanceChange(e) {
    const val = e.target.value;
    setSubstanceInput(val);
    setSelectedRecord(null);
    setState({ ...state, substance: "" });
    setShowSuggestions(true);
  }

  function selectSuggestion(item) {
    setSubstanceInput(item.name);
    const record = drugsData.find(d =>
      (d.cr3e9_df_drugidentifier || "").toLowerCase() === item.name.toLowerCase()
    );
    setSelectedRecord(record || null);
    setState({ ...state, substance: item.name });
    setShowSuggestions(false);
  }

  function handleCalculate() {
    if (!selectedRecord || !state.qty) return;
    const qty = parseFloat(state.qty) || 0;
    onCalc(calculateSentence(selectedRecord, qty));
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>Proportional Calculation</h2>
        <div className="actions">
          <button className="btn ghost" onClick={() => {
            setState({ substance: "", qty: "", unit: "Gram", date: "" });
            setSubstanceInput("");
            setSelectedRecord(null);
            setShowSuggestions(false);
          }}>Reset</button>
        </div>
      </div>
      <div className="card-body">
        <div className="form-row">
          <label>Substance Name</label>
          <div style={{ position: "relative", width: 220 }}>
            <input
              className="input"
              style={{ width: "100%" }}
              placeholder="Search substance…"
              value={substanceInput}
              onChange={handleSubstanceChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              autoComplete="off"
            />
            {showSuggestions && filtered.length > 0 && (
              <ul style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                margin: 0, padding: 0, listStyle: "none",
                border: "1px solid #ccc", background: "#fff",
                zIndex: 100, maxHeight: 200, overflowY: "auto",
                borderRadius: "0 0 4px 4px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
              }}>
                {filtered.map(item => (
                  <li
                    key={item.id}
                    onMouseDown={() => selectSuggestion(item)}
                    style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14 }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
          <button className="btn" disabled={!state.substance || !state.qty} onClick={handleCalculate}>Calculate</button>
        </div>

        <div className="results">
          <div className="result-row"><span>Punishable Under Section:</span><span className="v">{calculated ? base.section : "NA"}</span></div>
          <div className="result-row"><span>Sentence in day(s):</span><span className="v big">{calculated ? base.sentenceDays : "0"}</span></div>
          <div className="result-row"><span>Sentence in year(s), month(s) and day(s):</span><span className="v">{calculated ? base.sentenceInYearsMonthsDays : "0 year(s) 0 month(s) 0 day(s)"}</span></div>
          <div className="result-row"><span>Fine (in Rupees):</span><span className="v big">{calculated ? base.fine : "₹0.00"}</span></div>
          <div className="result-row"><span>Quantity Type:</span><span className="v">{calculated ? base.quantityType : "NA"}</span></div>
          <div className="result-row"><span>Drug Quantity in % to Upper Limit of Intermediate:</span><span className="v">{calculated ? base.quantityPercent + "%" : "0%"}</span></div>
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
            <Spec k="Quantity Type" v={base.quantityType} />
            <Spec k="Base Sentence" v={base.sentenceInYearsMonthsDays} />
            <Spec k="Base Fine" v={base.fine} />
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

function App() {
  const navigate = useNavigate();

  // Drug list loaded ONCE at page mount — not inside calculation logic
  const [drugsData, setDrugsData] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetchDrugList()
      .then(data => { if (!cancelled) setDrugsData(data); })
      .catch(err => console.error("Failed to load drug list:", err.message));
    return () => { cancelled = true; };
  }, []);

  const [propState, setPropState] = useState({ substance: "", qty: "", unit: "Gram", date: new Date().toISOString().split('T')[0] });
  const [discState, setDiscState] = useState({ inc: 0, dec: 0 });
  const [aggravFactors, setAggravFactors] = useState(AGGRAVATING);
  const [mitigFactors, setMitigFactors] = useState(MITIGATING);
  const [calculated, setCalculated] = useState(true);
  const [reportTab, setReportTab]   = useState("sentence");
  const [fabActive, setFabActive]   = useState("home");

  const substance = useMemo(() =>
    SUBSTANCES.find(s => s.name === propState.substance),
    [propState.substance]
  );

  const qtyInGrams = useMemo(() => {
    const n = parseFloat(propState.qty);
    if (!isFinite(n)) return 0;
    return n * (UNITS[propState.unit] || 1);
  }, [propState.qty, propState.unit]);

  const [base, setBase] = useState({ ...EMPTY_BASE });

  const [discretion, setDiscretion] = useState({ sentenceDays: 0, fine: 0 });

  function handleCourtCalc() {
    const { sentenceDays, _fineNum } = base;

    // Validation: base must be populated from a proportional calculation
    if (!sentenceDays && !_fineNum) {
      alert("Please run the Proportional Calculation first.");
      return;
    }

    const inc = Number(discState.inc) || 0;
    const dec = Number(discState.dec) || 0;

    // Validation: both cannot be active at the same time
    if (inc > 0 && dec > 0) {
      alert("Please enter either an Increase % or a Decrease % — not both.");
      return;
    }

    let newDays, newFine;

    if (inc > 0) {
      newDays = sentenceDays + (sentenceDays * inc / 100);
      newFine = _fineNum    + (_fineNum    * inc / 100);
    } else if (dec > 0) {
      newDays = sentenceDays - (sentenceDays * dec / 100);
      newFine = _fineNum    - (_fineNum    * dec / 100);
    } else {
      // Both 0 — return base values unchanged
      newDays = sentenceDays;
      newFine = _fineNum;
    }

    setDiscretion({
      sentenceDays: Math.round(newDays),
      fine:         Math.round(newFine),
    });

    toast("Discretion applied");
  }

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
      `Quantity Type: ${base.quantityType}`,
      `Base Sentence: ${base.sentenceInYearsMonthsDays}`,
      `Base Fine: ${base.fine}`,
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
            drugsData={drugsData}
            onCalc={(result) => { setBase(result); setCalculated(true); toast("Proportional calculation updated"); }}
          />
          <ReportCard substance={substance} base={base} discretion={discretion} final={final} tab={reportTab} setTab={setReportTab} onCopy={copyReport} />
        </div>

        <div className="col">
          <DiscretionCalc
            state={discState} setState={setDiscState}
            base={base} discretion={discretion}
            calculated={calculated} onCalc={handleCourtCalc}
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

      <FabBar active={fabActive} setActive={setFabActive} onHome={() => navigate('/')} />

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
// Router — defines all routes and manages browser nav side-effects
// ────────────────────────────────────────────────────────────────────────────

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'var(--font-sans, sans-serif)' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>404 — Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate('/')}
        style={{ padding: '10px 24px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc' }}
      >
        Back to Home
      </button>
    </div>
  );
}

function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const header = document.getElementById("app-header");
    if (header) header.style.display = location.pathname === '/calculator' ? "" : "none";
  }, [location]);

  useEffect(() => {
    const routeMap = { landing: '/', calculator: '/calculator', comparison: '/comparison', about: '/about' };
    window.__navigate = (to) => navigate(routeMap[to] || '/');
    return () => { window.__navigate = null; };
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/calculator" element={<App />} />
      <Route path="/comparison" element={<ComparisonPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppRouter />
  </BrowserRouter>
);
