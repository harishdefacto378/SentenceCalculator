import React, { useState, useMemo } from 'react';
import { AGGRAVATING, MITIGATING, UNITS } from '../../../data';
import { EMPTY_BASE } from '../../utils/calculateSentence';
import { fmtRupees, daysToYMD } from '../../utils/formatters';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import { useDrugList }  from '../../hooks/useDrugList';
import { getCachedAverageFactors } from '../../services/drugListService';
import { useToast }     from '../../hooks/useToast';
import { useCourtCalc } from '../../hooks/useCourtCalc';
import { useCalculationEngine } from '../../hooks/useCalculationEngine';
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

  // Calculation engine for consistent logic across all stages
  const engine = useCalculationEngine();

  // ── Factor totals (capped at 100%) ─────────────────────────────────────────
  const aggSentTotal = useMemo(() => Math.min(100, appliedAggravFactors.reduce((a, f) => a + (+f.sentence || 0), 0)), [appliedAggravFactors]);
  const aggFineTotal = useMemo(() => Math.min(100, appliedAggravFactors.reduce((a, f) => a + (+f.fine     || 0), 0)), [appliedAggravFactors]);
  const mitSentTotal = useMemo(() => Math.min(100, appliedMitigFactors.reduce ((a, f) => a + (+f.sentence || 0), 0)), [appliedMitigFactors]);
  const mitFineTotal = useMemo(() => Math.min(100, appliedMitigFactors.reduce ((a, f) => a + (+f.fine     || 0), 0)), [appliedMitigFactors]);

  // ── Final sentence after factors (using unified engine) ────────────────────
  const final = useMemo(() => {
    if (!substance || !discretion?.sentenceDays || base.quantityType === "Commercial") {
      return { sentenceDays: 0, fine: 0, ymd: '0 year(s) 0 month(s) 0 day(s)' };
    }

    // Use the engine's calculateAggrAndMiti for consistent logic with Stage 2 & Angular
    const result = engine.calculateAggrAndMiti(
      substance,
      qtyInGrams,
      base.quantityType,
      discretion.sentenceDays,
      discretion.fine,
      aggSentTotal,
      aggFineTotal,
      mitSentTotal,
      mitFineTotal
    );

    return {
      sentenceDays: result.sentenceDays,
      fine: result.fine,
      ymd: result.ymd,
    };
  }, [
    discretion,
    aggSentTotal,
    aggFineTotal,
    mitSentTotal,
    mitFineTotal,
    substance,
    qtyInGrams,
    base.quantityType,
    engine,
  ]);

  // ── Clipboard report ───────────────────────────────────────────────────────
  function copyReport() {
    const lines = [
      `Substance: ${substance?.df_drugtype || "—"}`,
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
    if (base.quantityType === "Commercial") {
      showToast("Commercial quantity: aggravating & mitigating factors are not applicable");
      return;
    }
    const nextAppliedAggrav = cloneFactorList(aggravFactors);
    const nextAppliedMitig = cloneFactorList(mitigFactors);
    const nextAggSentTotal = Math.min(100, nextAppliedAggrav.reduce((a, f) => a + (+f.sentence || 0), 0));
    const nextAggFineTotal = Math.min(100, nextAppliedAggrav.reduce((a, f) => a + (+f.fine || 0), 0));
    const nextMitSentTotal = Math.min(100, nextAppliedMitig.reduce((a, f) => a + (+f.sentence || 0), 0));
    const nextMitFineTotal = Math.min(100, nextAppliedMitig.reduce((a, f) => a + (+f.fine || 0), 0));

    // Use the unified engine so displayed values and saved values are identical
    const result = engine.calculateAggrAndMiti(
      substance,
      qtyInGrams,
      base.quantityType,
      discretion.sentenceDays,
      discretion.fine,
      nextAggSentTotal,
      nextAggFineTotal,
      nextMitSentTotal,
      nextMitFineTotal,
    );

    setAppliedAggravFactors(nextAppliedAggrav);
    setAppliedMitigFactors(nextAppliedMitig);

    try {
      const payload = {
        df_age: 0,
        df_confiscationdate: propState.date || new Date().toISOString().split("T")[0],
        df_drugquantitypercentage: Number(base.quantityPercent) || 0,
        df_fine: result.fine,
        df_gender: 1,
        df_quantitydetained: qtyInGrams,
        df_quantitydetainedingram: qtyInGrams,
        df_quantitytype: 1,
        df_sentencedays: result.sentenceDays,
        df_sentenceyymmdd: result.ymd,
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

  function handleExportPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 32;
    const contentWidth = pageWidth - marginX * 2;
    const leftColWidth = 190;
    const rightColWidth = contentWidth - leftColWidth;
    const lineHeight = 12;
    const cellPadding = 6;
    const minRowHeight = 24;
    const bodyBottomY = pageHeight - 34;
    const reportGeneratedAt = new Date();
    let y = 34;

    const asText = (value, fallback = "NA") => {
      if (value === null || value === undefined || value === "") return fallback;
      return String(value);
    };

    const pad2 = (n) => String(n).padStart(2, "0");
    const formatDate = (value) => {
      if (!value) return "NA";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return asText(value);
      return `${pad2(parsed.getDate())}-${pad2(parsed.getMonth() + 1)}-${parsed.getFullYear()}`;
    };
    const formatDateTime = (value) =>
      `${formatDate(value)} ${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}`;

    const formatRs = (value) => {
      const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
      if (!Number.isFinite(parsed)) return asText(value);
      return `Rs. ${parsed.toLocaleString("en-IN")}`;
    };

    const drawHeader = () => {
      const top = 20;
      const bottom = 82;
      doc.setDrawColor(90);
      doc.setLineWidth(0.6);
      doc.line(marginX, top, marginX + contentWidth, top);
      doc.line(marginX, bottom, marginX + contentWidth, bottom);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Sentence Calculation Report", marginX + contentWidth / 2, 43, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Generated from: www.sentencecalculator.in", marginX + contentWidth / 2, 58, { align: "center" });
      doc.text(`Generated on: ${formatDateTime(reportGeneratedAt)}`, marginX + contentWidth / 2, 72, { align: "center" });

      y = bottom + 10;
    };

    const ensureSpace = (requiredHeight) => {
      if (y + requiredHeight <= bodyBottomY) return;
      doc.addPage();
      drawHeader();
    };

    const drawSectionHeader = (title) => {
      const lines = doc.splitTextToSize(asText(title), contentWidth - cellPadding * 2);
      const height = Math.max(minRowHeight, lines.length * lineHeight + cellPadding * 2);
      ensureSpace(height);

      doc.setFillColor(243, 245, 248);
      doc.setDrawColor(80);
      doc.rect(marginX, y, contentWidth, height, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      lines.forEach((line, idx) => {
        doc.text(line, marginX + contentWidth / 2, y + cellPadding + lineHeight * (idx + 0.8), { align: "center" });
      });
      y += height;
    };

    const drawTwoColRow = (label, value, valueAlign = "left") => {
      const labelLines = doc.splitTextToSize(asText(label), leftColWidth - cellPadding * 2);
      const valueLines = doc.splitTextToSize(asText(value), rightColWidth - cellPadding * 2);
      const height = Math.max(minRowHeight, Math.max(labelLines.length, valueLines.length) * lineHeight + cellPadding * 2);
      ensureSpace(height);

      doc.setDrawColor(95);
      doc.rect(marginX, y, leftColWidth, height);
      doc.rect(marginX + leftColWidth, y, rightColWidth, height);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      labelLines.forEach((line, idx) => {
        doc.text(line, marginX + cellPadding, y + cellPadding + lineHeight * (idx + 0.8));
      });
      valueLines.forEach((line, idx) => {
        const textY = y + cellPadding + lineHeight * (idx + 0.8);
        if (valueAlign === "center") {
          doc.text(line, marginX + leftColWidth + rightColWidth / 2, textY, { align: "center" });
        } else if (valueAlign === "right") {
          doc.text(line, marginX + leftColWidth + rightColWidth - cellPadding, textY, { align: "right" });
        } else {
          doc.text(line, marginX + leftColWidth + cellPadding, textY);
        }
      });
      y += height;
    };

    const drawThreeColRow = (field, details, date) => {
      const col2Width = (contentWidth - leftColWidth) * 0.62;
      const col3Width = (contentWidth - leftColWidth) - col2Width;
      const fLines = doc.splitTextToSize(asText(field), leftColWidth - cellPadding * 2);
      const dLines = doc.splitTextToSize(asText(details), col2Width - cellPadding * 2);
      const dtLines = doc.splitTextToSize(asText(date), col3Width - cellPadding * 2);
      const height = Math.max(minRowHeight, Math.max(fLines.length, dLines.length, dtLines.length) * lineHeight + cellPadding * 2);
      ensureSpace(height);

      doc.rect(marginX, y, leftColWidth, height);
      doc.rect(marginX + leftColWidth, y, col2Width, height);
      doc.rect(marginX + leftColWidth + col2Width, y, col3Width, height);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      fLines.forEach((line, idx) => {
        doc.text(line, marginX + cellPadding, y + cellPadding + lineHeight * (idx + 0.8));
      });
      dLines.forEach((line, idx) => {
        doc.text(line, marginX + leftColWidth + col2Width / 2, y + cellPadding + lineHeight * (idx + 0.8), { align: "center" });
      });
      dtLines.forEach((line, idx) => {
        doc.text(line, marginX + leftColWidth + col2Width + col3Width / 2, y + cellPadding + lineHeight * (idx + 0.8), { align: "center" });
      });
      y += height;
    };

    const drawFactorTable = (title, factors) => {
      drawSectionHeader(title);

      const widths = [40, contentWidth - (40 + 72 + 72 + 72), 72, 72, 72];
      const headers = ["No.", "Factor", "Sentence %", "Fine %", "Avg %"];
      const headerHeight = minRowHeight;
      ensureSpace(headerHeight);
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(95);

      let x = marginX;
      headers.forEach((h, i) => {
        doc.rect(x, y, widths[i], headerHeight, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(h, x + widths[i] / 2, y + 15, { align: "center" });
        x += widths[i];
      });
      y += headerHeight;

      (factors || []).forEach((factor, idx) => {
        const cells = [
          String(idx + 1),
          asText(factor?.label, "Custom factor"),
          `${Number(factor?.sentence) || 0}`,
          `${Number(factor?.fine) || 0}`,
          `${Number(factor?.avg) || 0}`,
        ];
        const factorLines = doc.splitTextToSize(cells[1], widths[1] - cellPadding * 2);
        const rowHeight = Math.max(minRowHeight, factorLines.length * lineHeight + cellPadding * 2);
        ensureSpace(rowHeight);

        let colX = marginX;
        cells.forEach((cell, colIdx) => {
          doc.rect(colX, y, widths[colIdx], rowHeight);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          if (colIdx === 1) {
            const lines = doc.splitTextToSize(cell, widths[colIdx] - cellPadding * 2);
            lines.forEach((line, lineIdx) => {
              doc.text(line, colX + cellPadding, y + cellPadding + lineHeight * (lineIdx + 0.8));
            });
          } else {
            doc.text(cell, colX + widths[colIdx] / 2, y + 15, { align: "center" });
          }
          colX += widths[colIdx];
        });
        y += rowHeight;
      });
    };

    drawHeader();

    drawSectionHeader("Case and Substance Details");
    drawTwoColRow("Case Type", "NDPS");
    drawTwoColRow("Substance Name", substance?.df_drugidentifier || substance?.df_drugtype || "NA");
    drawTwoColRow("Quantity detained", `${asText(propState.qty, "0")} ${asText(propState.unit, "g")}`);
    drawTwoColRow("Date of Confiscation", formatDate(propState.date));

    drawSectionHeader("Proportional Calculation");
    drawTwoColRow("Punishable Under", base.section || "NA");
    drawTwoColRow("Quantity Type", base.quantityType || "NA");
    drawTwoColRow("Sentence in day(s)", asText(base.sentenceDays, "0"), "center");
    drawTwoColRow("Sentence in year(s), month(s) and day(s)", base.sentenceInYearsMonthsDays || base.sentenceInYearsMonthsAndDays || "0 year(s), 0 month(s), 0 day(s)");
    drawTwoColRow("Fine (in Rupees)", formatRs(base.fine || 0), "right");
    drawTwoColRow("Drug Quantity in % to Upper Limit of Intermediate", `${asText(base.quantityPercent, "0.00")}%`, "center");

    drawSectionHeader("Official Notification Details");
    drawThreeColRow(
      "Notification No.",
      substance?.df_notificationno_under_viia_xxiiia_of_s2 || "NA",
      formatDate(substance?.df_notificationdate_under_viia_xxiiia_of_s2)
    );
    drawTwoColRow("Notification Report", substance?.df_notificationreportanddate || "NA");
    drawTwoColRow("Common Name", substance?.df_drugtype || "NA");
    drawTwoColRow("Chemical Name", substance?.df_chemicalname_defined_in_s2xxiii || "NA");
    drawTwoColRow("Small Quantity", substance ? `< ${substance.df_smallquantitygram} Gram` : "NA");
    drawTwoColRow("Commercial Quantity", substance ? `> ${substance.df_commercialquantitygram} Gram` : "NA");

    drawSectionHeader("Calculation as per Discretion of the Court");
    drawTwoColRow("%age Increase in SENTENCE/FINE", `${Number(discState.inc) || 0}%`, "center");
    drawTwoColRow("%age Decrease in SENTENCE/FINE", `${Number(discState.dec) || 0}%`, "center");
    drawTwoColRow("Sentence in day(s)", asText(discretion.sentenceDays, "0"), "center");
    drawTwoColRow("Sentence in year(s), month(s) and day(s)", daysToYMD(discretion.sentenceDays || 0));
    drawTwoColRow("Fine (in Rupees)", formatRs(discretion.fine || 0), "right");

    drawSectionHeader("Aggravating & Mitigating Factors");
    drawTwoColRow("%age Increase/Decrease in SENTENCE", `${aggSentTotal - mitSentTotal}%`, "center");
    drawTwoColRow("%age Increase/Decrease in FINE", `${aggFineTotal - mitFineTotal}%`, "center");
    drawTwoColRow("New Sentence in day(s)", asText(final.sentenceDays, "0"), "center");
    drawTwoColRow("New Sentence in year(s), month(s) and day(s)", daysToYMD(final.sentenceDays || 0));
    drawTwoColRow("New Fine (in Rupees)", formatRs(final.fine || 0), "right");

    drawSectionHeader("Final Sentence Recommendation");
    drawTwoColRow("Recommended Sentence (Days)", asText(final.sentenceDays, "0"), "center");
    drawTwoColRow("Recommended Sentence (Y/M/D)", daysToYMD(final.sentenceDays || 0));
    drawTwoColRow("Recommended Fine", formatRs(final.fine || 0), "right");

    drawFactorTable("Positive Factors (Aggravating)", aggravFactors);
    drawFactorTable("Negative Factors (Mitigating)", mitigFactors);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 16, { align: "right" });
      doc.text(formatDateTime(reportGeneratedAt), marginX, pageHeight - 16);
    }

    const safeSubstance = String(substance?.df_drugidentifier || "report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    doc.save(`sentence-calculation-${safeSubstance || "report"}.pdf`);
    showToast("Report PDF downloaded");
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

      <FabBar active={fabActive} setActive={setFabActive} onReportClick={handleExportPdf} />

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
