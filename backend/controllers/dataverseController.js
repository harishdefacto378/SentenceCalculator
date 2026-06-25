const { callDataverseApi, getAverageFactors, PATHS } = require("../services/dataverseService");
const asyncHandler = require("../utils/asyncHandler");

const DRUG_LIST_COLUMNS = [
  "df_drugidentifier",
  "df_drugtype",
  "df_smallquantitygram",
  "df_commercialquantitygram",
  "df_commercialmaxquantitygram",
  "df_smallminsent",
  "df_smallmaxsent",
  "df_interminsent",
  "df_intermaxsent",
  "df_commminsent",
  "df_commmaxsent",
  "df_smallminfine",
  "df_smallmaxfine",
  "df_interminfine",
  "df_intermaxfine",
  "df_commminfine",
  "df_commmaxfine",
  "df_punishableundersectionsmall",
  "df_punishableundersectionintermediate",
  "df_punishableundersectioncommercial",
  "df_notificationno_under_viia_xxiiia_of_s2",
  "df_notificationdate_under_viia_xxiiia_of_s2",
  "df_notificationreportanddate",
  "df_chemicalname_defined_in_s2xxiii",
];

const health = (_req, res) => {
  res.json({ ok: true });
};

const getDrugList = asyncHandler(async (req, res) => {
  const [data, factors] = await Promise.all([
    callDataverseApi(PATHS.drugList, req.body),
    getAverageFactors(req.body),
  ]);

  const filteredValue = Array.isArray(data.value)
    ? data.value.map(record =>
        Object.fromEntries(DRUG_LIST_COLUMNS.map(col => [col, record[col]]))
      )
    : data.value;

  res.json({
    ...data,
    value: filteredValue,
    aggravating: factors.aggravating,
    mitigating: factors.mitigating,
  });
});

const createSentence = asyncHandler(async (req, res) => {
  const data = await callDataverseApi(PATHS.createSentence, req.body);
  res.json({ success: true, data });
});

module.exports = {
  health,
  getDrugList,
  createSentence,
};
