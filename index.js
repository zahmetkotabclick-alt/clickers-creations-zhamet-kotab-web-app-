// Hekayaty Production Starter (CJS Bridge)
console.log("---------------------------------------");
console.log("HEKAYATY: PRODUCTION BOOT SEQUENCE");
console.log("Time:", new Date().toISOString());

const path = require('path');
const { pathToFileURL } = require('url');
const dotenv = require('dotenv');

// Load environment variables reliably from both root and artifacts/api-server
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, 'artifacts/api-server/.env') });

const target = path.resolve(__dirname, 'dist-server/index.mjs');
const targetUrl = pathToFileURL(target).href;

console.log("Targeting Backend:", target);

// Bridge to the modern ESM engine
import(targetUrl)
  .then(() => {
    console.log("✨ SUCCESS: Backend System Loaded!");
  })
  .catch((err) => {
    console.error("🔥 CRITICAL BOOT ERROR:", err.message);
    console.error(err.stack);
    process.exit(1);
  });

