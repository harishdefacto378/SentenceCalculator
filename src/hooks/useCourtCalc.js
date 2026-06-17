import { useState, useCallback } from 'react';
import { daysToYMD } from '../utils/formatters';
import api from '../services/api';

/**
 * Owns discretion state and the court-calculation handler.
 * Inputs come from CalculatorPage (base result, disc percentages,
 * selected substance record, and the qty in grams).
 */
export function useCourtCalc({ base, discState, substance, qtyInGrams, showToast }) {
  const [discretion, setDiscretion] = useState({ sentenceDays: 0, fine: 0 });

  const handleCourtCalc = useCallback(async () => {
    const { sentenceDays, _fineNum, quantityType } = base;
    const substanceData = substance;

    if (!sentenceDays && !_fineNum) {
      alert("Please run the Proportional Calculation first.");
      return;
    }

    const inc = Number(discState.inc) || 0;
    const dec = Number(discState.dec) || 0;

    const safeNum = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };

    const baseSentence = Number(sentenceDays);
    const baseFine = Number(_fineNum) || 0;

    // ── SENTENCE ──────────────────────────────────────────────────────────────
     // Step 1: Net percentage
     // ── SENTENCE (COURT BASE LOGIC FIXED) ───────────────────────────────

// Step 1: ratio (court formula base)
const smallQty = safeNum(substanceData?.cr3e9_df_smallquantitygram);

const minSent =
  quantityType === "Small"
    ? safeNum(substanceData.cr3e9_df_smallminsent)
    : quantityType === "Intermediate"
    ? safeNum(substanceData.cr3e9_df_interminsent)
    : safeNum(substanceData.cr3e9_df_commminsent);

const maxSent =
  quantityType === "Small"
    ? safeNum(substanceData.cr3e9_df_smallmaxsent)
    : quantityType === "Intermediate"
    ? safeNum(substanceData.cr3e9_df_intermaxsent)
    : safeNum(substanceData.cr3e9_df_commmaxsent);

// Step 2: ratio
const ratio = smallQty > 0 ? qtyInGrams / smallQty : 0;

// Step 3: BASE DAYS (IMPORTANT - DO NOT ROUND HERE)
let sentence = minSent + (maxSent - minSent) * ratio;

// Step 4: apply NET % (court discretion)
const netPct = inc - dec;
sentence = sentence * (1 + netPct / 100);

// Step 5: FIX floating precision only (no rounding bias)
sentence = Math.round((sentence + Number.EPSILON) * 100) / 100;

// Step 6: FINAL ROUNDING (court rule)
sentence = sentence % 1 < 0.5 ? Math.floor(sentence) : Math.ceil(sentence);

// Step 7: minimum safeguard
if (sentence < 1) sentence = 0;

// Step 8: clamp (same as your system)
const clampSentence = (val, type, data) => {
  if (!data) return val;

  const min =
    type === "Small"
      ? safeNum(data.cr3e9_df_smallminsent)
      : type === "Intermediate"
      ? safeNum(data.cr3e9_df_interminsent)
      : safeNum(data.cr3e9_df_commminsent);

  const max =
    type === "Small"
      ? safeNum(data.cr3e9_df_smallmaxsent)
      : type === "Intermediate"
      ? safeNum(data.cr3e9_df_intermaxsent)
      : safeNum(data.cr3e9_df_commmaxsent);

  return Math.min(Math.max(val, min), max);
};

sentence = clampSentence(sentence, quantityType, substanceData);

    // ── FINE ──────────────────────────────────────────────────────────────────
    let fine = 0;
    const fineChangePct = inc - dec;
    const finePercentage = 100 + fineChangePct;
    const roundToNearest1000 = value => Math.round(value / 1000) * 1000;

    const applyFineRules = (fineValue, type, commMaxFine) => {
      if (type === "Small") {
        if (fineValue <= 1) return 0;
        if (fineValue > 10000) return 10000;
        return roundToNearest1000(fineValue);
      }

      if (type === "Intermediate") {
        if (fineValue <= 1) return 0;
        if (fineValue > 100000) return 100000;
        return roundToNearest1000(fineValue);
      }

      const commercialMaxFine = Math.max(100000, safeNum(commMaxFine));
      const clampedCommercialFine = Math.min(Math.max(fineValue, 100000), commercialMaxFine);
      return roundToNearest1000(clampedCommercialFine);
    };

    if (substanceData) {
      const smallQty = safeNum(substanceData.cr3e9_df_smallquantitygram);
      const commercialQty = safeNum(substanceData.cr3e9_df_commercialquantitygram);
      const commercialMaxQty = safeNum(substanceData.cr3e9_df_commercialmaxquantitygram) || commercialQty * 2;
      const qty = qtyInGrams;

      const fineRange = {
        smallMin: safeNum(substanceData.cr3e9_df_smallminfine),
        smallMax: safeNum(substanceData.cr3e9_df_smallmaxfine),
        interMin: safeNum(substanceData.cr3e9_df_interminfine),
        interMax: safeNum(substanceData.cr3e9_df_intermaxfine),
        commMin: safeNum(substanceData.cr3e9_df_commminfine),
        commMax: safeNum(substanceData.cr3e9_df_commmaxfine),
      };

      let fineAmount;
      if (qty < smallQty) {
        fineAmount = smallQty > 0
          ? fineRange.smallMin + ((fineRange.smallMax - fineRange.smallMin) / smallQty) * qty
          : fineRange.smallMin;
      } else if (qty <= commercialQty) {
        const qtyDiff = commercialQty - smallQty;
        fineAmount = qtyDiff > 0
          ? fineRange.interMin + ((fineRange.interMax - fineRange.interMin) / qtyDiff) * (qty - smallQty)
          : fineRange.interMin;
      } else {
        const qtyDiff = commercialMaxQty - commercialQty;
        fineAmount = qtyDiff > 0
          ? fineRange.commMin + ((fineRange.commMax - fineRange.commMin) / qtyDiff) * (qty - commercialQty)
          : fineRange.commMin;
      }

      const fineAfterIncDec = fineAmount * finePercentage / 100;
      fine = applyFineRules(fineAfterIncDec, quantityType, fineRange.commMax);
    } else {
      const fineAfterIncDec = baseFine * finePercentage / 100;
      fine = applyFineRules(fineAfterIncDec, quantityType, baseFine);
    }

    const updatedDiscretion = { sentenceDays: sentence, fine, ymd: daysToYMD(sentence) };
    setDiscretion(updatedDiscretion);
    showToast("Discretion applied");

    try {
      const payload = {
        df_age: 0,
        df_confiscationdate: new Date().toISOString().split("T")[0],
        df_drugquantitypercentage: 0,
        df_fine: updatedDiscretion.fine,
        df_gender: 1,
        df_quantitydetained: qtyInGrams,
        df_quantitydetainedingram: qtyInGrams,
        df_quantitytype: 1,
        df_sentencedays: updatedDiscretion.sentenceDays,
        df_sentenceyymmdd: updatedDiscretion.ymd,
        df_unit: 1,
        df_multiplierforcommerical: 100
      };

      const res = await api.post("/api/createsentence", payload);
         console.log("📡 FULL RESPONSE:", res.data);

  // ✅ CHECK YOUR PLUGIN OUTPUT
  if (res?.data?.message) {
    console.log("✅", res.data.message);
  }

  if (res?.data?.id) {
    console.log("🆔 Record ID:", res.data.id);
  }
      console.log("✅ Calculation as per Discretion Sentence saved successfully");
      if (res?.data?.id) {
       console.log("🆔 Record ID:", res.data.id);
       }
    } catch (error) {
      console.error("❌ Save API failed:", error);
    }

  }, [base, discState, substance, qtyInGrams, showToast]);

  return { discretion, handleCourtCalc };
}
