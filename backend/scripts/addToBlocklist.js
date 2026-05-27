import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 1. import.meta.resolve() looks at your package.json and finds the #data alias
// 2. fileURLToPath() translates it into a real Windows path for 'fs'
const BLOCKLIST_PATH = fileURLToPath(
  import.meta.resolve("#data/emailBlocklist.json"),
);

let cachedBlocklist = null; // null = not yet loaded

function loadBlocklist() {
  if (!fs.existsSync(BLOCKLIST_PATH)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(BLOCKLIST_PATH, "utf-8")));
}

function getCache() {
  if (!cachedBlocklist) cachedBlocklist = loadBlocklist();
  return cachedBlocklist;
}

function saveBlocklist(set) {
  // Create the directory if it doesn't exist
  fs.mkdirSync(path.dirname(BLOCKLIST_PATH), { recursive: true });
  // Save the file
  fs.writeFileSync(BLOCKLIST_PATH, JSON.stringify([...set], null, 2));
}

export function addToBlocklist(domain) {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) throw new Error("Domain cannot be empty");

  const list = getCache();
  if (list.has(normalized)) return { added: false, domain: normalized };

  list.add(normalized);
  saveBlocklist(list);
  return { added: true, domain: normalized };
}

export function removeFromBlocklist(domain) {
  const normalized = domain.trim().toLowerCase();
  const list = getCache();

  if (!list.has(normalized)) return { removed: false, domain: normalized };

  list.delete(normalized);
  saveBlocklist(list);
  return { removed: true, domain: normalized };
}

export function getBlocklist() {
  return [...getCache()];
}

export function isDomainBlocked(domain) {
  return getCache().has(domain.trim().toLowerCase());
}
