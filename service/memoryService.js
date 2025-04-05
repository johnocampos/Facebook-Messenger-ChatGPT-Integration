const fs = require('fs');
const path = require('path');

const memoryPath = path.join(__dirname, '../data/userMemory.json');

function readMemory() {
  if (!fs.existsSync(memoryPath)) return {};
  const raw = fs.readFileSync(memoryPath);
  return JSON.parse(raw);
}

function writeMemory(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

function updateUserMemory(userId, updates) {
  const memory = readMemory();
  if (!memory[userId]) memory[userId] = {};
  memory[userId] = {
    ...memory[userId],
    ...updates,
    lastSeen: new Date().toISOString(),
  };
  writeMemory(memory);
}

function getUserMemory(userId) {
  const memory = readMemory();
  return memory[userId] || null;
}

module.exports = {
  updateUserMemory,
  getUserMemory
};
