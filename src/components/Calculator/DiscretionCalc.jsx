import React from 'react';
import { fmtNum, fmtRupees, fmtYMD } from '../../utils/formatters';

export function DiscretionCalc({ state, setState, base, discretion, onCalc, calculated, qtyEnabled }) {
  const isCommercial = base?.quantityType === "Commercial";
  const commercialSentenceText = "As per discretion of the Court, however, minimum sentence is 10 years";
  const commercialFineText = "As per discretion of the Court, however, minimum fine is 1,00,000/-";
  const setPctField = (key, rawValue) => {
    if (rawValue === "") {
      setState({ ...state, [key]: "" });
      return;
    }
    const cleaned = rawValue.replace(/^\+/, "");
    const numeric = Number(cleaned);
    if (!Number.isFinite(numeric)) return;
    const clamped = Math.max(0, Math.min(100, numeric));
    setState({ ...state, [key]: clamped });
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>Calculation as per Discretion of the Court</h2>
        <div className="actions"><button className="btn ghost" onClick={() => setState({ inc: 0, dec: 0 })}>Reset</button></div>
      </div>
      <div className="card-body">
        <div className="form-row">
          <label>%age Increase in SENTENCE/FINE<span className="sub-label">(System default 0%)</span></label>
          <input className="input sm discretion-pct" type="number" min="0" max="100" disabled={isCommercial} value={state.inc ?? ""} onChange={e => setPctField("inc", e.target.value)} />
        </div>
        <div className="form-row">
          <label>%age Decrease in SENTENCE/FINE<span className="sub-label">(System default 0%)</span></label>
          <input className="input sm discretion-pct" type="number" min="0" max="100" disabled={isCommercial} value={state.dec ?? ""} onChange={e => setPctField("dec", e.target.value)} />
        </div>
        <div className="banner">We strongly recommend to decrease default to make median at 50%</div>
        <div className="calc-action calc-action--top">
          <button className="btn calc-btn" disabled={!qtyEnabled || isCommercial} onClick={onCalc}>Calculate</button>
        </div>
        <div className="results">
          <div className={isCommercial ? "result-row result-row--message" : "result-row"}><span>SENTENCE in day(s):</span><span className={isCommercial ? "v v--normal" : "v big"}>{isCommercial ? commercialSentenceText : discretion ? fmtNum(discretion.sentenceDays) + " days" : "0 days"}</span></div>
          <div className={isCommercial ? "result-row result-row--message" : "result-row"}><span>SENTENCE in year(s), month(s) and day(s):</span><span className={isCommercial ? "v v--normal" : "v"}>{isCommercial ? commercialSentenceText : discretion?.ymd ? fmtYMD(discretion.ymd) : "0 year(s) 0 month(s) 0 day(s)"}</span></div>
          <div className={isCommercial ? "result-row result-row--message" : "result-row"}><span>FINE (in Rupees):</span><span className={isCommercial ? "v v--normal" : "v big"}>{isCommercial ? commercialFineText : discretion ? fmtRupees(discretion.fine) : "₹0.00"}</span></div>
        </div>
      </div>
    </div>
  );
}
