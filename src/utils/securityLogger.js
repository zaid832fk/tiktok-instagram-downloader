'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, 'security.log');

function logSecurityEvent(eventType, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    ...data
  };
  
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('Failed to write security log:', err.message);
  }
  
  // Also log to console for monitoring
  console.log(`[SECURITY] ${timestamp} ${eventType}`, JSON.stringify(data));
}

function getSecurityLogs(limit = 100) {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
    return lines.slice(-limit).map(line => JSON.parse(line));
  } catch (err) {
    return [];
  }
}

module.exports = { logSecurityEvent, getSecurityLogs };