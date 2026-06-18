const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'data/users.json');
const itemsFile = path.join(__dirname, 'data/items.json');

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function readItems() {
  try {
    return JSON.parse(fs.readFileSync(itemsFile, 'utf-8'));
  } catch {
    return [];
  }
}

function writeItems(items) {
  fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2));
}

module.exports = { readUsers, writeUsers, readItems, writeItems };
