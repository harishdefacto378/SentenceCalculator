import React, { useState, useMemo } from 'react';
import { AGGRAVATING, MITIGATING, UNITS } from '../../../data';
import { EMPTY_BASE } from '../../utils/calculateSentence';
import { fmtRupees, daysToYMD } from '../../utils/formatters';
import api from '../../services/api';
import { useDrugList }  from '../../hooks/useDrugList';
import { getCachedAverageFactors } from '../../services/drugListService';
import { useToast }     from '../../hooks/useToast';
import { useCourtCalc } from '../../hooks/useCourtCalc';
import { Toast }          from '../Toast';
import { ProportionalCalc } from './ProportionalCalc';
import { DiscretionCalc }   from './DiscretionCalc';
import { FactorTable }      from './FactorTable';
import { FactorSummary }    from './FactorSummary';
import { ReportCard }       from './ReportCard';
import { FabBar }           from './FabBar';

const cloneFactorList = (list) => list.map((item) => ({ ...item }));
const normalizeLabel = (label) =>
  String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function orderFactorsByBase(baseFactors, incomingFactors, prefix) {
  const base = Array.isArray(baseFactors) ? baseFactors : [];
  const incoming = Array.isArray(incomingFactors) ? incomingFactors : [];
  const consumed = new Set();

  const ordered = base.map((baseItem) => {
    let idx = incoming.findIndex((f, i) => !consumed.has(i) && f?.id === baseItem.id);
    if (idx < 0) {
      const baseLabel = normalizeLabel(baseItem.label);
      idx = incoming.findIndex(
        (f, i) => !consumed.has(i) && normalizeLabel(f?.label) === baseLabel
      );
    }

    if (idx >= 0) {
      consumed.add(idx);
      const match = incoming[idx] || {};
      return {
        ...baseItem,
        ...match,
        id: baseItem.id,
        label: match.label || baseItem.label,
      };
    }

    return { ...baseItem };
  });

  incoming.forEach((item, idx) => {
    if (consumed.has(idx)) return;
    ordered.push({
      ...item,
      id: item?.id || `${prefix}-x-${idx + 1}`,
      label: item?.label || "Custom factor",
      sentence: Number(item?.sentence) || 0,
      fine: Number(item?.fine) || 0,
      avg: Number(item?.avg) || 0,
    });
  });

  return ordered;
}

export function CalculatorPage() {
  const drugsData = useDrugList();
  const { toastState, showToast } = useToast();
  const cachedAverageFactors = getCachedAverageFactors();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [propState, setPropState] = useState({
    substance: "", qty: "", unit: "g",
    date: new Date().toISOString().split('T')[0],
  });
  const [discState,     setDiscState]     = useState({ inc: 0, dec: 0 });
  const [aggravFactors, setAggravFactors] = useState(() =>
    orderFactorsByBase(AGGRAVATING, cachedAverageFactors?.aggravating, "a")
  );
  const [mitigFactors,  setMitigFactors]  = useState(() =>
    orderFactorsByBase(MITIGATING, cachedAverageFactors?.mitigating, "m")
  );
  const [appliedAggravFactors, setAppliedAggravFactors] = useState(() =>
    cloneFactorList(orderFactorsByBase(AGGRAVATING, cachedAverageFactors?.aggravating, "a"))
  );
  const [appliedMitigFactors, setAppliedMitigFactors] = useState(() =>
    cloneFactorList(orderFactorsByBase(MITIGATING, cachedAverageFactors?.mitigating, "m"))
  );
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
  const aggSentTotal = useMemo(() => Math.min(100, appliedAggravFactors.reduce((a, f) => a + (+f.sentence || 0), 0)), [appliedAggravFactors]);
  const aggFineTotal = useMemo(() => Math.min(100, appliedAggravFactors.reduce((a, f) => a + (+f.fine     || 0), 0)), [appliedAggravFactors]);
  const mitSentTotal = useMemo(() => Math.min(100, appliedMitigFactors.reduce ((a, f) => a + (+f.sentence || 0), 0)), [appliedMitigFactors]);
  const mitFineTotal = useMemo(() => Math.min(100, appliedMitigFactors.reduce ((a, f) => a + (+f.fine     || 0), 0)), [appliedMitigFactors]);

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
      `After Discretion: ${daysToYMD(discretion.sentenceDays)} · ${fmtRupees(discretion.fine)}`,
      `Final (w/ Factors): ${daysToYMD(final.sentenceDays)} · ${fmtRupees(final.fine)}`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    showToast("Report copied to clipboard");
  }

  async function handleFactorCalc() {
    const nextAppliedAggrav = cloneFactorList(aggravFactors);
    const nextAppliedMitig = cloneFactorList(mitigFactors);
    const nextAggSentTotal = Math.min(100, nextAppliedAggrav.reduce((a, f) => a + (+f.sentence || 0), 0));
    const nextAggFineTotal = Math.min(100, nextAppliedAggrav.reduce((a, f) => a + (+f.fine || 0), 0));
    const nextMitSentTotal = Math.min(100, nextAppliedMitig.reduce((a, f) => a + (+f.sentence || 0), 0));
    const nextMitFineTotal = Math.min(100, nextAppliedMitig.reduce((a, f) => a + (+f.fine || 0), 0));
    const sentNet = (nextAggSentTotal - nextMitSentTotal) / 100;
    const fineNet = (nextAggFineTotal - nextMitFineTotal) / 100;
    const nextFinalSentenceDays = Math.max(0, Math.round((Number(discretion.sentenceDays) || 0) * (1 + sentNet)));
    const nextFinalFine = Math.max(0, Math.round((Number(discretion.fine) || 0) * (1 + fineNet)));

    setAppliedAggravFactors(nextAppliedAggrav);
    setAppliedMitigFactors(nextAppliedMitig);

    try {
      const payload = {
        df_age: 0,
        df_confiscationdate: propState.date || new Date().toISOString().split("T")[0],
        df_drugquantitypercentage: Number(base.quantityPercent) || 0,
        df_fine: nextFinalFine,
        df_gender: 1,
        df_quantitydetained: qtyInGrams,
        df_quantitydetainedingram: qtyInGrams,
        df_quantitytype: 1,
        df_sentencedays: nextFinalSentenceDays,
        df_sentenceyymmdd: daysToYMD(nextFinalSentenceDays),
        df_unit: 1,
        df_multiplierforcommerical: 100,
      };

      const res = await api.post("/api/createsentence", payload);
      console.log("✅ Aggravating & Mitigating Factors saved - ID:", res?.id ?? res?.data?.id ?? "NA");
      showToast("Factors calculation updated & saved");
    } catch (error) {
      console.error("❌ Factors save failed:", error);
      showToast("Factors calculation updated (save failed)");
    }
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
            onCalc={handleFactorCalc}
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
