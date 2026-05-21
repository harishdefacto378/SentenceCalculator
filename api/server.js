const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

function computeProportional(substance, qty) {
  if (!substance || !qty || qty <= 0) {
    return { sentenceDays: 0, fine: 0, type: 'NA', pctOfUpper: 0, section: 'NA' };
  }
  const { smallQty, commercialQty, section } = substance;
  let type, pctOfUpper, sentenceDays, fine;

  if (qty < smallQty) {
    type = 'Small Quantity';
    pctOfUpper = 0;
    const ratio = qty / smallQty;
    sentenceDays = Math.round(365 * ratio);
    fine = Math.round(10000 * ratio);
  } else if (qty >= commercialQty) {
    type = 'Commercial Quantity';
    pctOfUpper = 100;
    const over = Math.min(1, (qty - commercialQty) / (commercialQty * 4));
    sentenceDays = Math.round((10 + over * 10) * 365);
    fine = Math.round(100000 + over * 100000);
  } else {
    type = 'Intermediate (Lesser) Quantity';
    const ratio = (qty - smallQty) / (commercialQty - smallQty);
    pctOfUpper = Math.round(ratio * 100);
    sentenceDays = Math.round((1 + ratio * 9) * 365);
    fine = Math.round(10000 + ratio * 90000);
  }
  return { sentenceDays, fine, type, pctOfUpper, section };
}

// Minimal substances lookup for local testing; in production front-end will send name matching its SUBSTANCES
const SUBSTANCES = [
  { name: 'Heroin (Diacetylmorphine)', smallQty: 5, commercialQty: 250, section: '21(c)' },
  { name: 'Cocaine', smallQty: 5, commercialQty: 250, section: '21(c)' }
];

app.post('/api/calculate', (req, res) => {
  const { substanceName, qty } = req.body;
  const sub = SUBSTANCES.find(s => s.name === substanceName) || SUBSTANCES[0];
  const result = computeProportional(sub, Number(qty) || 0);
  res.json(result);
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Calc stub listening on http://localhost:${port}`));
