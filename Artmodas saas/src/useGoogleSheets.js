import { useState, useEffect, useCallback, useRef } from "react";

const SHEET_MAP = {
  lc_prods:  "Produtos",
  lc_clis:   "Clientes",
  lc_vendas: "Vendas",
  lc_pars:   "Parcelamentos",
  lc_movs:   "Movimentacoes",
};

const DEBOUNCE_MS = 1500;

/**
 * Hook that mirrors useLocalStorage API but persists to Google Sheets.
 * Keeps localStorage as a fast cache and syncs to Sheets in the background.
 */
export function useGoogleSheet(key, fallback, scriptUrl) {
  const sheetName = SHEET_MAP[key];

  // Init from localStorage cache (instant load)
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
  latestRef.current = value;

  // Keep localStorage in sync (fast cache)
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore */ }
  }, [key, value]);

  // Debounced save to Google Sheets
  useEffect(() => {
    if (!scriptUrl) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSaving(true);
      fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify({ action: "write", sheet: sheetName, data: latestRef.current }),
      })
        .then((r) => r.json())
        .then((r) => { if (!r.ok) console.warn("Sheet save error:", r.error); })
        .catch((e) => console.warn("Sheet save failed:", e))
        .finally(() => setSaving(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [value, scriptUrl, sheetName]);

  return [value, setValue, saving];
}

/**
 * Load all data from Google Sheets on first mount.
 * Returns { loaded, error, refresh }.
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
    fetch(scriptUrl + "?action=readAll")
      .then((r) => r.json())
      .then((r) => {
        if (!r.ok) { setError(r.error); setLoaded(true); return; }
        const d = r.data;
        if (d.Produtos?.length)       setters.setProds(d.Produtos);
        if (d.Clientes?.length)       setters.setClis(d.Clientes);
        if (d.Vendas?.length)         setters.setVendas(d.Vendas);
        if (d.Parcelamentos?.length)  setters.setPars(d.Parcelamentos);
        if (d.Movimentacoes?.length)  setters.setMovs(d.Movimentacoes);
        setLoaded(true);
      })
      .catch((e) => {
        console.warn("Sheet load failed:", e);
        setError(e.message);
        setLoaded(true); // still show app with localStorage cache
      });
  }, [scriptUrl, setters]);

  useEffect(() => { refresh(); }, [refresh]);

  return { loaded, error, refresh };
}
