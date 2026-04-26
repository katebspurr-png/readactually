(async () => {
  // Storage keys
  const KEYS = ["apiUrl", "accessToken", "tokenExpiry"];

  // DOM refs
  const views = {
    saving: document.getElementById("view-saving"),
    success: document.getElementById("view-success"),
    error: document.getElementById("view-error"),
    settings: document.getElementById("view-settings")
  };

  const gearBtn = document.getElementById("gear-btn");
  const retryBtn = document.getElementById("retry-btn");
  const settingsSaveBtn = document.getElementById("settings-save-btn");
  const settingsError = document.getElementById("settings-error");
  const errorMessage = document.getElementById("error-message");
  const successLabel = document.getElementById("success-label");
  const successTitle = document.getElementById("success-title");
  const successTags = document.getElementById("success-tags");

  function showView(name) {
    for (const [key, el] of Object.entries(views)) {
      el.classList.toggle("hidden", key !== name);
    }
    gearBtn.classList.toggle("hidden", name === "settings");
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    showView("error");
  }

  function showSuccess(item, isDuplicate) {
    successLabel.textContent = isDuplicate ? "Already saved" : "Saved to ReadActually";
    successTitle.textContent = item.title ?? item.canonical_url ?? "";
    successTags.innerHTML = "";
    for (const tag of (item.tags ?? []).slice(0, 5)) {
      const pill = document.createElement("span");
      pill.className = "tag";
      pill.textContent = tag;
      successTags.appendChild(pill);
    }
    showView("success");
    setTimeout(() => window.close(), 2500);
  }

  async function scrapeAndSave(apiUrl, token) {
    // Get the active tab
    let tab;
    try {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = active;
    } catch {
      showError("Could not access the current tab.");
      return;
    }

    // Send scrape message to content script
    let scraped;
    try {
      scraped = await chrome.tabs.sendMessage(tab.id, { action: "scrape" });
    } catch {
      showError("This page cannot be saved — try reloading it.");
      return;
    }

    if (!scraped?.url) {
      showError("Could not read page data. Try reloading.");
      return;
    }

    // Call the Next.js save API
    let response;
    try {
      response = await fetch(`${apiUrl}/api/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          url: scraped.url,
          title: scraped.title,
          excerpt: scraped.excerpt,
          body_text: scraped.body_text,
          source_type: scraped.source_type,
          og_image: scraped.og_image
        })
      });
    } catch {
      showError("Network error — make sure the app is running.");
      return;
    }

    if (response.status === 401) {
      // Token expired — prompt re-login
      await chrome.storage.local.remove(KEYS);
      settingsError.textContent = "Session expired — please log in again.";
      settingsError.classList.remove("hidden");
      showView("settings");
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      showError("Unexpected response from server.");
      return;
    }

    if (!response.ok) {
      showError(data?.error ?? "Save failed.");
      return;
    }

    showSuccess(data.item, data.status === "duplicate");
  }

  // Settings: connect to app
  settingsSaveBtn.addEventListener("click", async () => {
    const apiUrl = document.getElementById("input-api-url").value.trim().replace(/\/$/, "");
    const email = document.getElementById("input-email").value.trim();
    const password = document.getElementById("input-password").value;

    if (!apiUrl || !email || !password) {
      settingsError.textContent = "All fields are required.";
      settingsError.classList.remove("hidden");
      return;
    }

    settingsSaveBtn.disabled = true;
    settingsError.classList.add("hidden");

    let response;
    try {
      response = await fetch(`${apiUrl}/api/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
    } catch {
      settingsError.textContent = "Network error — check the App URL.";
      settingsError.classList.remove("hidden");
      settingsSaveBtn.disabled = false;
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      settingsError.textContent = "Unexpected server response.";
      settingsError.classList.remove("hidden");
      settingsSaveBtn.disabled = false;
      return;
    }

    if (!response.ok) {
      settingsError.textContent = data?.error ?? "Login failed.";
      settingsError.classList.remove("hidden");
      settingsSaveBtn.disabled = false;
      return;
    }

    // expires_at from Supabase is Unix seconds — store as ms with 60s buffer
    await chrome.storage.local.set({
      apiUrl,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry: data.expires_at * 1000
    });

    settingsSaveBtn.disabled = false;
    showView("saving");
    scrapeAndSave(apiUrl, data.access_token);
  });

  // Gear icon opens settings
  gearBtn.addEventListener("click", () => showView("settings"));

  // Retry button
  retryBtn.addEventListener("click", async () => {
    const stored = await chrome.storage.local.get(KEYS);
    if (stored.accessToken && stored.apiUrl) {
      showView("saving");
      scrapeAndSave(stored.apiUrl, stored.accessToken);
    } else {
      showView("settings");
    }
  });

  // Kick off on load
  const stored = await chrome.storage.local.get(KEYS);
  const isExpired = !stored.tokenExpiry || Date.now() > stored.tokenExpiry - 60_000;

  if (!stored.apiUrl || !stored.accessToken || isExpired) {
    showView("settings");
  } else {
    showView("saving");
    scrapeAndSave(stored.apiUrl, stored.accessToken);
  }
})();
