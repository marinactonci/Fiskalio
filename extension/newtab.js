'use strict';

// Sends the new tab straight to the Fiskalio /newtab page. The page then runs
// as a normal first-party tab, so the app's sign-in (including Google) works.
// Embedding it in a frame instead would hide the Clerk session cookies from it.
// The app address can be changed on the extension's options page.
const DEFAULT_URL = 'https://fiskalio.marinactonci.com';

function toOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return DEFAULT_URL;
    return url.origin;
  } catch (e) {
    return DEFAULT_URL;
  }
}

function go(appUrl) {
  // replace(): the extension page stays out of the tab's back history.
  window.location.replace(toOrigin(appUrl) + '/newtab');
}

function start() {
  const storage =
    typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
      ? chrome.storage.local
      : null;

  if (!storage) {
    go(DEFAULT_URL);
    return;
  }

  try {
    storage.get({ appUrl: DEFAULT_URL }, (items) => {
      const failed = chrome.runtime && chrome.runtime.lastError;
      go(!failed && items && items.appUrl ? items.appUrl : DEFAULT_URL);
    });
  } catch (e) {
    go(DEFAULT_URL);
  }
}

start();
