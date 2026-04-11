import { useState, useEffect, useCallback, useRef } from "react";
import { uid } from "./utils";

// ---------------------------------------------------------------------------
// Row <-> JS object mappers
// DB uses snake_case + avoids SQL reserved words (endereco, descr)
// JS keeps the original field names used by all components
// ---------------------------------------------------------------------------

const rowToProd = (r) => ({
  id: r.id, cod: r.cod, nome: r.nome, cat: r.cat,
  custo: +(r.custo ?? 0), preco: +(r.preco ?? 0),
  estoque: r.estoque ?? 0, minimo: r.minimo ?? 0,
});
const prodToRow = (p) => ({
  id: p.id, cod: p.cod || null, nome: p.nome, cat: p.cat || null,
  custo: p.custo || 0, preco: p.preco || 0, estoque: p.estoque || 0, minimo: p.minimo || 0,
});

const rowToCli = (r) => ({
  id: r.id, nome: r.nome, tel: r.tel, cpf: r.cpf,
  email: r.email, end: r.endereco, cad: r.cad,
});
const cliToRow = (c) => ({
  id: c.id, nome: c.nome, tel: c.tel || null, cpf: c.cpf || null,
  email: c.email || null, endereco: c.end || null, cad: c.cad || null,
});

const rowToVenda = (r) => ({
  id: r.id, cliId: r.cli_id, pg: r.pg, data: r.data,
  nLoja: r.n_loja, nCard: r.n_card, total: +(r.total ?? 0),
  itens: (r.venda_itens || []).map((i) => ({ pid: i.pid, qty: i.qty, preco: +(i.preco ?? 0) })),
});
const vendaToRow = (v) => ({
  id: v.id, cli_id: v.cliId, pg: v.pg, data: v.data,
  n_loja: v.nLoja || 1, n_card: v.nCard || 1, total: v.total || 0,
});

const rowToPar = (r) => ({
  id: r.id, vendaId: r.venda_id, num: r.num,
  valor: +(r.valor ?? 0), pago: +(r.pago ?? 0), vence: r.vence,
  pagamentos: (r.pagamentos || []).map((p) => ({ id: p.id, val: +(p.val ?? 0), data: p.data, obs: p.obs })),
});
const parToRow = (p) => ({
  id: p.id, venda_id: p.vendaId, num: p.num,
  valor: p.valor, pago: p.pago || 0, vence: p.vence,
});

const rowToMov = (r) => ({
  id: r.id, pid: r.pid, tipo: r.tipo, qty: r.qty,
  data: r.data, motivo: r.motivo, vendaId: r.venda_id,
});
const movToRow = (m) => ({
  id: m.id, pid: m.pid, tipo: m.tipo, qty: m.qty,
  data: m.data, motivo: m.motivo || null, venda_id: m.vendaId || null,
});

const rowToLog = (r) => ({ id: r.id, ts: r.ts, cat: r.cat, acao: r.acao, desc: r.descr });
const logToRow = (l) => ({ id: l.id, ts: l.ts, cat: l.cat, acao: l.acao, descr: l.desc });

// ---------------------------------------------------------------------------
// Fetch helpers (with joins for nested data)
// ---------------------------------------------------------------------------

const loadSimple = async (supa, table, mapper) => {
  const { data, error } = await supa.from(table).select("*");
  if (error) throw new Error(error.message);
  return (data || []).map(mapper);
};

const loadVendas = async (supa) => {
  const { data, error } = await supa.from("vendas").select("*, venda_itens(pid, qty, preco)");
  if (error) throw new Error(error.message);
  return (data || []).map(rowToVenda);
};

