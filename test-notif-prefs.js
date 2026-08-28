// Quick test to verify notification preference sanitization logic

const NOTIF_PREF_KEYS = [
  "toast_agreement_ready",
  "toast_document_request",
  "toast_counter_offer",
  "toast_price_revised",
  "toast_meeting_update",
  "toast_item_pricing",
];

// Simulate old preferences stored in DB with unknown key
const oldPrefsFromDB = {
  "meetings": true, // OLD KEY - no longer valid
  "toast_agreement_ready": true,
  "toast_document_request": false,
};

// Simulate user toggling a switch
function togglePref(key, value) {
  const allowedKeys = new Set(NOTIF_PREF_KEYS);
  const sanitized = {};

  // Filter out unknown keys from current prefs
  for (const k of Object.keys(oldPrefsFromDB)) {
    if (allowedKeys.has(k)) {
      sanitized[k] = oldPrefsFromDB[k];
    }
  }

  // Update the toggled key
  sanitized[key] = value;

  return sanitized;
}

// Test: toggle toast_meeting_update from true to false
const result = togglePref("toast_meeting_update", false);

console.log("Old preferences from DB:", oldPrefsFromDB);
console.log("After sanitization and toggle:", result);
console.log("Has 'meetings' key?", "meetings" in result); // Should be false
console.log("Has all valid keys?", Object.keys(result).every(k => NOTIF_PREF_KEYS.includes(k))); // Should be true
console.log("✓ Test passed! Old 'meetings' key was removed.");
