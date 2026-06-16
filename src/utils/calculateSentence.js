// Pure sentence calculation engine — no React, no side-effects.
import { fmtRupees, fmtYMD, daysToYMD } from './formatters';
import api from '../services/api';

export const EMPTY_BASE = {
  section: "NA",
  sentenceDays: 0,
  sentenceInYearsMonthsDays: "0 year(s) 0 month(s) 0 day(s)",
  fine: "₹0.00",
  quantityType: "NA",
  quantityPercent: "0.00",
  _fineNum: 0,
};

export function calculateSentence(drugRecord, quantityGrams) {
  if (!drugRecord) return { ...EMPTY_BASE };

  const safeNum = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };

  const smallQty      = safeNum(drugRecord.cr3e9_df_smallquantitygram);
  const commercialQty = safeNum(drugRecord.cr3e9_df_commercialquantitygram);
  const qty           = Math.max(0, safeNum(quantityGrams));
  const commercialMaxQty = safeNum(drugRecord.cr3e9_df_commercialmaxquantitygram) || commercialQty * 2;

  const sent = {
    smallMin:  safeNum(drugRecord.cr3e9_df_smallminsent),
    smallMax:  safeNum(drugRecord.cr3e9_df_smallmaxsent),
    interMin:  safeNum(drugRecord.cr3e9_df_interminsent),
    interMax:  safeNum(drugRecord.cr3e9_df_intermaxsent),
    commMin:   safeNum(drugRecord.cr3e9_df_commminsent),
    commMax:   safeNum(drugRecord.cr3e9_df_commmaxsent),
  };
  const fine = {
    smallMin:  safeNum(drugRecord.cr3e9_df_smallminfine),
    smallMax:  safeNum(drugRecord.cr3e9_df_smallmaxfine),
    interMin:  safeNum(drugRecord.cr3e9_df_interminfine),
    interMax:  safeNum(drugRecord.cr3e9_df_intermaxfine),
    commMin:   safeNum(drugRecord.cr3e9_df_commminfine),
    commMax:   safeNum(drugRecord.cr3e9_df_commmaxfine),
  };

  const roundSent = v => (v % 1 < 0.5) ? Math.floor(v) : Math.ceil(v);
  const roundFine = v => Math.round(v / 1000) * 1000;

  let type, section, rawSent, rawFine;

  if (qty < smallQty) {
    type    = "Small";
    section = drugRecord.cr3e9_df_punishableundersectionsmall || "NA";
    const ratio = smallQty > 0 ? qty / smallQty : 0;
    rawSent = sent.smallMin + (sent.smallMax - sent.smallMin) * ratio;
    rawFine = smallQty > 0
      ? fine.smallMin + ((fine.smallMax - fine.smallMin) / smallQty) * qty
      : fine.smallMin;

  } else if (qty <= commercialQty) {
    type    = "Intermediate";
    section = drugRecord.cr3e9_df_punishableundersectionintermediate || "NA";
    const interQty = commercialQty - smallQty;
    const ratio    = interQty > 0 ? (qty - smallQty) / interQty : 0;
    rawSent = sent.interMin + (sent.interMax - sent.interMin) * ratio;
    rawFine = interQty > 0
      ? fine.interMin + ((fine.interMax - fine.interMin) / interQty) * (qty - smallQty)
      : fine.interMin;

  } else {
    type    = "Commercial";
    section = drugRecord.cr3e9_df_punishableundersectioncommercial || "NA";
    const commQty = commercialMaxQty - commercialQty;
    const ratio   = commQty > 0 ? (qty - commercialQty) / commQty : 0;
    rawSent = sent.commMin + (sent.commMax - sent.commMin) * ratio;
    rawFine = commQty > 0
      ? fine.commMin + ((fine.commMax - fine.commMin) / commQty) * (qty - commercialQty)
      : fine.commMin;
  }

  const clampedSent = Math.max(
    type === "Small" ? sent.smallMin : type === "Intermediate" ? sent.interMin : sent.commMin,
    Math.min(
      type === "Small" ? sent.smallMax : type === "Intermediate" ? sent.interMax : sent.commMax,
      rawSent
    )
  );
  const clampedFine = Math.max(
    type === "Small" ? fine.smallMin : type === "Intermediate" ? fine.interMin : fine.commMin,
    Math.min(
      type === "Small" ? fine.smallMax : type === "Intermediate" ? fine.interMax : fine.commMax,
      rawFine
    )
  );

  const sentenceDays              = Math.max(0, roundSent(clampedSent));
  const _fineNum                  = Math.max(0, roundFine(clampedFine));
  const ymd                       = daysToYMD(sentenceDays);
  const sentenceInYearsMonthsDays = fmtYMD(ymd);
  const fineFormatted             = fmtRupees(_fineNum);

  const quantityPercent = commercialQty > 0
    ? ((qty / commercialQty) * 100).toFixed(2)
    : "0.00";

  const result = {
    section,
    sentenceDays,
    sentenceInYearsMonthsDays,
    fine: fineFormatted,
    quantityType: type,
    quantityPercent,
    _fineNum,
  };

  void (async () => {
    try {
      const payload = {
        df_age: 0,
        df_confiscationdate: new Date().toISOString().split("T")[0],
        df_drugquantitypercentage: Number(quantityPercent) || 0,
        df_fine: _fineNum,
        df_gender: 1,
        df_quantitydetained: qty,
        df_quantitydetainedingram: qty,
        df_quantitytype: 1,
        df_sentencedays: sentenceDays,
        df_sentenceyymmdd: ymd,
        df_unit: 1,
        df_multiplierforcommerical: 100
      };

      await api.post("/api/createsentence", payload);
      console.log("✅ Sentence saved successfully");
    } catch (error) {
      console.error("❌ Save API failed:", error);
    }
  })();

  return result;
}
