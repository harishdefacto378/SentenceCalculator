const { callDataverseApi, PATHS } = require("../services/dataverseService");
const asyncHandler = require("../utils/asyncHandler");

const health = (_req, res) => {
  res.json({ ok: true });
};

const getDrugList = asyncHandler(async (req, res) => {
  const data = await callDataverseApi(PATHS.drugList, req.body);
  res.json(data);
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
