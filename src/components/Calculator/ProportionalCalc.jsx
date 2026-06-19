import React, { useState, useMemo } from 'react';
import { calculateSentence } from '../../utils/calculateSentence';
import { daysToYMD, fmtRupees } from '../../utils/formatters';
import { UNITS, UNIT_LABELS } from '../../../data';
import { WarningModal } from './WarningModal';

export function ProportionalCalc({ state, setState, base, onCalc, calculated, qtyEnabled, drugsData, onSelect }) {
  const [substanceInput, setSubstanceInput] = useState(state.substance || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRecord, setSelectedRecord]   = useState(null);
  const [showWarning, setShowWarning]         = useState(false);
  const today = new Date().toISOString().split("T")[0];

  // useMemo replaces the old useState+useEffect pattern — single render per keystroke
  const subs = useMemo(
    () => drugsData.map(d => ({ name: d.cr3e9_df_drugidentifier, id: d.cr3e9_df_drugidentifier })),
    [drugsData]
  );
  const filtered = useMemo(() => {
    const q = substanceInput.trim().toLowerCase();
    return q ? subs.filter(s => s.name.toLowerCase().includes(q)) : subs;
  }, [substanceInput, subs]);

  function handleSubstanceChange(e) {
    const val = e.target.value;
    setSubstanceInput(val);
    setSelectedRecord(null);
    onSelect(null);
    if (!val.trim()) {
      setState({ ...state, substance: "", qty: "" });
    } else {
      setState({ ...state, substance: "" });
    }
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

  function handleCalculateClick() {
  if (!selectedRecord || !state.qty) return;

  const qty = parseFloat(state.qty) || 0;
  const qtyInGrams = qty * (UNITS[state.unit] || 1);

  const calculatedResult = calculateSentence(selectedRecord, qtyInGrams);

  const isCommercial = calculatedResult.quantityType === "Commercial";

  // 🟢 NORMAL CASE
  if (!isCommercial) {
    onCalc(calculatedResult);
    onSelect(selectedRecord);
    return;
  }

 // 🔴 COMMERCIAL CASE → CALCULATE DYNAMIC PERCENTAGE
 const commercialQty = selectedRecord?.cr3e9_df_commercialquantitygram || 1;
 const drugPercentage = commercialQty > 0
   ? ((qtyInGrams / commercialQty) * 100).toFixed(2)
   : 'NA';

 const staticResult = {
   section: "S.21(c) of NDPS Act, 1985",
   sentenceDays: "As per discretion of the Court, however, minimum sentence is 10 years",
   sentenceInYearsMonthsAndDays: "As per discretion of the Court, however, minimum sentence is 10 years",
   fine: "As per discretion of the Court, however, minimum fine is 1,00,000/-",
   quantityType: "Commercial",
   quantityPercent: drugPercentage, // ✅ MATCH UI EXPECTATION
   drugQuantityPercentToUpperIntermediate: `${drugPercentage}%`,
   message: "This calculator is designed only for small and intermediate quantities. In commercial quantities the minimum sentence is 10 years and fine is 1,00,000/-"
 };

 // ❗ ONLY STATIC DATA SENT TO UI
 onCalc(staticResult);
 onSelect(selectedRecord);
 setShowWarning(true);
}

  return (
    <>
      <WarningModal open={showWarning} onClose={() => setShowWarning(false)} />
      <div className="card">
        <div className="card-head">
          <h2>Proportional Calculation</h2>
          <div className="actions">
            <button className="btn ghost" onClick={() => {
              setState({ substance: "", qty: "", unit: "g", date: "" });
              setSubstanceInput("");
              setSelectedRecord(null);
              setShowSuggestions(false);
              onSelect(null);
            }}>Reset</button>
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <label>Substance Name</label>
            <div className="substance-wrap">
              <input
                className="input"
                placeholder="Search substance…"
                value={substanceInput}
                onChange={handleSubstanceChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
              />
              {showSuggestions && filtered.length > 0 && (
                <ul className="substance-suggestions">
                  {filtered.map(item => (
                    <li
                      key={item.id}
                      onMouseDown={() => selectSuggestion(item)}
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
            <div className="field-inline">
              <input className="input num" placeholder="0" value={state.qty} onChange={e => setState({ ...state, qty: e.target.value.replace(/[^\d.]/g, "") })} />
              <select className="select" value={state.unit} onChange={e => setState({ ...state, unit: e.target.value })}>
                {Object.keys(UNITS).map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <label>Date of Confiscation <span className="sub-label">(optional)</span></label>
            <input
              className="input date-input"
              type="date"
              max={today}
              value={state.date}
              onChange={e => {
                const value = e.target.value;
                if (value && value > today) return;
                setState({ ...state, date: value });
              }}
            />
          </div>
          <div className="calc-action">
            <button className="btn calc-btn" disabled={!qtyEnabled} onClick={handleCalculateClick}>Calculate</button>
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
    </>
  );
}
