const { useState, useMemo } = React;

const SCENARIO_COLORS = ["#6e36a7", "#2c8a3e", "#b8860b", "#c50f1f", "#1e6a3e", "#5b2c8e"];

// --- Same proportional logic as the main app ---
function computeProportional(substance, qty) {
  if (!substance || !qty || qty <= 0) return { sentenceDays: 0, fine: 0, type: "NA", pctOfUpper: 0, section: "NA" };
  const { smallQty, commercialQty, section } = substance;
  let type, pctOfUpper, sentenceDays, fine;
  if (qty < smallQty) {
    type = "Small Quantity"; pctOfUpper = 0;
    const r = qty / smallQty;
    sentenceDays = Math.round(365 * r); fine = Math.round(10000 * r);
  } else if (qty >= commercialQty) {
    type = "Commercial Quantity"; pctOfUpper = 100;
    const over = Math.min(1, (qty - commercialQty) / (commercialQty * 4));
    sentenceDays = Math.round((10 + over * 10) * 365); fine = Math.round(100000 + over * 100000);
  } else {
    type = "Intermediate Quantity";
    const r = (qty - smallQty) / (commercialQty - smallQty);
    pctOfUpper = Math.round(r * 100);
    sentenceDays = Math.round((1 + r * 9) * 365); fine = Math.round(10000 + r * 90000);
  }
  return { sentenceDays, fine, type, pctOfUpper, section };
}

function daysToYMD(d) { if (!d) return "0y 0m 0d"; const y = Math.floor(d/365), r = d - y*365, m = Math.floor(r/30); return `${y}y ${m}m ${r - m*30}d`; }
function fmtRupees(n) { return "₹" + (n || 0).toLocaleString("en-IN"); }
function fmtNum(n) { return (n || 0).toLocaleString("en-IN"); }

function ScenarioCell({ s, idx, isBest, isWorst }) {
  return (
    <div className="scenario-header">
      <span className="dot" style={{ background: SCENARIO_COLORS[idx % SCENARIO_COLORS.length] }}></span>
      <div>
        <div className="name">{s.label}</div>
        <div className="meta">{s.qty} {s.unit} · disc {s.inc - s.dec > 0 ? "+" : ""}{s.inc - s.dec}% · fac {s.aggrav - s.mitig > 0 ? "+" : ""}{s.aggrav - s.mitig}%</div>
      </div>
      {isBest && <span className="badge best">Min</span>}
      {isWorst && <span className="badge worst">Max</span>}
    </div>
  );
}

function ValCell({ v, small, max, idx, isBest, isWorst }) {
  const w = max ? Math.min(100, (v / max) * 100) : 0;
  return (
    <div className="bar-cell">
      <div className="bar"><i className={"s" + idx} style={{ width: w + "%" }}></i></div>
      <span className={"num " + (isBest ? "best" : isWorst ? "worst" : "")}>{small}</span>
    </div>
  );
}

function Builder({ onAdd, draft, setDraft }) {
  const sub = window.SUBSTANCES.find(s => s.name === draft.substance);
  return (
    <div className="card-body">
      <div className="builder">
        <select className="select" value={draft.substance} onChange={e => setDraft({ ...draft, substance: e.target.value })}>
          {window.SUBSTANCES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <input className="input num" placeholder="Qty" value={draft.qty}
          onChange={e => setDraft({ ...draft, qty: e.target.value.replace(/[^\d.]/g, "") })} />
        <select className="select" value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })}>
          {Object.keys(window.UNITS).map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Discretion</span>
          <input className="input num" style={{ width: 64 }} placeholder="+%" value={draft.inc}
            onChange={e => setDraft({ ...draft, inc: Math.max(0, Math.min(100, +e.target.value || 0)) })} />
          <input className="input num" style={{ width: 64 }} placeholder="-%" value={draft.dec}
            onChange={e => setDraft({ ...draft, dec: Math.max(0, Math.min(100, +e.target.value || 0)) })} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Factors</span>
          <input className="input num" style={{ width: 64 }} placeholder="Ag%" value={draft.aggrav}
            onChange={e => setDraft({ ...draft, aggrav: Math.max(0, Math.min(100, +e.target.value || 0)) })} />
          <input className="input num" style={{ width: 64 }} placeholder="Mt%" value={draft.mitig}
            onChange={e => setDraft({ ...draft, mitig: Math.max(0, Math.min(100, +e.target.value || 0)) })} />
        </div>
        <button className="btn" onClick={onAdd} disabled={!sub || !draft.qty}>+ Add scenario</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)" }}>
        Label auto-generates from substance &amp; quantity. Add up to 6 scenarios — best (lowest) and worst (highest) sentence are highlighted.
      </div>
    </div>
  );
}

