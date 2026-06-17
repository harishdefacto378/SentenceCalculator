const { callDataverseApi, getAverageFactors, PATHS } = require("../services/dataverseService");
const asyncHandler = require("../utils/asyncHandler");

const health = (_req, res) => {
  res.json({ ok: true });
};

const getDrugList = asyncHandler(async (req, res) => {
  const [data, factors] = await Promise.all([
    callDataverseApi(PATHS.drugList, req.body),
    getAverageFactors(req.body),
  ]);

  res.json({
    ...data,
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
