import React, { useState, useMemo } from 'react';
import { AGGRAVATING, MITIGATING, UNITS } from '../../../data';
import { EMPTY_BASE } from '../../utils/calculateSentence';
import { fmtRupees, fmtYMD, daysToYMD } from '../../utils/formatters';
import { useDrugList }  from '../../hooks/useDrugList';
import { useToast }     from '../../hooks/useToast';
import { useCourtCalc } from '../../hooks/useCourtCalc';
import { Toast }          from '../Toast';
import { ProportionalCalc } from './ProportionalCalc';
import { DiscretionCalc }   from './DiscretionCalc';
import { FactorTable }      from './FactorTable';
import { FactorSummary }    from './FactorSummary';
import { ReportCard }       from './ReportCard';
import { FabBar }           from './FabBar';

export function CalculatorPage() {
  const drugsData = useDrugList();
  const { toastState, showToast } = useToast();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [propState, setPropState] = useState({
    substance: "", qty: "", unit: "g",
    date: new Date().toISOString().split('T')[0],
  });
  const [discState,     setDiscState]     = useState({ inc: 0, dec: 0 });
  const [aggravFactors, setAggravFactors] = useState(AGGRAVATING);
  const [mitigFactors,  setMitigFactors]  = useState(MITIGATING);
  const [calculated,    setCalculated]    = useState(false);  // fix: was incorrectly true
  const [reportTab,     setReportTab]     = useState("sentence");
  const [fabActive,     setFabActive]     = useState("home");
  const [substance,     setSubstance]     = useState(null);
  const [base,          setBase]          = useState({ ...EMPTY_BASE });

  // Quantity in grams — derived, not stored
  const qtyInGrams = useMemo(() => {
    const n = parseFloat(propState.qty);
    if (!isFinite(n)) return 0;
    return n * (UNITS[propState.unit] || 1);
  }, [propState.qty, propState.unit]);
  const isQtyValid = useMemo(() => {
    if (propState.qty == null || propState.qty === "") return false;
    return Number.isFinite(parseFloat(propState.qty));
  }, [propState.qty]);

  // Court discretion calculation — logic lives in hook, state owned by hook
  const { discretion, handleCourtCalc } = useCourtCalc({
    base, discState, substance, qtyInGrams, showToast,
  });

  // ── Factor totals (capped at 100%) ─────────────────────────────────────────
  const aggSentTotal = useMemo(() => Math.min(100, aggravFactors.reduce((a, f) => a + (+f.sentence || 0), 0)), [aggravFactors]);
  const aggFineTotal = useMemo(() => Math.min(100, aggravFactors.reduce((a, f) => a + (+f.fine     || 0), 0)), [aggravFactors]);
  const mitSentTotal = useMemo(() => Math.min(100, mitigFactors.reduce ((a, f) => a + (+f.sentence || 0), 0)), [mitigFactors]);
  const mitFineTotal = useMemo(() => Math.min(100, mitigFactors.reduce ((a, f) => a + (+f.fine     || 0), 0)), [mitigFactors]);

  // ── Final sentence after factors ───────────────────────────────────────────
  const final = useMemo(() => {
    const sentNet = (aggSentTotal - mitSentTotal) / 100;
    const fineNet = (aggFineTotal - mitFineTotal) / 100;
    return {
      sentenceDays: Math.max(0, Math.round(discretion.sentenceDays * (1 + sentNet))),
      fine:         Math.max(0, Math.round(discretion.fine         * (1 + fineNet))),
    };
  }, [discretion, aggSentTotal, aggFineTotal, mitSentTotal, mitFineTotal]);

  // ── Clipboard report ───────────────────────────────────────────────────────
  function copyReport() {
    const lines = [
      `Substance: ${substance?.cr3e9_df_drugtype || "—"}`,
      `Quantity: ${propState.qty} ${propState.unit}`,
      `Section: ${base.section}`,
      `Quantity Type: ${base.quantityType}`,
      `Base Sentence: ${base.sentenceInYearsMonthsDays}`,
      `Base Fine: ${base.fine}`,
      `After Discretion: ${fmtYMD(daysToYMD(discretion.sentenceDays))} · ${fmtRupees(discretion.fine)}`,
      `Final (w/ Factors): ${fmtYMD(daysToYMD(final.sentenceDays))} · ${fmtRupees(final.fine)}`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    showToast("Report copied to clipboard");
  }

  return (
    <>
      <div className="shell">
        <div className="col">
          <ProportionalCalc
            state={propState} setState={setPropState}
            base={base} calculated={calculated}
            qtyEnabled={isQtyValid}
            drugsData={drugsData}
            onCalc={result => { setBase(result); setCalculated(true); showToast("Proportional calculation updated"); }}
            onSelect={record => {
              setSubstance(record);
              if (!record) {
                setCalculated(false);
              }
            }}
          />
          <ReportCard
            substance={substance} base={base}
            discretion={discretion} final={final}
            tab={reportTab} setTab={setReportTab}
            onCopy={copyReport}
          />
        </div>

        <div className="col">
          <DiscretionCalc
            state={discState} setState={setDiscState}
            base={base} discretion={discretion}
            calculated={calculated} qtyEnabled={isQtyValid} onCalc={handleCourtCalc}
          />
          <FactorSummary
            aggSentTotal={aggSentTotal} aggFineTotal={aggFineTotal}
            mitSentTotal={mitSentTotal} mitFineTotal={mitFineTotal}
            qtyEnabled={isQtyValid}
            baseSentenceDays={discretion.sentenceDays} baseFine={discretion.fine}
            final={final}
          />
          <FactorTable kind="aggrav" factors={aggravFactors} setFactors={setAggravFactors} totalSent={aggSentTotal} totalFine={aggFineTotal} />
          <FactorTable kind="mitig"  factors={mitigFactors}  setFactors={setMitigFactors}  totalSent={mitSentTotal} totalFine={mitFineTotal} />
        </div>
      </div>

      <FabBar active={fabActive} setActive={setFabActive} />

      <footer className="site">
        <div className="pip">Justice Anoop Chitkara <span className="pip-copyright">©</span></div>
        <div className="pip">Send feedback: <a href="mailto:sentencecalculator.in@gmail.com">sentencecalculator.in@gmail.com</a></div>
        <div className="pip survey"><a href="#">📊 Participate in Survey</a></div>
        <div className="pip">For any query: <a href="mailto:customer.support@defactoinfotech.com">customer.support@defactoinfotech.com</a></div>
        <div className="pip"><a href="#">Cookies</a></div>
      </footer>

      <Toast message={toastState.message} visible={toastState.visible} />
    </>
  );
}
