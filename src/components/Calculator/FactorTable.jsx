import React, { useState } from 'react';

export function FactorTable({ kind, factors, setFactors, totalSent, totalFine }) {
  const isAggrav     = kind === "aggrav";
  const arrow        = isAggrav ? "↑" : "↓";
  const heading      = isAggrav ? "Aggravating Factors Considered By The Court" : "Mitigating Factors Considered By the Court";
  const headLbl      = isAggrav ? "Aggravating Factors" : "Mitigating Factors";
  const sentColLbl   = isAggrav ? "Increase in Sentence (%)" : "Decrease in Sentence (%)";
  const fineColLbl   = isAggrav ? "Increase in Fine (%)" : "Decrease in Fine (%)";
  const [custom, setCustom] = useState("");

  function setField(id, key, val) {
    const cleaned = String(val).replace(/^\+/, "");
    const parsedValue = Math.max(0, Math.min(100, +cleaned || 0));
    setFactors(
      factors.map((f) => {
        if (f.id !== id) return f;
        if (key === "sentence") {
          return { ...f, sentence: parsedValue, fine: parsedValue };
        }
        return { ...f, [key]: parsedValue };
      })
    );
  }
  function addCustom() {
    if (!custom.trim()) return;
    setFactors([...factors, { id: kind + "-c" + Date.now(), label: custom.trim(), sentence: 0, fine: 0, avg: 0, custom: true }]);
    setCustom("");
  }

  return (
    <div className="card">
      <div className={"card-head card-head--no-border card-head--" + kind}>
        <h2>{heading}</h2>
        <div className="actions"><button className="btn ghost" onClick={() => setFactors(factors.map(f => ({ ...f, sentence: 0, fine: 0 })))}>Reset</button></div>
      </div>
      <div className={"table-scroll " + (!isAggrav ? "table-scroll--mitig" : "")}>
        <div className="table-head">
          <div></div>
          <div className="table-head-label">{headLbl}</div>
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
                  <div className="factor-option-list">
                    {f.options.map(o => (
                      <label key={o} className="factor-option-label">
                        <input type="radio" name={f.id} /> {o}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="cell"><input className="input sm" type="text" inputMode="numeric" pattern="[0-9]*" value={f.sentence} onChange={e => setField(f.id, "sentence", e.target.value.replace(/[^\d]/g, ""))} /></div>
              <div className="cell"><input className="input sm" type="text" inputMode="numeric" pattern="[0-9]*" value={f.fine} onChange={e => setField(f.id, "fine", e.target.value.replace(/[^\d]/g, ""))} /></div>
              <div className="cell"><input className="input sm avg" readOnly value={f.avg + "%"} /></div>
            </div>
          ))}
        </div>
        <div className="table-foot">
          <div className="label">{isAggrav ? "Total Increase in Sentence (%)" : "Total Decrease in Sentence (%)"}</div>
          <div className={"val " + (isAggrav ? "aggrav" : "mitig")}>{totalSent}%</div>
          <div className={"val " + (isAggrav ? "aggrav" : "mitig")}>{totalFine}%</div>
        </div>
      </div>
      <div className="custom-row">
        <input placeholder={isAggrav ? "Enter Custom Aggravating Factor" : "Enter Custom Mitigating Factor"} value={custom} onChange={e => setCustom(e.target.value)} />
        <button className="btn" disabled={!custom.trim()} onClick={addCustom}>Add</button>
      </div>
    </div>
  );
}
