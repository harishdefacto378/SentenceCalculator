# Dataverse Custom API: Calculation endpoint

This document specifies the calculation API used by the front-end. The real calculation logic should be implemented as a Dataverse Custom API (server-side) and must return the base sentence/fine data requested by the UI.

Endpoint (HTTP):
- POST /api/calculate (front-end may override via `window.API_CALC_ENDPOINT`)

Request JSON (application/json):
```json
{
  "substanceName": "Heroin (Diacetylmorphine)",
  "qty": 5000
}
```
- `substanceName` string: name of substance as exposed by the front-end `SUBSTANCES` JSON.
- `qty` number: quantity in grams (client converts units to grams).

Response JSON (200 OK):
```json
{
  "sentenceDays": 3650,
  "fine": 100000,
  "type": "Commercial Quantity",
  "pctOfUpper": 100,
  "section": "21(c)"
}
```
- `sentenceDays` number: base sentence in days
- `fine` number: base fine in INR (integer)
- `type` string: one of `Small Quantity`, `Intermediate (Lesser) Quantity`, `Commercial Quantity`
- `pctOfUpper` number: percent of upper intermediate bound (0-100)
- `section` string: statute section label

Dataverse implementation notes
- Dataverse Custom APIs are registered in the Power Platform admin center and executed server-side.
- Implement the calculation logic in the Custom API plugin (C#/.NET) following the same algorithm used historically in the client (proportional mapping across small/intermediate/commercial bands).
- Ensure the Custom API accepts the same request payload and returns the response JSON above.
- Secure the Custom API (Azure AD / Dataverse security model). The front-end should call the API via a proxy or function app if direct client-to-Dataverse calls are not desired.

Local testing
- A small Express stub is included at `api/server.js` to run locally for development.
- Start the stub with `node api/server.js` and set `window.API_CALC_ENDPOINT` to `http://localhost:3000/api/calculate` in the browser console during development.

Migration checklist
- Implement server-side logic as a Dataverse Custom API (C# plugin) or host on Azure Functions that integrate with Dataverse.
- Replace `window.API_CALC_ENDPOINT` in production with the Dataverse-backed endpoint.
- Remove or archive any remaining client-side calculation logic when Dataverse is confirmed working.
