# Backend contract

The browser uses the supplied V8 Apps Script deployment and does not replace backend routes with local imitations outside preview mode.

- Deployment URL: `https://script.google.com/macros/s/AKfycbyqw2pg_-I8i8jP-nIVq4ATC_bw0fRNFi_yhM044TnbRtbuiEt98Btg1Q0ZnQRsIpItag/exec`
- Library ID: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`
- Library version: `8`
- API target: `8.0.0-final`

`TableGateApi` keeps `token` authentication, preserves error codes/details, and exposes the last response envelope metadata as `api.meta.tablegateTime` and `api.meta.apiVersion` while returning the route data payload to existing shell callers.

The complete supplied backend source is included as `backend/api/tablegate-backend-v8.gs`. The older GitHub backend is retained separately for history and comparison.
