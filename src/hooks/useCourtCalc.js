import { useState, useCallback } from 'react';
import { daysToYMD } from '../utils/formatters';
import api from '../services/api';
import { useCalculationEngine } from './useCalculationEngine';

/**
 * ✅ REFACTORED: Court Calculation Hook (unified pattern from Angular CalculationService)
 * 
 * Handles all three calculation stages:
 * 1. PROPORTIONAL - base sentence/fine from quantity
 * 2. COURT DISCRETION - apply inc/dec percentages  
 * 3. AGGRAVATING & MITIGATING - apply factors
 */
export function useCourtCalc({ base, discState, substance, qtyInGrams, showToast }) {
  const engine = useCalculationEngine();
  const [discretion, setDiscretion] = useState({ sentenceDays: 0, fine: 0 });

  /**
   * Calculate commercial quantity percentage (safe version)
   * Tries multiple possible field names for commercial quantity
   */
  const calculateCommercialPercentage = useCallback((substance, qty) => {
    if (!substance || !qty) return 'NA';

    // Try all possible field name variations
    const commercialQty =
      substance?.df_commercialquantitygram ||
      substance?.df_commercialquantitygram ||
      substance?.commercialQuantity ||
      substance?.commercialQty ||
      1;

    if (!commercialQty || commercialQty <= 0) return 'NA';

    try {
      const percentage = ((qty / commercialQty) * 100).toFixed(2);
      return isFinite(percentage) ? `${percentage}%` : 'NA';
    } catch (error) {
      console.warn('Error calculating percentage:', error);
      return 'NA';
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // COURT DISCRETION: Apply increase/decrease percentages
  // ────────────────────────────────────────────────────────────────────────────

  const handleCourtCalc = useCallback(async () => {
    const { sentenceDays, _fineNum, quantityType, baseDays } = base;
    const substanceData = substance;

    if (!sentenceDays && !_fineNum) {
      alert("Please run the Proportional Calculation first.");
      return;
    }

    if (quantityType === "Commercial") {
      setDiscretion({
        sentenceDays: 0,
        fine: 0,
        ymd: "0 year(s), 0 month(s), 0 day(s)",
      });
      showToast("Commercial quantity: court discretion text is shown");
      return;
    }

    const inc = Number(discState.inc) || 0;
    const dec = Number(discState.dec) || 0;

    // Use unified engine for consistent calculations
    // Pass baseFine from Proportional calculation (not recalculated)
    const result = engine.calculateCourt(
      substanceData,
      qtyInGrams,
      quantityType,
      inc,
      dec,
      baseDays ?? sentenceDays,
      base.baseFine ?? 0  // ← NEW: Pass baseFine to prevent recalculation
    );

    const updatedDiscretion = {
      sentenceDays: result.sentenceDays,
      fine: result.fine,
      ymd: result.ymd,
    };

    setDiscretion(updatedDiscretion);
    showToast("✅ Court discretion applied");

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
        df_multiplierforcommerical: 100,
      };

      const res = await api.post("/api/createsentence", payload);
      console.log("✅ Court discretion saved - ID:", res?.data?.id);
      return res?.data?.id;
    } catch (error) {
      console.error("❌ Save failed:", error);
    }
  }, [base, discState, substance, qtyInGrams, showToast, engine]);

  return { discretion, handleCourtCalc };
}
