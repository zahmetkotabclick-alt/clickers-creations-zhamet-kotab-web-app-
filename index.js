// Old Reliable Starter (CJS)
console.log("---------------------------------------");
console.log("HEKAYATY: STARTER MOTOR ENGAGED");
console.log("Time:", new Date().toISOString());

const path = require('path');
const target = path.resolve(__dirname, 'dist-server/index.mjs');

console.log("Targeting:", target);

// Use dynamic import to bridge to the modern engine
import(target)
  .then(() => {
    console.log("✨ SUCCESS: Modern Engine Loaded!");
  })
  .catch((err) => {
    console.error("🔥 CRITICAL STARTER ERROR:", err.message);
    console.error(err.stack);
    process.exit(1);
  });
