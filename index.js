// Wise Step 1: Handle Hostinger Port
process.env.PORT = String(process.env.PORT || 3000);
console.log("Hekayaty starting on port:", process.env.PORT);

import "./artifacts/api-server/dist/index.mjs";
