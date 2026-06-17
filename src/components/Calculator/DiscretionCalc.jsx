import React from 'react';
import { fmtNum, fmtRupees, fmtYMD, daysToYMD } from '../../utils/formatters';

export function DiscretionCalc({ state, setState, base, discretion, onCalc, calculated, qtyEnabled }) {
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
        <div className="calc-action calc-action--top">
          <button className="btn calc-btn" disabled={!qtyEnabled} onClick={onCalc}>Calculate</button>
        </div>
        <div className="results">
          <div className="result-row"><span>SENTENCE in day(s):</span><span className="v big">{discretion ? fmtNum(discretion.sentenceDays) + " days" : "0 days"}</span></div>
          <div className="result-row"><span>SENTENCE in year(s), month(s) and day(s):</span><span className="v">{discretion?.ymd ? fmtYMD(discretion.ymd) : "0 year(s) 0 month(s) 0 day(s)"}</span></div>
          <div className="result-row"><span>FINE (in Rupees):</span><span className="v big">{discretion ? fmtRupees(discretion.fine) : "₹0.00"}</span></div>
        </div>
      </div>
    </div>
  );
}
