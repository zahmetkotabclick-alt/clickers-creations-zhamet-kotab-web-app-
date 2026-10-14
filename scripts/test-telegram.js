/**
 * Telegram Bot Notification Diagnostic & Setup Verification Script
 * For Zahmet Ketab (دار زحمة كتاب)
 * 
 * Usage:
 *   node scripts/test-telegram.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load environment variables from artifacts/api-server/.env or process.env
const envPath = path.resolve(__dirname, '../artifacts/api-server/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();

function maskString(str) {
  if (!str || str.length <= 8) return '****';
  return str.slice(0, 4) + '...' + str.slice(-4);
}

console.log('====================================================');
console.log('🤖 ZAHMET KETAB — TELEGRAM BOT DIAGNOSTIC TOOL');
console.log('====================================================');

if (!token) {
  console.log('⚠️ TELEGRAM_BOT_TOKEN is missing or empty in artifacts/api-server/.env');
  console.log('\nSetup instructions:');
  console.log('1. Open Telegram and search for @BotFather');
  console.log('2. Send /newbot, give it a name (e.g., Zahmet Ketab Orders), and a username ending in bot');
  console.log('3. Copy the HTTP API token into artifacts/api-server/.env:');
  console.log('   TELEGRAM_BOT_TOKEN=your_bot_token_here');
  console.log('====================================================');
  process.exit(1);
}

if (!chatId) {
  console.log('⚠️ TELEGRAM_CHAT_ID is missing or empty in artifacts/api-server/.env');
  console.log('\nSetup instructions:');
  console.log('1. Create a private Telegram group for your order administration.');
  console.log('2. Add your bot to the group as an Administrator.');
  console.log('3. Send a message into the group (e.g., "test").');
  console.log('4. Open: https://api.telegram.org/bot' + token + '/getUpdates');
  console.log('5. Look for "chat":{"id": -100xxxxxxxxxx} in the JSON response.');
  console.log('6. Add the chat ID (including the minus sign) to artifacts/api-server/.env:');
  console.log('   TELEGRAM_CHAT_ID=-100xxxxxxxxxx');
  console.log('====================================================');
  process.exit(1);
}

console.log(`✓ Bot Token configured: ${maskString(token)}`);
console.log(`✓ Chat ID configured:   ${chatId}`);

async function runTest() {
  try {
    // Step 1: Verify Bot Identity
    console.log('\n1. Verifying bot credentials with Telegram API...');
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();

    if (!meRes.ok || !meData.ok) {
      console.log('❌ Telegram Bot Token is invalid:');
      console.log(`   ${meData.description || meRes.statusText}`);
      process.exit(1);
    }

    console.log(`   ✅ Bot Verified: @${meData.result.username} (${meData.result.first_name})`);

    // Step 2: Send Test Message to Group
    console.log('\n2. Sending test message to order group...');
    const nowEgypt = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
    const messageText = `🔔 <b>اختبار نظام إشعارات الطلبات — دار زحمة كتاب</b>\n\n` +
      `✅ تم فحص الاتصال بنجاح بين خادم المتجر ومجموعة التيليجرام الخاصة بإدارة الطلبات!\n\n` +
      `🕒 <b>توقيت الاختبار:</b> ${nowEgypt}\n` +
      `🤖 <b>البوت:</b> @${meData.result.username}\n\n` +
      `<i>نظام إشعارات الطلبات جاهز لاستقبال الطلبات الجديدة تلقائياً.</i>`;

    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const sendData = await sendRes.json();

    if (!sendRes.ok || !sendData.ok) {
      console.log('❌ Failed to send message to group:');
      console.log(`   ${sendData.description || sendRes.statusText}`);
      console.log('\nCommon causes:');
      console.log('• Is the bot added to the group?');
      console.log('• Does the bot have permission to post messages?');
      console.log('• Is the chat ID correct (including the negative sign, e.g. -100...)?');
      process.exit(1);
    }

    console.log(`   ✅ Test message delivered successfully! (Message ID: ${sendData.result.message_id})`);
    console.log('\n🎉 ALL CHECKS PASSED: Your Telegram Order Notification System is fully configured and operational!');
    console.log('====================================================');
  } catch (err) {
    console.log(`❌ Network or unexpected error: ${err.message}`);
    process.exit(1);
  }
}

runTest();
