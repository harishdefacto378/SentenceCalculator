import React from 'react';
import { fmtNum, fmtRupees, daysToYMD } from '../../utils/formatters';

export function FactorSummary({ aggSentTotal, aggFineTotal, mitSentTotal, mitFineTotal, baseSentenceDays, baseFine, final, qtyEnabled, onCalc }) {
  const netSent = aggSentTotal - mitSentTotal;
  const netFine = aggFineTotal - mitFineTotal;
  return (
    <div className="card">
      <div className="card-head">
        <h2>Calculation on the Basis of Aggravating &amp; Mitigating Factors</h2>
        <div className="actions"><button className="btn calc-btn" disabled={!qtyEnabled} onClick={onCalc}>Calculate</button></div>
      </div>
      <div className="card-body">
        <div className="summary-grid">
          <div className="summary-row"><span>%age Increase/Decrease in SENTENCE:</span><span className={"v " + (netSent > 0 ? "v--positive" : netSent < 0 ? "v--negative" : "")}>{netSent}</span></div>
          <div className="summary-row"><span>%age Increase/Decrease in FINE:</span><span className={"v " + (netFine > 0 ? "v--positive" : netFine < 0 ? "v--negative" : "")}>{netFine}</span></div>
          <div className="summary-row"><span>NEW SENTENCE in day(s):</span><span className="v big">{fmtNum(final.sentenceDays)} days</span></div>
          <div className="summary-row"><span>NEW SENTENCE in year(s), month(s) and day(s):</span><span className="v">{daysToYMD(final.sentenceDays)}</span></div>
          <div className="summary-row"><span>NEW FINE (in Rupees):</span><span className="v big">{fmtRupees(final.fine)}</span></div>
        </div>
        <div className="banner cap">Default capped at 100%</div>
      </div>
    </div>
  );
}
