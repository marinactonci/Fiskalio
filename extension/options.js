'use strict';

const DEFAULT_URL = 'https://fiskalio.marinactonci.com';

const input = document.getElementById('appUrl');
const saveButton = document.getElementById('save');
const statusEl = document.getElementById('status');

const storage =
  typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chrome.storage.local : null;

// Returns the origin (scheme://host[:port]) for an http/https address, or null.
function parseOrigin(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch (e) {
    return null;
  }
}

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'msg' + (kind ? ' ' + kind : '');
}

function save() {
  const origin = parseOrigin(input.value);
  if (!origin) {
    input.setAttribute('aria-invalid', 'true');
    setStatus('Unesite ispravnu adresu koja počinje s http:// ili https://.', 'error');
    input.focus();
    return;
  }

  input.removeAttribute('aria-invalid');
  input.value = origin;

  if (!storage) {
    setStatus('Postavke se ne mogu spremiti jer spremište proširenja nije dostupno.', 'error');
    return;
  }

  try {
    storage.set({ appUrl: origin }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        setStatus('Spremanje nije uspjelo: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      setStatus('Spremljeno. Otvorite novu karticu.', 'ok');
    });
  } catch (e) {
    setStatus('Spremanje nije uspjelo.', 'error');
  }
}

for (const button of document.querySelectorAll('button[data-url]')) {
  button.addEventListener('click', () => {
    input.value = button.getAttribute('data-url');
    input.removeAttribute('aria-invalid');
    setStatus('');
    input.focus();
  });
}

input.addEventListener('input', () => {
  input.removeAttribute('aria-invalid');
  setStatus('');
});
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    save();
  }
});
saveButton.addEventListener('click', save);

function prefill(value) {
  input.value = parseOrigin(value) || DEFAULT_URL;
}

if (storage) {
  try {
    storage.get({ appUrl: DEFAULT_URL }, (items) => {
      const failed = chrome.runtime && chrome.runtime.lastError;
      prefill(!failed && items ? items.appUrl : DEFAULT_URL);
    });
  } catch (e) {
    prefill(DEFAULT_URL);
  }
} else {
  prefill(DEFAULT_URL);
}
