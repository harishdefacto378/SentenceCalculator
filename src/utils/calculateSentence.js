// Pure sentence calculation engine — no React, no side-effects.
import { fmtRupees, daysToYMD } from './formatters';
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

  // ─── STAGE 1 ── RAW DRUG FIELDS FROM API ───────────────────────────────────
  console.group("╔══ STAGE 1: PROPORTIONAL CALCULATION ══╗");
  console.group("📦 Drug Record — Raw API Fields");
  console.log("Drug Name          :", drugRecord.cr3e9_df_drugidentifier);
  console.log("smallquantitygram  :", drugRecord.cr3e9_df_smallquantitygram, " → safeNum:", smallQty);
  console.log("commercialqtygram  :", drugRecord.cr3e9_df_commercialquantitygram, " → safeNum:", commercialQty);
  console.log("commercialmaxqtygram:", drugRecord.cr3e9_df_commercialmaxquantitygram, " → resolved:", commercialMaxQty);
  console.log("Qty Detained (g)   :", qty);
  console.log("🔎 ALL DRUG RECORD FIELDS:");
  console.table(
    Object.fromEntries(Object.entries(drugRecord).map(([k, v]) => [k, { value: v }]))
  );
  console.groupEnd();

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

  console.group("📐 Sentence Min/Max per Category");
  console.log("Small   → min:", sent.smallMin, "  max:", sent.smallMax);
  console.log("Inter   → min:", sent.interMin, "  max:", sent.interMax);
  console.log("Comm    → min:", sent.commMin,  "  max:", sent.commMax);
  console.groupEnd();
  console.group("💰 Fine Min/Max per Category");
  console.log("Small   → min:", fine.smallMin, "  max:", fine.smallMax);
  console.log("Inter   → min:", fine.interMin, "  max:", fine.interMax);
  console.log("Comm    → min:", fine.commMin,  "  max:", fine.commMax);
  console.groupEnd();

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

    console.group("🟡 Category: SMALL");
    console.log("ratio        = qty / smallQty =", qty, "/", smallQty, "=", ratio);
    console.log("rawSent      =", sent.smallMin, "+ (", sent.smallMax, "-", sent.smallMin, ") *", ratio, "=", rawSent);
    console.log("rawFine      =", fine.smallMin, "+ ((", fine.smallMax, "-", fine.smallMin, ") /", smallQty, ") *", qty, "=", rawFine);
    console.groupEnd();

  } else if (qty <= commercialQty) {
    type    = "Intermediate";
    section = drugRecord.cr3e9_df_punishableundersectionintermediate || "NA";
    const interQty = commercialQty - smallQty;
    const ratio    = interQty > 0 ? (qty - smallQty) / interQty : 0;
    rawSent = sent.interMin + (sent.interMax - sent.interMin) * ratio;
    rawFine = interQty > 0
      ? fine.interMin + ((fine.interMax - fine.interMin) / interQty) * (qty - smallQty)
      : fine.interMin;

    console.group("🔵 Category: INTERMEDIATE");
    console.log("interQty     = commercialQty - smallQty =", commercialQty, "-", smallQty, "=", interQty);
    console.log("ratio        = (qty - smallQty) / interQty = (", qty, "-", smallQty, ") /", interQty, "=", ratio);
    console.log("rawSent      =", sent.interMin, "+ (", sent.interMax, "-", sent.interMin, ") *", ratio, "=", rawSent);
    console.log("rawFine      =", fine.interMin, "+ ((", fine.interMax, "-", fine.interMin, ") /", interQty, ") * (", qty, "-", smallQty, ") =", rawFine);
    console.groupEnd();

  } else if (qty <= commercialMaxQty) {
    type    = "Commercial";
    section = drugRecord.cr3e9_df_punishableundersectioncommercial || "NA";
    const commQty = commercialMaxQty - commercialQty;
    const ratio   = commQty > 0 ? (qty - commercialQty) / commQty : 0;
    rawSent = sent.commMin + (sent.commMax - sent.commMin) * ratio;
    rawFine = commQty > 0
      ? fine.commMin + ((fine.commMax - fine.commMin) / commQty) * (qty - commercialQty)
      : fine.commMin;

    console.group("🔴 Category: COMMERCIAL");
    console.log("commQty      = commercialMaxQty - commercialQty =", commercialMaxQty, "-", commercialQty, "=", commQty);
    console.log("ratio        = (qty - commercialQty) / commQty = (", qty, "-", commercialQty, ") /", commQty, "=", ratio);
    console.log("rawSent      =", sent.commMin, "+ (", sent.commMax, "-", sent.commMin, ") *", ratio, "=", rawSent);
    console.log("rawFine      =", fine.commMin, "+ ((", fine.commMax, "-", fine.commMin, ") /", commQty, ") * (", qty, "-", commercialQty, ") =", rawFine);
    console.groupEnd();

  } else {
    type    = "Commercial";
    section = drugRecord.cr3e9_df_punishableundersectioncommercial || "NA";
    rawSent = sent.commMax;
    rawFine = fine.commMax;

    console.group("🔴 Category: COMMERCIAL (EXCEEDS MAX — capped)");
    console.log("rawSent      = commMax =", rawSent);
    console.log("rawFine      = commMax =", rawFine);
    console.groupEnd();
  }

  const sentenceDays              = Math.max(0, roundSent(rawSent));
  const _fineNum                  = Math.max(0, roundFine(rawFine));
  const sentenceInYearsMonthsDays = daysToYMD(sentenceDays);
  const quantityPercent = commercialQty > 0
    ? ((qty / commercialQty) * 100).toFixed(2)
    : "0.00";

  console.group("✅ Stage 1 Output");
  console.log("rawSent (pre-round)   :", rawSent);
  console.log("sentenceDays (rounded):", sentenceDays);
  console.log("rawFine  (pre-round)  :", rawFine);
  console.log("fineNum  (×1000 round):", _fineNum);
  console.log("baseDays (for Stage 2):", rawSent, "  ← this is the raw float passed forward");
  console.log("baseFine (for Stage 2):", rawFine, "  ← this is the raw float passed forward");
  console.log("quantityType          :", type);
  console.log("quantityPercent       :", quantityPercent + "%");
  console.log("YMD                   :", sentenceInYearsMonthsDays);
  console.groupEnd();
  console.groupEnd(); // STAGE 1

  const fineFormatted = fmtRupees(_fineNum);
  const result = {
    section,
    sentenceDays,
    sentenceInYearsMonthsDays,
    fine: fineFormatted,
    quantityType: type,
    quantityPercent,
    baseDays: rawSent,
    baseFine: rawFine,
    _fineNum,
  };

void (async () => {
  try {
    const safeDays = Number(sentenceDays) || 0;
    const payload = {
      df_age: Number(0),

      df_confiscationdate: new Date().toISOString().split("T")[0],

      df_drugquantitypercentage: Number(quantityPercent) || 0,

      df_fine: Number(_fineNum) || 0,

      df_gender: Number(1),

      df_quantitydetained: Number(qty) || 0,

      df_quantitydetainedingram: Number(qty) || 0,

      df_quantitytype: Number(1),

      df_sentencedays: Number(safeDays) || 0,

      df_sentenceyymmdd: daysToYMD(safeDays),

      df_unit: Number(1),

      df_multiplierforcommerical: Number(100)
    };

    console.log("📦 FINAL PAYLOAD:");
    console.log(JSON.stringify(payload, null, 2));

    const res = await api.post("/api/createsentence", payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    });

    console.log("📡 RESPONSE:", res.data);

    if (res?.data?.id) {
      console.log("🆔 Record ID:", res.data.id);
    }

    console.log("✅ Save successful");

  } catch (error) {
    console.error("❌ Save API failed:", error);
  }
})();
  return result;
}
