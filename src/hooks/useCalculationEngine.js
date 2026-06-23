import { useState, useCallback } from 'react';
import { daysToYMD } from '../utils/formatters';

/**
 * ✅ UNIFIED CALCULATION ENGINE - migrated from Angular CalculationService
 * Handles all sentence & fine calculations with consistent pattern
 */
export function useCalculationEngine() {
  const [baseSentence, setBaseSentence] = useState(0);
  const [baseFine, setBaseFine] = useState(0);
  const [quantityInGram, setQuantityInGram] = useState(0);

  // ────────────────────────────────────────────────────────────────────────────
  // UTILITY FUNCTIONS
  // ────────────────────────────────────────────────────────────────────────────

  const safeNum = useCallback((v) => {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }, []);

  const mround = useCallback((value, multiple) => {
    return Math.round(value / multiple) * multiple;
  }, []);

  const clampValue = useCallback(
    (val, min, max) => Math.min(Math.max(val, min), max),
    []
  );

  const roundDecimal = useCallback((val) => {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }, []);

  const ceilRound = useCallback((val) => {
    return val % 1 < 0.5 ? Math.floor(val) : Math.ceil(val);
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // SENTENCE CALCULATION (PROPORTIONAL)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Calculate sentence and fine based on quantity & substance
   * Returns base values for use in other calculations
   */
  const calculateProportional = useCallback(
    (substance, qty, multiplier = 0) => {
      if (!substance || qty <= 0) {
        return {
          sentenceDays: 0,
          fine: 0,
          category: 'Small',
          percentage: 0,
        };
      }

      const smallQty = safeNum(substance.cr3e9_df_smallquantitygram);
      const commercialQty = safeNum(substance.cr3e9_df_commercialquantitygram);
      const defaultMultiplier = smallQty > 0 ? commercialQty / smallQty : 1;
      const maxCommercialQty =
        multiplier <= 0
          ? commercialQty * defaultMultiplier
          : commercialQty * multiplier;

      let sentenceDays = 0;
      let fineAmount = 0;
      let category = 'Small';
      let rawBaseSentence = 0;
      let rawBaseFine = 0;

      // ── SMALL QUANTITY ──
      if (qty > 0 && qty < smallQty) {
        const minSent = safeNum(substance.cr3e9_df_smallminsent);
        const maxSent = safeNum(substance.cr3e9_df_smallmaxsent);
        const minFine = safeNum(substance.cr3e9_df_smallminfine);
        const maxFine = safeNum(substance.cr3e9_df_smallmaxfine);

        const ratio = smallQty > 0 ? qty / smallQty : 0;
        let tempSentence = minSent + (maxSent - minSent) * ratio;
        rawBaseSentence = tempSentence;
        setBaseSentence(tempSentence);
        sentenceDays = ceilRound(tempSentence);

        fineAmount = smallQty > 0
          ? minFine + ((maxFine - minFine) / smallQty) * qty
          : minFine;
        rawBaseFine = fineAmount;
        setBaseFine(fineAmount);
        fineAmount = mround(fineAmount, 1000);
        category = 'Small';
      }
      // ── INTERMEDIATE QUANTITY ──
      else if (qty >= smallQty && qty <= commercialQty) {
        const minSent = safeNum(substance.cr3e9_df_interminsent);
        const maxSent = safeNum(substance.cr3e9_df_intermaxsent);
        const minFine = safeNum(substance.cr3e9_df_interminfine);
        const maxFine = safeNum(substance.cr3e9_df_intermaxfine);

        const qtyDiff = commercialQty - smallQty;
        sentenceDays =
          minSent +
          ((maxSent - minSent) / (qtyDiff > 0 ? qtyDiff : 1)) *
            (qty - smallQty);
        rawBaseSentence = sentenceDays;
        setBaseSentence(sentenceDays);
        sentenceDays = ceilRound(sentenceDays);

        fineAmount =
          minFine +
          ((maxFine - minFine) / (qtyDiff > 0 ? qtyDiff : 1)) *
            (qty - smallQty);
        rawBaseFine = fineAmount;
        setBaseFine(fineAmount);
        fineAmount = mround(fineAmount, 1000);
        category = 'Intermediate';
      }
      // ── COMMERCIAL QUANTITY ──
      else if (qty > commercialQty && qty <= maxCommercialQty) {
        const minSent = safeNum(substance.cr3e9_df_commminsent);
        const maxSent = safeNum(substance.cr3e9_df_commmaxsent);
        const minFine = safeNum(substance.cr3e9_df_commminfine);
        const maxFine = safeNum(substance.cr3e9_df_commmaxfine);

        const qtyDiff = maxCommercialQty - commercialQty;
        sentenceDays =
          minSent +
          ((maxSent - minSent) / (qtyDiff > 0 ? qtyDiff : 1)) *
            (qty - commercialQty);
        rawBaseSentence = sentenceDays;
        setBaseSentence(sentenceDays);
        sentenceDays = ceilRound(sentenceDays);

        fineAmount =
          minFine +
          ((maxFine - minFine) / (qtyDiff > 0 ? qtyDiff : 1)) *
            (qty - commercialQty);
        rawBaseFine = fineAmount;
        setBaseFine(fineAmount);
        fineAmount = mround(fineAmount, 1000);
        category = 'Commercial';
      }
      // ── EXCEEDS COMMERCIAL MAX ──
      else {
        sentenceDays = safeNum(substance.cr3e9_df_commmaxsent);
        fineAmount = safeNum(substance.cr3e9_df_commmaxfine);
        rawBaseSentence = sentenceDays;
        rawBaseFine = fineAmount;
        setBaseSentence(sentenceDays);
        setBaseFine(fineAmount);
        category = 'Commercial';
      }

      const percentage =
        commercialQty > 0 ? (qty / commercialQty) * 100 : 0;
      setQuantityInGram(qty);

      return {
        sentenceDays: Math.max(0, sentenceDays),
        fine: fineAmount,
        category,
        percentage: roundDecimal(percentage),
        baseDays: rawBaseSentence,
        baseFine: rawBaseFine,
      };
    },
    [safeNum, mround, ceilRound, roundDecimal]
  );

  // ────────────────────────────────────────────────────────────────────────────
  // COURT DISCRETION CALCULATION (inc/dec percentages)
  // ────────────────────────────────────────────────────────────────────────────

  const calculateCourt = useCallback(
    (substance, qty, quantityType, incPct, decPct, baseSentenceDays = 0, baseFineDays = 0) => {
      if (!substance) {
        return { sentenceDays: 0, fine: 0, ymd: '0 year(s), 0 month(s), 0 day(s)' };
      }

      const smallQty = safeNum(substance.cr3e9_df_smallquantitygram);
      const minSent =
        quantityType === 'Small'
          ? safeNum(substance.cr3e9_df_smallminsent)
          : quantityType === 'Intermediate'
          ? safeNum(substance.cr3e9_df_interminsent)
          : safeNum(substance.cr3e9_df_commminsent);

      const maxSent =
        quantityType === 'Small'
          ? safeNum(substance.cr3e9_df_smallmaxsent)
          : quantityType === 'Intermediate'
          ? safeNum(substance.cr3e9_df_intermaxsent)
          : safeNum(substance.cr3e9_df_commmaxsent);

      // Reuse proportional base days (Angular-style). Fall back to recompute if unavailable.
      const ratio = smallQty > 0 ? qty / smallQty : 0;
      const recomputedBaseSentence = minSent + (maxSent - minSent) * ratio;
      const proportionalBaseSentence =
        safeNum(baseSentenceDays) > 0
          ? safeNum(baseSentenceDays)
          : baseSentence > 0
          ? baseSentence
          : recomputedBaseSentence;

      const netPct = incPct - decPct;
      const sentAfterIncOrDec = proportionalBaseSentence * (1 + netPct / 100);

      // Angular-style sentence bounds by category
      const smallSent =
        sentAfterIncOrDec > 1 && sentAfterIncOrDec <= 365
          ? sentAfterIncOrDec
          : 365;
      const interSent =
        sentAfterIncOrDec > 1 && sentAfterIncOrDec <= 3652
          ? sentAfterIncOrDec
          : 3652;
      const commSent =
        sentAfterIncOrDec > 3652 && sentAfterIncOrDec <= 7305
          ? sentAfterIncOrDec
          : 7305;

      const smallSentAfterIncDec = sentAfterIncOrDec <= 1 ? 0 : smallSent;
      const interSentAfterIncDec = sentAfterIncOrDec <= 1 ? 0 : interSent;
      const commSentAfterIncDec = sentAfterIncOrDec <= 3653 ? 3653 : commSent;

      let sentenceToRound =
        quantityType === 'Small'
          ? smallSentAfterIncDec
          : quantityType === 'Intermediate'
          ? interSentAfterIncDec
          : commSentAfterIncDec;
      // Raw (pre-round) court sentence — Angular feeds this decimal into YMD
      const rawCourtSentence = sentenceToRound;
      sentenceToRound = roundDecimal(sentenceToRound);
      const clampedSentence = ceilRound(sentenceToRound);

      // ── FINE CALCULATION ──

      // REUSE baseFine from Proportional calculation (not recalculated)
      const fineChangePct = incPct - decPct;
      const finePercentage = 100 + fineChangePct;

      // Use base fine if provided, otherwise fall back to old calculation
      let fineAfterIncDec;
      if (safeNum(baseFineDays) > 0) {
        // ✅ NEW: Reuse proportional base fine
        fineAfterIncDec = (baseFineDays * finePercentage) / 100;
      } else {
        // FALLBACK: Recalculate (old behavior, less accurate)
        const fineRange = {
          smallMin: safeNum(substance.cr3e9_df_smallminfine),
          smallMax: safeNum(substance.cr3e9_df_smallmaxfine),
          interMin: safeNum(substance.cr3e9_df_interminfine),
          interMax: safeNum(substance.cr3e9_df_intermaxfine),
          commMin: safeNum(substance.cr3e9_df_commminfine),
          commMax: safeNum(substance.cr3e9_df_commmaxfine),
        };

        const commercialQty = safeNum(substance.cr3e9_df_commercialquantitygram);
        const commercialMaxQty =
          safeNum(substance.cr3e9_df_commercialmaxquantitygram) ||
          commercialQty * 2;

        let fineAmount;
        if (qty < smallQty) {
          fineAmount =
            smallQty > 0
              ? fineRange.smallMin +
                ((fineRange.smallMax - fineRange.smallMin) / smallQty) * qty
              : fineRange.smallMin;
        } else if (qty <= commercialQty) {
          const qtyDiff = commercialQty - smallQty;
          fineAmount =
            qtyDiff > 0
              ? fineRange.interMin +
                ((fineRange.interMax - fineRange.interMin) / qtyDiff) *
                  (qty - smallQty)
              : fineRange.interMin;
        } else {
          const qtyDiff = commercialMaxQty - commercialQty;
          fineAmount =
            qtyDiff > 0
              ? fineRange.commMin +
                ((fineRange.commMax - fineRange.commMin) / qtyDiff) *
                  (qty - commercialQty)
              : fineRange.commMin;
        }

        fineAfterIncDec = (fineAmount * finePercentage) / 100;
      }

      let fine = applyFineRules(
        fineAfterIncDec,
        quantityType,
        safeNum(substance.cr3e9_df_commmaxfine)
      );

      return {
        sentenceDays: clampedSentence,
        fine,
        ymd: daysToYMD(clampedSentence),
      };
    },
    [safeNum, roundDecimal, ceilRound, clampValue, baseSentence]
  );

  // ────────────────────────────────────────────────────────────────────────────
  // AGGRAVATING & MITIGATING FACTORS
  // ────────────────────────────────────────────────────────────────────────────

  const calculateAggrAndMiti = useCallback(
    (
      substance,
      qty,
      quantityType,
      sentenceFromCourt,
      fineFromCourt,
      aggrSentencePct,
      aggrFinePct,
      mitiSentencePct,
      mitiFinePct
    ) => {
      if (!substance) {
        return { sentenceDays: 0, fine: 0, ymd: '0 year(s), 0 month(s), 0 day(s)' };
      }

      // ── AGGREGATE SENTENCE — Angular-style absolute bounds ──
      const aggrSentence =
        sentenceFromCourt * (1 + (aggrSentencePct - mitiSentencePct) / 100);

      const smallSent   = aggrSentence > 1 && aggrSentence <= 365   ? aggrSentence : 365;
      const interSent   = aggrSentence > 1 && aggrSentence <= 3652  ? aggrSentence : 3652;
      const commSent    = aggrSentence > 3652 && aggrSentence <= 7305 ? aggrSentence : 7305;

      const bounded =
        quantityType === 'Small'
          ? (aggrSentence <= 1 ? 0 : smallSent)
          : quantityType === 'Intermediate'
          ? (aggrSentence <= 1 ? 0 : interSent)
          : (aggrSentence <= 3653 ? 3653 : commSent);

      const clampedSentence = ceilRound(bounded);

      // ── AGGREGATE FINE — Angular applies factor% on top of court fine ──
      const fineNetPct     = aggrFinePct - mitiFinePct;
      const finePercentage = 100 + fineNetPct;
      const fineAfterFactors = (fineFromCourt * finePercentage) / 100;
      const clampedFine = applyFineRules(
        fineAfterFactors,
        quantityType,
        safeNum(substance.cr3e9_df_commmaxfine)
      );

      return {
        sentenceDays: clampedSentence,
        fine: clampedFine,
        ymd: daysToYMD(clampedSentence),
      };
    },
    [safeNum, ceilRound, clampValue]
  );

  // ────────────────────────────────────────────────────────────────────────────
  // FINE RULES HELPER
  // ────────────────────────────────────────────────────────────────────────────

  const applyFineRules = useCallback(
    (fineValue, type, commMaxFine) => {
      const roundToNearest1000 = (value) =>
        Math.round(value / 1000) * 1000;

      if (type === 'Small') {
        if (fineValue <= 1) return 0;
        if (fineValue > 10000) return 10000;
        return roundToNearest1000(fineValue);
      }

      if (type === 'Intermediate') {
        if (fineValue <= 1) return 0;
        if (fineValue > 100000) return 100000;
        return roundToNearest1000(fineValue);
      }

      // Commercial
      const commercialMax = Math.max(100000, safeNum(commMaxFine));
      const clamped = Math.min(Math.max(fineValue, 100000), commercialMax);
      return roundToNearest1000(clamped);
    },
    [safeNum]
  );

  return {
    // State
    baseSentence,
    baseFine,
    quantityInGram,
    setBaseSentence,
    setBaseFine,
    setQuantityInGram,

    // Methods
    calculateProportional,
    calculateCourt,
    calculateAggrAndMiti,
    applyFineRules,

    // Utilities
    safeNum,
    mround,
    clampValue,
    roundDecimal,
    ceilRound,
  };
}
