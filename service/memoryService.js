const fs = require('fs');
const path = require('path');

const memoryPath = path.join(__dirname, 'userMemory.json');

// Load memory
function readMemory() {
  if (!fs.existsSync(memoryPath)) return {};
  const raw = fs.readFileSync(memoryPath);
  return JSON.parse(raw);
}

// Save memory
function writeMemory(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

// Update user
function updateUserMemory(userId, updates) {
  const memory = readMemory();
  if (!memory[userId]) memory[userId] = {};
  memory[userId] = {
    ...memory[userId],
    ...updates,
    lastSeen: new Date().toISOString()
  };
  writeMemory(memory);
}

// Get user
function getUserMemory(userId) {
  const memory = readMemory();
  return memory[userId] || null;
}

module.exports = {
  updateUserMemory,
  getUserMemory
};