function App() {
  const [scenarios, setScenarios] = useState([
    { id: 1, substance: "Heroin (Diacetylmorphine)", qty: 4,   unit: "Gram", inc: 0,  dec: 0,  aggrav: 0,  mitig: 0,  label: "Heroin · 4 g (small)" },
    { id: 2, substance: "Heroin (Diacetylmorphine)", qty: 50,  unit: "Gram", inc: 0,  dec: 0,  aggrav: 20, mitig: 10, label: "Heroin · 50 g (intermediate)" },
    { id: 3, substance: "Heroin (Diacetylmorphine)", qty: 300, unit: "Gram", inc: 10, dec: 0,  aggrav: 30, mitig: 5,  label: "Heroin · 300 g + aggrav." },
    { id: 4, substance: "Cannabis (Ganja)",          qty: 25,  unit: "Kilogram", inc: 0,  dec: 5, aggrav: 10, mitig: 15, label: "Ganja · 25 kg (commercial)" },
  ]);
  const [draft, setDraft] = useState({ substance: "Heroin (Diacetylmorphine)", qty: "20", unit: "Gram", inc: 0, dec: 0, aggrav: 0, mitig: 0 });
  const [view, setView] = useState("table");

  const computed = useMemo(() => scenarios.map(s => {
    const sub = window.SUBSTANCES.find(x => x.name === s.substance);
    const qtyG = (+s.qty || 0) * (window.UNITS[s.unit] || 1);
    const base = computeProportional(sub, qtyG);
    const discMul = 1 + (s.inc - s.dec) / 100;
    const facMul = 1 + (s.aggrav - s.mitig) / 100;
    const finalDays = Math.max(0, Math.round(base.sentenceDays * discMul * facMul));
    const finalFine = Math.max(0, Math.round(base.fine * discMul * facMul));
    return { ...s, sub, base, finalDays, finalFine, section: base.section, type: base.type };
  }), [scenarios]);

  const maxDays = Math.max(1, ...computed.map(c => c.finalDays));
  const maxFine = Math.max(1, ...computed.map(c => c.finalFine));
  const minDays = computed.length ? Math.min(...computed.map(c => c.finalDays)) : 0;
  const maxFineV = computed.length ? Math.max(...computed.map(c => c.finalFine)) : 0;
  const minFine = computed.length ? Math.min(...computed.map(c => c.finalFine)) : 0;
  const maxDaysV = computed.length ? Math.max(...computed.map(c => c.finalDays)) : 0;
  const bestIdx = computed.findIndex(c => c.finalDays === minDays);
  const worstIdx = computed.findIndex(c => c.finalDays === maxDaysV);

  const avgDays = computed.length ? Math.round(computed.reduce((a, c) => a + c.finalDays, 0) / computed.length) : 0;
  const avgFine = computed.length ? Math.round(computed.reduce((a, c) => a + c.finalFine, 0) / computed.length) : 0;
  const totalFine = computed.reduce((a, c) => a + c.finalFine, 0);

  function addScenario() {
    const sub = window.SUBSTANCES.find(s => s.name === draft.substance);
    if (!sub || !draft.qty) return;
    const id = Date.now();
    const label = `${sub.name.split(" ")[0]} · ${draft.qty} ${draft.unit === "Gram" ? "g" : draft.unit === "Kilogram" ? "kg" : "mg"}`;
    setScenarios([...scenarios, { id, label, ...draft, qty: +draft.qty }].slice(0, 6));
  }
  function removeScenario(id) { setScenarios(scenarios.filter(s => s.id !== id)); }

  return (
    <div className="shell">
      <h2 className="page-title">Sentence &amp; Fine Comparison <span className="subtle">— compare up to six scenarios side-by-side</span></h2>

      {/* Builder card */}
      <div className="card">
        <div className="card-head">
          <h2>Build scenarios</h2>
          <div className="toolbar">
            <button className={"btn outline " + (view === "table" ? "active" : "")} onClick={() => setView("table")}>Table</button>
            <button className={"btn outline " + (view === "chart" ? "active" : "")} onClick={() => setView("chart")}>Chart</button>
            <button className={"btn outline " + (view === "spectrum" ? "active" : "")} onClick={() => setView("spectrum")}>Spectrum</button>
            <button className="btn ghost" onClick={() => setScenarios([])}>Clear all</button>
          </div>
        </div>
        <div className="chips">
          {scenarios.length === 0 && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>No scenarios — add one below to begin.</span>}
          {scenarios.map((s, i) => (
            <span key={s.id} className="chip-sw">
              <span className="swatch" style={{ background: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}></span>
              {s.label}
              <button className="x" onClick={() => removeScenario(s.id)} aria-label="Remove">×</button>
            </span>
          ))}
        </div>
        <Builder onAdd={addScenario} draft={draft} setDraft={setDraft} />
      </div>

      {/* KPI Summary */}
      {computed.length > 0 && (
        <div className="card">
          <div className="kpis">
            <div className="kpi brand">
              <div className="k">Scenarios compared</div>
              <div className="v">{computed.length}<small>/ 6 max</small></div>
            </div>
            <div className="kpi">
              <div className="k">Range — sentence</div>
              <div className="v">{daysToYMD(minDays)} <small>→ {daysToYMD(maxDaysV)}</small></div>
            </div>
            <div className="kpi">
              <div className="k">Range — fine</div>
              <div className="v">{fmtRupees(minFine)} <small>→ {fmtRupees(maxFineV)}</small></div>
            </div>
            <div className="kpi">
              <div className="k">Average</div>
              <div className="v">{daysToYMD(avgDays)} <small>· {fmtRupees(avgFine)}</small></div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE view */}
      {view === "table" && computed.length > 0 && (
        <div className="card">
          <div className="card-head"><h2>Detailed comparison</h2></div>
          <div className="ct-wrap">
            <table className="ct">
              <thead>
                <tr>
                  <th className="metric">Metric</th>
                  {computed.map((c, i) => {
                    const isBest = i === bestIdx, isWorst = i === worstIdx && bestIdx !== worstIdx;
                    return <th key={c.id} className={"col " + (isBest ? "best" : isWorst ? "worst" : "")}>
                      <ScenarioCell s={c} idx={i} isBest={isBest} isWorst={isWorst} />
                    </th>;
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="group-header"><td colSpan={1 + computed.length}>Inputs</td></tr>
                <tr>
                  <td className="metric-name">Substance<small>Punishable under section</small></td>
                  {computed.map(c => <td key={c.id}><div className="val">{c.sub?.name || "—"}<small>{c.section}</small></div></td>)}
                </tr>
                <tr>
                  <td className="metric-name">Quantity</td>
                  {computed.map(c => <td key={c.id}><div className="val">{fmtNum(c.qty)} {c.unit}<small>{c.type}</small></div></td>)}
                </tr>
                <tr>
                  <td className="metric-name">Discretion</td>
                  {computed.map(c => <td key={c.id}><div className="val">+{c.inc}% / −{c.dec}%<small>net {c.inc - c.dec > 0 ? "+" : ""}{c.inc - c.dec}%</small></div></td>)}
                </tr>
                <tr>
                  <td className="metric-name">Factors</td>
                  {computed.map(c => <td key={c.id}><div className="val">↑{c.aggrav}% / ↓{c.mitig}%<small>net {c.aggrav - c.mitig > 0 ? "+" : ""}{c.aggrav - c.mitig}%</small></div></td>)}
                </tr>

                <tr className="group-header"><td colSpan={1 + computed.length}>Sentence</td></tr>
                <tr>
                  <td className="metric-name">Base sentence<small>before discretion &amp; factors</small></td>
                  {computed.map((c, i) => <td key={c.id}><ValCell v={c.base.sentenceDays} small={daysToYMD(c.base.sentenceDays)} max={maxDays} idx={i} /></td>)}
                </tr>
                <tr>
                  <td className="metric-name">Final sentence<small>after all adjustments</small></td>
                  {computed.map((c, i) => {
                    const isBest = c.finalDays === minDays, isWorst = c.finalDays === maxDaysV && minDays !== maxDaysV;
                    return <td key={c.id}><ValCell v={c.finalDays} small={daysToYMD(c.finalDays)} max={maxDays} idx={i} isBest={isBest} isWorst={isWorst} /></td>;
                  })}
                </tr>
                <tr>
                  <td className="metric-name">Days only</td>
                  {computed.map(c => <td key={c.id}><div className="val">{fmtNum(c.finalDays)}<small>days</small></div></td>)}
                </tr>

                <tr className="group-header"><td colSpan={1 + computed.length}>Fine</td></tr>
                <tr>
                  <td className="metric-name">Base fine</td>
                  {computed.map((c, i) => <td key={c.id}><ValCell v={c.base.fine} small={fmtRupees(c.base.fine)} max={maxFine} idx={i} /></td>)}
                </tr>
                <tr>
                  <td className="metric-name">Final fine</td>
                  {computed.map((c, i) => {
                    const isBest = c.finalFine === minFine, isWorst = c.finalFine === maxFineV && minFine !== maxFineV;
                    return <td key={c.id}><ValCell v={c.finalFine} small={fmtRupees(c.finalFine)} max={maxFine} idx={i} isBest={isBest} isWorst={isWorst} /></td>;
                  })}
                </tr>
                <tr>
                  <td className="metric-name">Fine per day of sentence</td>
                  {computed.map(c => <td key={c.id}><div className="val">{fmtRupees(c.finalDays ? Math.round(c.finalFine / c.finalDays) : 0)}<small>₹ / day</small></div></td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHART view */}
      {view === "chart" && computed.length > 0 && (
        <div className="card chart-card">
          <div className="chart-row">
            <div>
              <div className="chart-label">Sentence (years)</div>
              <div className="h-chart">
                {computed.map((c, i) => {
                  const yrs = +(c.finalDays / 365).toFixed(2);
                  const w = (c.finalDays / maxDays) * 100;
                  return (
                    <div className="row" key={c.id}>
                      <div className="lbl"><span className="dot" style={{ background: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}></span>{c.label}</div>
                      <div className="bar"><i style={{ width: w + "%", background: SCENARIO_COLORS[i % SCENARIO_COLORS.length], opacity: 0.85 }}></i><span className="num">{yrs} yr</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="chart-label">Fine (₹)</div>
              <div className="h-chart">
                {computed.map((c, i) => {
                  const w = (c.finalFine / maxFine) * 100;
                  return (
                    <div className="row" key={c.id}>
                      <div className="lbl"><span className="dot" style={{ background: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}></span>{c.label}</div>
                      <div className="bar"><i style={{ width: w + "%", background: SCENARIO_COLORS[i % SCENARIO_COLORS.length], opacity: 0.85 }}></i><span className="num">{fmtRupees(c.finalFine)}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPECTRUM view — pins on a 0-20 year scale */}
      {view === "spectrum" && computed.length > 0 && (
        <div className="card">
          <div className="card-head"><h2>Sentence spectrum · 0 → 20 years</h2></div>
          <div className="spectrum">
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Each pin marks a scenario's final sentence on the statutory spectrum.</div>
            <div className="scale">
              <div className="ticks">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
              {computed.map((c, i) => {
                const yrs = c.finalDays / 365;
                const pos = Math.min(100, (yrs / 20) * 100);
                return (
                  <div className="pin" key={c.id} style={{ left: pos + "%", background: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}>
                    <span className="pin-label">{c.label} · {yrs.toFixed(1)}y</span>
                  </div>
                );
              })}
            </div>
            <div className="ax">
              <span>0y</span><span>2y</span><span>4y</span><span>6y</span><span>8y</span>
              <span>10y</span><span>12y</span><span>14y</span><span>16y</span><span>18y</span><span>20y</span>
            </div>
            <div style={{ marginTop: 18, fontSize: 11.5, color: "var(--ink-3)", display: "flex", gap: 18, flexWrap: "wrap" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 50, background: "#9fd89f", marginRight: 6, verticalAlign: "middle" }}></span>Small / lower intermediate</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 50, background: "#f6c187", marginRight: 6, verticalAlign: "middle" }}></span>Upper intermediate</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 50, background: "#f1bbbc", marginRight: 6, verticalAlign: "middle" }}></span>Commercial · 10 — 20 yrs</span>
            </div>
          </div>
        </div>
      )}

      {computed.length === 0 && (
        <div className="card"><div className="empty">No scenarios yet. Add one above to start the comparison.</div></div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