const loadPars = async (supa) => {
  const { data, error } = await supa.from("parcelamentos").select("*, pagamentos(id, val, data, obs)");
  if (error) throw new Error(error.message);
  return (data || []).map(rowToPar);
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSupabaseData(supa) {
  const [state, setState] = useState({
    produtos: [], clientes: [], vendas: [], parcelamentos: [], movimentacoes: [], logs: [],
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(null);
  const savingRef = useRef(0);
  const [saving, setSaving] = useState(false);

  const trackSave = (promise) => {
    savingRef.current++;
    setSaving(true);
    promise.finally(() => {
      savingRef.current--;
      if (savingRef.current === 0) setSaving(false);
    });
  };

  // Initial load
  useEffect(() => {
    if (!supa) { setLoaded(true); return; }
    Promise.all([
      loadSimple(supa, "produtos",      rowToProd),
      loadSimple(supa, "clientes",      rowToCli),
      loadVendas(supa),
      loadPars(supa),
      loadSimple(supa, "movimentacoes", rowToMov),
      loadSimple(supa, "logs",          rowToLog),
    ])
      .then(([produtos, clientes, vendas, parcelamentos, movimentacoes, logs]) => {
        setState({ produtos, clientes, vendas, parcelamentos, movimentacoes, logs });
        setLoaded(true);
      })
      .catch((e) => { setError(e.message); setLoaded(true); });
  }, [supa]);

  // Real-time subscriptions
  useEffect(() => {
    if (!supa || !loaded) return;

    // Simple tables: incremental row-level updates
    const simple = (table, mapper, key) =>
      supa.channel("rt_" + table)
        .on("postgres_changes", { event: "INSERT", schema: "public", table }, ({ new: row }) =>
          setState((s) => ({ ...s, [key]: [...s[key].filter((r) => r.id !== row.id), mapper(row)] })))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table }, ({ new: row }) =>
          setState((s) => ({ ...s, [key]: s[key].map((r) => r.id === row.id ? mapper(row) : r) })))
        .on("postgres_changes", { event: "DELETE", schema: "public", table }, ({ old: row }) =>
          setState((s) => ({ ...s, [key]: s[key].filter((r) => r.id !== row.id) })))
        .subscribe();

    // Joined tables: re-fetch the full collection on any change
    const onVendasChange = () => loadVendas(supa).then((vendas) => setState((s) => ({ ...s, vendas })));
    const onParsChange   = () => loadPars(supa).then((parcelamentos) => setState((s) => ({ ...s, parcelamentos })));

    const channels = [
      simple("produtos",      rowToProd, "produtos"),
      simple("clientes",      rowToCli,  "clientes"),
      simple("movimentacoes", rowToMov,  "movimentacoes"),
      simple("logs",          rowToLog,  "logs"),
      supa.channel("rt_vendas")
        .on("postgres_changes", { event: "*", schema: "public", table: "vendas"      }, onVendasChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "venda_itens" }, onVendasChange)
        .subscribe(),
      supa.channel("rt_pars")
        .on("postgres_changes", { event: "*", schema: "public", table: "parcelamentos" }, onParsChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "pagamentos"    }, onParsChange)
        .subscribe(),
    ];

    return () => channels.forEach((c) => supa.removeChannel(c));
  }, [supa, loaded]);

  const set = useCallback((table, updater) =>
    setState((s) => ({ ...s, [table]: typeof updater === "function" ? updater(s[table]) : updater }))
  , []);

  const insert = useCallback((table, record) => {
    if (!supa) return;
    const run = async () => {
      if (table === "vendas") {
        const { error: e1 } = await supa.from("vendas").insert(vendaToRow(record));
        if (e1) { console.error("insert vendas", e1.message); return; }
        if (record.itens?.length) {
          const { error: e2 } = await supa.from("venda_itens").insert(
            record.itens.map((i) => ({ id: uid(), venda_id: record.id, pid: i.pid, qty: i.qty, preco: i.preco }))
          );
          if (e2) console.error("insert venda_itens", e2.message);
        }
        return;
      }
      if (table === "parcelamentos") {
        const { error } = await supa.from("parcelamentos").insert(parToRow(record));
        if (error) console.error("insert parcelamentos", error.message);
        return;
      }
      const toRow = { produtos: prodToRow, clientes: cliToRow, movimentacoes: movToRow, logs: logToRow }[table];
      if (!toRow) { console.error("insert: unknown table", table); return; }
      const { error } = await supa.from(table).insert(toRow(record));
      if (error) console.error("insert", table, error.message);
    };
    trackSave(run());
  }, [supa]);

  const upsert = useCallback((table, record) => {
    if (!supa) return;
    const run = async () => {
      if (table === "parcelamentos") {
        const { error: e1 } = await supa.from("parcelamentos").upsert(parToRow(record));
        if (e1) { console.error("upsert parcelamentos", e1.message); return; }
        if (record.pagamentos?.length) {
          const { error: e2 } = await supa.from("pagamentos").upsert(
            record.pagamentos.map((p) => ({ id: p.id, par_id: record.id, val: p.val, data: p.data, obs: p.obs || null })),
            { onConflict: "id", ignoreDuplicates: true }
          );
          if (e2) console.error("upsert pagamentos", e2.message);
        }
        return;
      }
      const toRow = { produtos: prodToRow, clientes: cliToRow, movimentacoes: movToRow, logs: logToRow }[table];
      if (!toRow) { console.error("upsert: unknown table", table); return; }
      const { error } = await supa.from(table).upsert(toRow(record));
      if (error) console.error("upsert", table, error.message);
    };
    trackSave(run());
  }, [supa]);

  const remove = useCallback((table, id) => {
    if (!supa) return;
    trackSave(
      supa.from(table).delete().eq("id", id)
        .then(({ error }) => { if (error) console.error("remove", table, error.message); })
    );
  }, [supa]);

  return {
    prods: state.produtos,
    clis:  state.clientes,
    vendas: state.vendas,
    pars:  state.parcelamentos,
    movs:  state.movimentacoes,
    logs:  state.logs,
    set, insert, upsert, remove,
    loaded, error, saving,
  };
}
