import React, { useState, useMemo } from 'react';
import { calculateSentence } from '../../utils/calculateSentence';
import { UNITS, UNIT_LABELS } from '../../../data';
import { WarningModal } from './WarningModal';

export function ProportionalCalc({ state, setState, base, onCalc, calculated, drugsData, onSelect }) {
  const [substanceInput, setSubstanceInput] = useState(state.substance || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRecord, setSelectedRecord]   = useState(null);
  const [showWarning, setShowWarning]         = useState(false);

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

  function handleCalculateClick() {
    if (!selectedRecord || !state.qty) return;
    const qty = parseFloat(state.qty) || 0;
    const qtyInGrams = qty * (UNITS[state.unit] || 1);

    if (qtyInGrams > 500) {
      const commercialMsg = "As per discretion of the Court, however, minimum sentence is 10 years";
      onCalc({
        section:                   "S.22(c) of NDPS Act, 1985",
        sentenceDays:              commercialMsg,
        sentenceInYearsMonthsDays: commercialMsg,
        fine:                      "As per discretion of the Court, however, minimum fine is 1,00,000/-",
        quantityType:              "Commercial",
        quantityPercent:           "100.20",
        _fineNum:                  0,
      });
      onSelect(selectedRecord);
      setShowWarning(true);
      return;
    }

    onCalc(calculateSentence(selectedRecord, qtyInGrams));
    onSelect(selectedRecord);
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
            <div className="substance-wrap" style={{ position: "relative" }}>
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
            <div className="field-inline">
              <input className="input num" placeholder="0" value={state.qty} onChange={e => setState({ ...state, qty: e.target.value.replace(/[^\d.]/g, "") })} />
              <select className="select" value={state.unit} onChange={e => setState({ ...state, unit: e.target.value })}>
                {Object.keys(UNITS).map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <label>Date of Confiscation <span className="sub-label">(optional)</span></label>
            <input className="input date-input" type="date" value={state.date} onChange={e => setState({ ...state, date: e.target.value })} />
          </div>
          <div className="calc-action">
            <button className="btn" disabled={!state.substance || !state.qty} onClick={handleCalculateClick}>Calculate</button>
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
