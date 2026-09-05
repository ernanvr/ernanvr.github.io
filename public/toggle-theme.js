const primaryColorScheme = ""; // "light" | "dark"

const STORAGE_KEY = "theme";

// Session-scoped on purpose: the browser's `prefers-color-scheme` is the source
// of truth, and a manual toggle only overrides it for the current tab. Closing
// the tab ends the session, so the next visit asks the browser again.
// Read on every call, never cached at load — with view transitions this module
// runs once but the override can change during the document's lifetime.
function getStoredTheme() {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Private mode / storage disabled: no override, follow the browser.
    return null;
  }
}

function getPreferTheme() {
  const stored = getStoredTheme();
  if (stored) return stored;

  if (primaryColorScheme) return primaryColorScheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

let themeValue = getPreferTheme();

function reflectPreference() {
  document.firstElementChild.setAttribute("data-theme", themeValue);

  document.querySelector("#theme-btn")?.setAttribute("aria-label", themeValue);

  // Get a reference to the body element
  const body = document.body;

  // Check if the body element exists before using getComputedStyle
  if (body) {
    // Get the computed styles for the body element
    const computedStyles = window.getComputedStyle(body);

    // Get the background color property
    const bgColor = computedStyles.backgroundColor;

    // Set the background color in <meta theme-color ... />
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
}

// Persist an EXPLICIT user choice. Only the toggle button may call this.
function setPreference() {
  try {
    sessionStorage.setItem(STORAGE_KEY, themeValue);
  } catch {
    // Storage unavailable: the toggle still works for this page view.
  }
  reflectPreference();
}

// set early so no page flashes / CSS is made aware
reflectPreference();

let themeTransitionTimer;

// `persist` is false for system-driven changes: they must not become a stored
// override, or an OS auto-dark at sunset would pin the theme past the session.
function applyThemeWithTransition(persist) {
  // Cross-fade the palette instead of an abrupt brightness jump.
  // The class only lives for the duration of the change, so initial
  // page load never animates (no FOUC).
  const root = document.documentElement;
  root.classList.add("enable-theme-transition");
  if (persist) {
    setPreference();
  } else {
    reflectPreference();
  }
  clearTimeout(themeTransitionTimer);
  themeTransitionTimer = setTimeout(
    () => root.classList.remove("enable-theme-transition"),
    250
  );
}

window.onload = () => {
  function setThemeFeature() {
    // Re-resolve, then set the button's label for screen readers.
    themeValue = getPreferTheme();
    reflectPreference();

    // now this script can find and listen for clicks on the control
    document.querySelector("#theme-btn")?.addEventListener("click", () => {
      themeValue = themeValue === "light" ? "dark" : "light";
      applyThemeWithTransition(true);
    });
  }

  setThemeFeature();

  // Runs on view transitions navigation
  document.addEventListener("astro:after-swap", setThemeFeature);
};

// sync with system changes — but never over an explicit choice made in this tab
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches: isDark }) => {
    if (getStoredTheme()) return;
    themeValue = isDark ? "dark" : "light";
    applyThemeWithTransition(false);
  });
