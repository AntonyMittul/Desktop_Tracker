const API_URL = "http://localhost:8000";

async function getDeviceId() {
  const data = await chrome.storage.local.get("deviceId");
  if (data.deviceId) return data.deviceId;

  try {
    const res = await fetch(`${API_URL}/devices/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 1, device_name: "Chrome Extension", os: "Web" })
    });
    if (res.ok) {
      const json = await res.json();
      await chrome.storage.local.set({ deviceId: json.id });
      return json.id;
    }
  } catch (e) {
    console.error("Failed to register device", e);
  }
  return null;
}

async function sendEvent(session) {
  const deviceId = await getDeviceId();
  if (!deviceId || !session.url) return;
  if (session.url.startsWith("chrome://") || session.url.startsWith("edge://")) return;
  
  const now = new Date();
  const startedAt = new Date(session.startedAt);
  const durationSeconds = Math.round((now - startedAt) / 1000);
  
  if (durationSeconds < 2) return;

  const event = {
    application: "Google Chrome",
    window_title: session.title || "Unknown Tab",
    url: session.url,
    started_at: startedAt.toISOString(),
    ended_at: now.toISOString(),
    duration_seconds: durationSeconds,
    idle: false
  };

  try {
    await fetch(`${API_URL}/activity/events?device_id=${deviceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([event])
    });
  } catch (e) {
    console.error("Failed to sync event", e);
  }
}

async function startSession(tab) {
  const { currentSession, isChromeFocused } = await chrome.storage.local.get(["currentSession", "isChromeFocused"]);
  
  if (currentSession) {
    await sendEvent(currentSession);
  }
  
  // Default to true if undefined
  const focused = isChromeFocused !== false;
  
  if (tab && focused) {
    await chrome.storage.local.set({
      currentSession: {
        url: tab.url,
        title: tab.title,
        startedAt: new Date().toISOString()
      }
    });
  } else {
    await chrome.storage.local.set({ currentSession: null });
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await startSession(tab);
  } catch (e) {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    await startSession(tab);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await chrome.storage.local.set({ isChromeFocused: false });
    await startSession(null);
  } else {
    await chrome.storage.local.set({ isChromeFocused: true });
    try {
      const query = await chrome.tabs.query({ active: true, windowId: windowId });
      if (query.length > 0) {
        await startSession(query[0]);
      }
    } catch (e) {}
  }
});

// Detect when the user's PC is locked or they are away for 5 minutes
chrome.idle.setDetectionInterval(300);

chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === "locked") {
    console.log(`System went locked. Ending session.`);
    await chrome.storage.local.set({ isChromeFocused: false });
    await startSession(null);
  } else if (newState === "idle") {
    try {
      const query = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (query.length > 0 && query[0].audible) {
        console.log("System went idle but active tab is audible (e.g. video playing). Ignoring idle state.");
        return;
      }
    } catch (e) {}
    
    console.log(`System went idle. Ending session.`);
    await chrome.storage.local.set({ isChromeFocused: false });
    await startSession(null);
  } else if (newState === "active") {
    console.log("System became active. Resuming session.");
    await chrome.storage.local.set({ isChromeFocused: true });
    try {
      const query = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (query.length > 0) {
        await startSession(query[0]);
      }
    } catch (e) {}
  }
});
