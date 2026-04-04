import { useState, useEffect, useCallback, useRef } from "react";

const SHEET_MAP = {
  lc_prods:  "Produtos",
  lc_clis:   "Clientes",
  lc_vendas: "Vendas",
  lc_pars:   "Parcelamentos",
  lc_movs:   "Movimentacoes",
  lc_logs:   "Logs",
};

const DEBOUNCE_MS = 1500;

// Global flag: blocks all saves until initial load from Sheets completes.
// Prevents stale localStorage from overwriting fresh Sheets data.
let _sheetReady = false;
export function markSheetReady() { _sheetReady = true; }

function getPwd() {
  return localStorage.getItem("lc_script_pwd") || "";
}

/**
 * Hook that mirrors useLocalStorage API but persists to Google Sheets.
 * Saves are blocked until markSheetReady() is called (after initial load).
 */
export function useGoogleSheet(key, fallback, scriptUrl) {
  const sheetName = SHEET_MAP[key];

  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  });

  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const latestRef = useRef(value);
  const initialRef = useRef(true);
  latestRef.current = value;

  // Keep localStorage in sync
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);

  // Debounced save to Google Sheets — only after initial load
  useEffect(() => {
    // Skip the very first render (localStorage init) and block until ready
    if (initialRef.current) { initialRef.current = false; return; }
    if (!scriptUrl || !_sheetReady) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSaving(true);
      fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify({ action: "write", sheet: sheetName, data: latestRef.current, pwd: getPwd() }),
      })
        .then((r) => r.json())
        .then((r) => {
          if (!r.ok) {
            if (r.error === "auth") console.error("Senha incorreta — dados não foram salvos.");
            else console.warn("Sheet save error:", r.error);
          }
        })
        .catch((e) => console.warn("Sheet save failed:", e))
        .finally(() => setSaving(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [value, scriptUrl, sheetName]);

  return [value, setValue, saving];
}

/**
 * Load all data from Google Sheets on first mount.
 * Calls markSheetReady() after load so saves are unblocked.
 */
export function useSheetLoader(scriptUrl, setters) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!scriptUrl) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    setError(null);
    _sheetReady = false;
    const pwd = getPwd();
    fetch(scriptUrl + "?action=readAll&pwd=" + encodeURIComponent(pwd))
      .then((r) => r.json())
      .then((r) => {
        if (!r.ok) {
          setError(r.error === "auth" ? "Senha incorreta" : r.error);
          setLoaded(true);
          return;
        }
        const d = r.data;
        // Always apply Sheets data — it is the source of truth
        setters.setProds(d.Produtos || []);
        setters.setClis(d.Clientes || []);
        setters.setVendas(d.Vendas || []);
        setters.setPars(d.Parcelamentos || []);
        setters.setMovs(d.Movimentacoes || []);
        setters.setLogs(d.Logs || []);
        markSheetReady();
        setLoaded(true);
      })
      .catch((e) => {
        console.warn("Sheet load failed:", e);
        setError(e.message);
        setLoaded(true);
        // Do NOT mark ready — don't allow saves if we couldn't load
      });
  }, [scriptUrl, setters]);

  useEffect(() => { refresh(); }, [refresh]);

  return { loaded, error, refresh };
}
