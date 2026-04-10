import { useState, useEffect, useCallback, useRef } from "react";

const TABLES = ["produtos", "clientes", "vendas", "parcelamentos", "movimentacoes", "logs"];

export function useSupabaseData(supa) {
  const [state, setState] = useState({
    produtos: [], clientes: [], vendas: [], parcelamentos: [], movimentacoes: [], logs: [],
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const savingRef = useRef(0);
  const [saving, setSaving] = useState(false);

  const trackSave = async (promise) => {
    savingRef.current++;
    setSaving(true);
    try { await promise; }
    finally {
      savingRef.current--;
      if (savingRef.current === 0) setSaving(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!supa) { setLoaded(true); return; }
    Promise.all(TABLES.map(t => supa.from(t).select("record").then(r => ({ t, ...r }))))
      .then(results => {
        const s = {};
        for (const { t, data, error } of results) {
          if (error) throw new Error(error.message);
          s[t] = (data || []).map(r => r.record);
        }
        setState(s);
        setLoaded(true);
      })
      .catch(e => { setError(e.message); setLoaded(true); });
  }, [supa]);

  // Real-time subscriptions
  useEffect(() => {
    if (!supa || !loaded) return;
    const channels = TABLES.map(table =>
      supa.channel("rt_" + table)
        .on("postgres_changes", { event: "INSERT", schema: "public", table }, ({ new: row }) =>
          setState(s => ({ ...s, [table]: [...s[table].filter(r => r.id !== row.record?.id), row.record] }))
        )
        .on("postgres_changes", { event: "UPDATE", schema: "public", table }, ({ new: row }) =>
          setState(s => ({ ...s, [table]: s[table].map(r => r.id === row.record?.id ? row.record : r) }))
        )
        .on("postgres_changes", { event: "DELETE", schema: "public", table }, ({ old: row }) =>
          setState(s => ({ ...s, [table]: s[table].filter(r => r.id !== row.id) }))
        )
        .subscribe()
    );
    return () => channels.forEach(c => supa.removeChannel(c));
  }, [supa, loaded]);

  const set = useCallback((table, updater) =>
    setState(s => ({ ...s, [table]: typeof updater === "function" ? updater(s[table]) : updater }))
  , []);

  const insert = useCallback((table, record) => {
    if (!supa) return;
    trackSave(supa.from(table).insert({ id: record.id, record })
      .then(({ error }) => { if (error) console.error("insert", table, error.message); }));
  }, [supa]);

  const upsert = useCallback((table, record) => {
    if (!supa) return;
    trackSave(supa.from(table).upsert({ id: record.id, record })
      .then(({ error }) => { if (error) console.error("upsert", table, error.message); }));
  }, [supa]);

  const remove = useCallback((table, id) => {
    if (!supa) return;
    trackSave(supa.from(table).delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("remove", table, error.message); }));
  }, [supa]);

  return {
    prods: state.produtos,
    clis: state.clientes,
    vendas: state.vendas,
    pars: state.parcelamentos,
    movs: state.movimentacoes,
    logs: state.logs,
    set, insert, upsert, remove,
    loaded, error, saving,
  };
}
