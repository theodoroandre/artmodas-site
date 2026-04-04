import { useState } from "react";

// ─── Utils ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const R$ = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dtBR = d => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
const hoje = () => new Date().toISOString().slice(0, 10);
const addMes = (d, n) => { const dt = new Date(d + "T00:00:00"); dt.setMonth(dt.getMonth() + n); return dt.toISOString().slice(0, 10); };

// ─── Constantes ───────────────────────────────────────────────────────────────
const PG = {
  dinheiro:     { label: "Dinheiro",     cor: "#22c55e" },
  pix:          { label: "Pix",          cor: "#818cf8" },
  debito:       { label: "Débito",       cor: "#38bdf8" },
  credito:      { label: "Crédito",      cor: "#f59e0b" },
  credito_loja: { label: "Créd. Loja",   cor: "#f472b6" },
};
const stPar = p => {
  if (p.pago >= p.valor) return "pago";
  if (p.pago > 0) return "parcial";
  if (p.vence < hoje()) return "vencido";
  return "aberto";
};
const COR = { pago: "#22c55e", parcial: "#f59e0b", vencido: "#ef4444", aberto: "#64748b" };
const LBL = { pago: "Pago", parcial: "Parcial", vencido: "Vencido", aberto: "Aberto" };

// ─── Seed ─────────────────────────────────────────────────────────────────────
const PROD0 = [
  { id: "p1", nome: "Blusa Floral M",  cat: "Blusas",   custo: 35, preco: 89.9,  estoque: 8, minimo: 3 },
  { id: "p2", nome: "Calça Jeans 40",  cat: "Calças",   custo: 60, preco: 149.9, estoque: 5, minimo: 2 },
  { id: "p3", nome: "Vestido Midi P",  cat: "Vestidos", custo: 75, preco: 189.9, estoque: 3, minimo: 2 },
  { id: "p4", nome: "Saia Plissada G", cat: "Saias",    custo: 45, preco: 99.9,  estoque: 0, minimo: 2 },
];
const CLI0 = [
  { id: "c1", nome: "Ana Souza",  tel: "31 99999-0001", email: "ana@email.com", cpf: "", end: "", cad: hoje() },
  { id: "c2", nome: "Bruno Lima", tel: "31 98888-0002", email: "",              cpf: "", end: "", cad: hoje() },
];
const mkPar = v => {
  if (v.pg !== "credito_loja" || !v.nLoja) return [];
  const base = +(v.total / v.nLoja).toFixed(2);
  return Array.from({ length: v.nLoja }, (_, i) => ({
    id: uid(), vendaId: v.id, num: i + 1,
    valor: i === v.nLoja - 1 ? +(v.total - base * (v.nLoja - 1)).toFixed(2) : base,
    vence: addMes(v.data, i + 1), pago: 0, pagamentos: [],
  }));
};
const VND0 = [
  { id: "v1", cliId: "c1", data: hoje(), pg: "credito_loja", nLoja: 3, nCard: 1, itens: [{ pid: "p1", qty: 1, preco: 89.9 }, { pid: "p3", qty: 1, preco: 189.9 }], total: 279.8 },
  { id: "v2", cliId: "c2", data: hoje(), pg: "pix",          nLoja: 0, nCard: 1, itens: [{ pid: "p2", qty: 1, preco: 149.9 }], total: 149.9 },
];
const PAR0 = VND0.flatMap(mkPar);
const MOV0 = VND0.flatMap(v => v.itens.map(it => ({ id: uid(), pid: it.pid, tipo: "saida", qty: it.qty, data: v.data, motivo: "Venda", vendaId: v.id })));

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#1a1d24}::-webkit-scrollbar-thumb{background:#2d3244;border-radius:3px}
input,select,textarea{font-family:inherit}
.inp{background:#1a1d24;border:1px solid #2d3244;border-radius:7px;color:#e2e8f0;padding:9px 12px;font-size:13px;width:100%;outline:none;transition:border .15s}
.inp:focus{border-color:#6366f1}
.lbl{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;margin-bottom:5px;display:block}
.btn{cursor:pointer;border:none;border-radius:7px;font-family:inherit;font-size:13px;font-weight:500;padding:9px 17px;transition:all .15s}
.prim{background:#6366f1;color:#fff}.prim:hover{background:#4f52d4}
.ghost{background:transparent;color:#94a3b8;border:1px solid #2d3244}.ghost:hover{background:#1e2230;color:#e2e8f0}
.card{background:#161921;border:1px solid #1e2230;border-radius:12px}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:500}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:9px 13px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #1e2230;font-weight:500}
td{padding:10px 13px;border-bottom:1px solid #1a1d24;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#1a1d2466}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
.mod{background:#161921;border:1px solid #2d3244;border-radius:16px;padding:26px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto}
.sy{font-family:'Syne',sans-serif}
.fr{display:flex;gap:12px}
.fc{flex:1}
`;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]     = useState("painel");
  const [prods, setProds] = useState(PROD0);
  const [clis, setClis]   = useState(CLI0);
  const [vendas, setVendas] = useState(VND0);
  const [pars, setPars]   = useState(PAR0);
  const [movs, setMovs]   = useState(MOV0);
  const [modal, setModal] = useState(null);
  const close = () => setModal(null);

  const pmap = Object.fromEntries(prods.map(p => [p.id, p]));
  const cmap = Object.fromEntries(clis.map(c => [c.id, c]));
  const vmap = Object.fromEntries(vendas.map(v => [v.id, v]));

  const addProd  = p => setProds(x => [...x, { ...p, id: uid() }]);
  const editProd = p => setProds(x => x.map(q => q.id === p.id ? p : q));

  const entrada = ({ pid, qty, data, obs }) => {
    setProds(x => x.map(p => p.id === pid ? { ...p, estoque: p.estoque + qty } : p));
    setMovs(x => [...x, { id: uid(), pid, tipo: "entrada", qty, data, motivo: obs || "Entrada de estoque" }]);
  };

  const addVenda = v => {
    const nv = { ...v, id: uid() };
    setVendas(x => [...x, nv]);
    nv.itens.forEach(it => {
      setProds(x => x.map(p => p.id === it.pid ? { ...p, estoque: Math.max(0, p.estoque - it.qty) } : p));
      setMovs(x => [...x, { id: uid(), pid: it.pid, tipo: "saida", qty: it.qty, data: nv.data, motivo: "Venda", vendaId: nv.id }]);
    });
    if (nv.pg === "credito_loja") setPars(x => [...x, ...mkPar(nv)]);
  };

  const pagarPar = (id, val, data, obs) => {
    setPars(x => x.map(p => {
      if (p.id !== id) return p;
      const np = Math.min(p.valor, +(p.pago + val).toFixed(2));
      return { ...p, pago: np, pagamentos: [...p.pagamentos, { id: uid(), val, data, obs }] };
    }));
  };

  const TABS = [
    { id: "painel",    l: "Painel" },
    { id: "estoque",   l: "Estoque" },
    { id: "vendas",    l: "Vendas" },
    { id: "clientes",  l: "Clientes" },
    { id: "cobrancas", l: "Cobranças" },
  ];

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0d0f14", minHeight: "100vh", color: "#e2e8f0" }}>
      <style>{CSS}</style>

      {/* Nav */}
      <div style={{ background: "#0d0f14", borderBottom: "1px solid #1e2230", padding: "0 22px", display: "flex", alignItems: "center", gap: 18, position: "sticky", top: 0, zIndex: 50 }}>
        <div className="sy" style={{ fontWeight: 800, fontSize: 17, color: "#6366f1", padding: "15px 0", letterSpacing: "-.02em" }}>
          LOJA<span style={{ color: "#e2e8f0" }}>CTRL</span>
        </div>
        <nav style={{ display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="btn"
              style={{ padding: "5px 13px", borderRadius: 7, fontSize: 13, background: tab === t.id ? "#1e2230" : "transparent", color: tab === t.id ? "#e2e8f0" : "#64748b", border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {t.l}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "painel"    && <Painel prods={prods} clis={clis} vendas={vendas} pars={pars} cmap={cmap} setTab={setTab} onPagar={vid => setModal({ type: "pagar", vid })} />}
        {tab === "estoque"   && <Estoque prods={prods} movs={movs} pmap={pmap} cmap={cmap} vmap={vmap} onNovoProd={() => setModal({ type: "prod" })} onEntrada={() => setModal({ type: "entrada" })} onEdit={p => setModal({ type: "prod", prod: p })} />}
        {tab === "vendas"    && <Vendas vendas={vendas} cmap={cmap} pmap={pmap} pars={pars} onNova={() => setModal({ type: "venda" })} onPagar={vid => setModal({ type: "pagar", vid })} />}
        {tab === "clientes"  && <Clientes clis={clis} vendas={vendas} pars={pars} pmap={pmap} onNovo={() => setModal({ type: "cli" })} onDetalhe={c => setModal({ type: "detCli", cli: c })} onPagar={vid => setModal({ type: "pagar", vid })} />}
        {tab === "cobrancas" && <Cobrancas pars={pars} vendas={vendas} cmap={cmap} onPagar={vid => setModal({ type: "pagar", vid })} />}
      </div>

      {/* Modals */}
      {modal?.type === "prod"    && <ProdModal    prod={modal.prod} onClose={close} onSave={p => { modal.prod ? editProd(p) : addProd(p); close(); }} />}
      {modal?.type === "entrada" && <EntradaModal prods={prods} onClose={close} onSave={e => { entrada(e); close(); }} />}
      {modal?.type === "cli"     && <CliModal     onClose={close} onSave={c => { setClis(x => [...x, { ...c, id: uid(), cad: hoje() }]); close(); }} />}
      {modal?.type === "venda"   && <VendaModal   prods={prods} clis={clis} onClose={close} onSave={v => { addVenda(v); close(); }} />}
      {modal?.type === "detCli"  && <DetCliModal  cli={modal.cli} vendas={vendas.filter(v => v.cliId === modal.cli.id)} pars={pars} pmap={pmap} onClose={close} onPagar={vid => { close(); setModal({ type: "pagar", vid }); }} />}
      {modal?.type === "pagar"   && <PagarModal   venda={vmap[modal.vid]} pars={pars.filter(p => p.vendaId === modal.vid)} onClose={close} onPay={pagarPar} />}
    </div>
  );
}

// ─── Painel ───────────────────────────────────────────────────────────────────
function Painel({ prods, clis, vendas, pars, cmap, setTab, onPagar }) {
  const estBaixo = prods.filter(p => p.estoque <= p.minimo);
  const vencidas = pars.filter(p => stPar(p) === "vencido");
  const totalVendido = vendas.reduce((a, v) => a + v.total, 0);
  const totalPars = pars.reduce((a, p) => a + p.pago, 0);
  const totalAvista = vendas.filter(v => v.pg !== "credito_loja").reduce((a, v) => a + v.total, 0);
  const totalPendente = pars.reduce((a, p) => a + Math.max(0, p.valor - p.pago), 0);

  // inadimplentes únicos
  const inadiSet = new Set();
  vencidas.forEach(p => { const v = vendas.find(x => x.id === p.vendaId); if (v) inadiSet.add(v.cliId); });

  const proxVenc = pars
    .filter(p => stPar(p) !== "pago" && p.vence >= hoje())
    .sort((a, b) => a.vence.localeCompare(b.vence))
    .slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Painel</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>Visão geral da loja</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
        {[
          { l: "Total Vendido",  v: R$(totalVendido),              cor: "#6366f1" },
          { l: "Total Recebido", v: R$(totalPars + totalAvista),   cor: "#22c55e" },
          { l: "A Receber",      v: R$(totalPendente),             cor: "#f59e0b" },
          { l: "Inadimplentes",  v: inadiSet.size,                 cor: "#ef4444" },
        ].map(s => (
          <div key={s.l} className="card" style={{ padding: 18 }}>
            <div className="sy" style={{ fontSize: 26, fontWeight: 700, color: s.cor }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Estoque crítico */}
        <div className="card" style={{ padding: 18 }}>
          <div className="sy" style={{ fontWeight: 700, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠ Estoque Crítico</span>
            <span style={{ background: "#78350f44", color: "#fbbf24", borderRadius: 20, padding: "1px 9px", fontSize: 12 }}>{estBaixo.length}</span>
          </div>
          {estBaixo.length === 0
            ? <p style={{ color: "#64748b", fontSize: 13 }}>Estoque OK ✓</p>
            : <table><thead><tr><th>Produto</th><th>Saldo</th><th>Mín</th></tr></thead>
                <tbody>{estBaixo.map(p => (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td style={{ color: p.estoque === 0 ? "#ef4444" : "#f59e0b", fontWeight: 600 }}>{p.estoque}</td>
                    <td style={{ color: "#64748b" }}>{p.minimo}</td>
                  </tr>
                ))}</tbody></table>}
        </div>

        {/* Vencidas */}
        <div className="card" style={{ padding: 18 }}>
          <div className="sy" style={{ fontWeight: 700, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🔴 Parcelas Vencidas</span>
            <span style={{ background: "#7f1d1d44", color: "#f87171", borderRadius: 20, padding: "1px 9px", fontSize: 12 }}>{vencidas.length}</span>
          </div>
          {vencidas.length === 0
            ? <p style={{ color: "#64748b", fontSize: 13 }}>Nenhuma em atraso 🎉</p>
            : <table><thead><tr><th>Cliente</th><th>Venceu</th><th>Saldo</th></tr></thead>
                <tbody>{vencidas.slice(0, 5).map(p => {
                  const v = vendas.find(x => x.id === p.vendaId);
                  const c = cmap[v?.cliId];
                  return (
                    <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => onPagar(p.vendaId)}>
                      <td style={{ color: "#e2e8f0" }}>{c?.nome || "—"}</td>
                      <td style={{ color: "#ef4444" }}>{dtBR(p.vence)}</td>
                      <td style={{ color: "#ef4444" }}>{R$(p.valor - p.pago)}</td>
                    </tr>
                  );
                })}</tbody></table>}
        </div>

        {/* Próximos vencimentos */}
        <div className="card" style={{ padding: 18 }}>
          <div className="sy" style={{ fontWeight: 700, marginBottom: 12 }}>📅 Próximos Vencimentos</div>
          {proxVenc.length === 0
            ? <p style={{ color: "#64748b", fontSize: 13 }}>Nenhum</p>
            : <table><thead><tr><th>Cliente</th><th>Vence</th><th>Valor</th></tr></thead>
                <tbody>{proxVenc.map(p => {
                  const v = vendas.find(x => x.id === p.vendaId);
                  const c = cmap[v?.cliId];
                  return (
                    <tr key={p.id}>
                      <td>{c?.nome || "—"}</td>
                      <td style={{ color: "#94a3b8" }}>{dtBR(p.vence)}</td>
                      <td style={{ color: "#f59e0b" }}>{R$(p.valor - p.pago)}</td>
                    </tr>
                  );
                })}</tbody></table>}
        </div>

        {/* Ações rápidas */}
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="sy" style={{ fontWeight: 700, marginBottom: 4 }}>Ações Rápidas</div>
          <button className="btn prim" onClick={() => setTab("vendas")} style={{ width: "100%", textAlign: "left" }}>🛒 Nova Venda</button>
          <button className="btn ghost" onClick={() => setTab("estoque")} style={{ width: "100%", textAlign: "left" }}>📦 Entrada de Estoque</button>
          <button className="btn ghost" onClick={() => setTab("clientes")} style={{ width: "100%", textAlign: "left" }}>👤 Novo Cliente</button>
          <button className="btn ghost" onClick={() => setTab("cobrancas")} style={{ width: "100%", textAlign: "left" }}>💰 Ver Cobranças</button>
        </div>
      </div>
    </div>
  );
}

// ─── Estoque ──────────────────────────────────────────────────────────────────
function Estoque({ prods, movs, pmap, cmap, vmap, onNovoProd, onEntrada, onEdit }) {
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState("todas");
  const [showMovs, setShowMovs] = useState(false);

  const cats = [...new Set(prods.map(p => p.cat))];
  const filtrados = prods.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) &&
    (cat === "todas" || p.cat === cat)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Estoque</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{prods.length} produto(s)</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn ghost" onClick={onEntrada}>↑ Entrada</button>
          <button className="btn prim"  onClick={onNovoProd}>+ Novo Produto</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input className="inp" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: 260 }} />
        <select className="inp" value={cat} onChange={e => setCat(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="todas">Todas categorias</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Produto</th><th>Categoria</th><th>Custo</th><th>Preço Venda</th><th>Saldo</th><th>Mínimo</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtrados.map(p => {
              const crit = p.estoque <= p.minimo;
              const zero = p.estoque === 0;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.nome}</td>
                  <td style={{ color: "#64748b" }}>{p.cat}</td>
                  <td style={{ color: "#64748b" }}>{R$(p.custo)}</td>
                  <td style={{ color: "#6366f1", fontWeight: 600 }}>{R$(p.preco)}</td>
                  <td>
                    <span className="sy" style={{ fontWeight: 700, fontSize: 20, color: zero ? "#ef4444" : crit ? "#f59e0b" : "#22c55e" }}>{p.estoque}</span>
                    <span style={{ color: "#64748b", fontSize: 12, marginLeft: 4 }}>un</span>
                  </td>
                  <td style={{ color: "#64748b" }}>{p.minimo}</td>
                  <td>
                    {zero  ? <span className="badge" style={{ background: "#7f1d1d22", color: "#f87171" }}>Sem estoque</span>
                    : crit ? <span className="badge" style={{ background: "#78350f22", color: "#fbbf24" }}>Crítico</span>
                    :        <span className="badge" style={{ background: "#14532d22", color: "#4ade80" }}>OK</span>}
                  </td>
                  <td><button className="btn ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => onEdit(p)}>Editar</button></td>
                </tr>
              );
            })}
            {filtrados.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: 28 }}>Nenhum produto</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Movimentações */}
      <div>
        <button className="btn ghost" style={{ fontSize: 12, marginBottom: 12 }} onClick={() => setShowMovs(!showMovs)}>
          {showMovs ? "▲" : "▼"} Histórico de Movimentações ({movs.length})
        </button>
        {showMovs && (
          <div className="card">
            <table>
              <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Motivo / Cliente</th></tr></thead>
              <tbody>
                {[...movs].reverse().map(m => {
                  const venda = m.vendaId ? vmap[m.vendaId] : null;
                  const cli   = venda ? cmap[venda.cliId] : null;
                  return (
                    <tr key={m.id}>
                      <td style={{ color: "#64748b" }}>{dtBR(m.data)}</td>
                      <td>{pmap[m.pid]?.nome || "—"}</td>
                      <td>
                        <span className="badge" style={{ background: m.tipo === "entrada" ? "#14532d22" : "#7f1d1d22", color: m.tipo === "entrada" ? "#4ade80" : "#f87171" }}>
                          {m.tipo === "entrada" ? "↑ Entrada" : "↓ Saída"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: m.tipo === "entrada" ? "#4ade80" : "#f87171" }}>{m.tipo === "entrada" ? "+" : "-"}{m.qty}</td>
                      <td style={{ color: "#64748b" }}>{cli ? `Venda · ${cli.nome}` : m.motivo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vendas ───────────────────────────────────────────────────────────────────
function Vendas({ vendas, cmap, pmap, pars, onNova, onPagar }) {
  const [busca, setBusca] = useState("");
  const filtradas = vendas.filter(v => {
    const c = cmap[v.cliId];
    return c?.nome.toLowerCase().includes(busca.toLowerCase()) ||
      v.itens.some(i => pmap[i.pid]?.nome.toLowerCase().includes(busca.toLowerCase()));
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Vendas</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{vendas.length} venda(s)</p>
        </div>
        <button className="btn prim" onClick={onNova}>+ Nova Venda</button>
      </div>
      <input className="inp" placeholder="Buscar por cliente ou produto..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: 340 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtradas.length === 0 && <div className="card" style={{ padding: 32, textAlign: "center", color: "#64748b" }}>Nenhuma venda</div>}
        {[...filtradas].reverse().map(v => {
          const cli  = cmap[v.cliId];
          const pg   = PG[v.pg];
          const vPars = pars.filter(p => p.vendaId === v.id);
          const pago  = vPars.reduce((a, p) => a + p.pago, 0);
          const pct   = vPars.length ? Math.round((pago / v.total) * 100) : 100;
          const atras = vPars.filter(p => stPar(p) === "vencido").length;
          return (
            <div key={v.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                    <span className="sy" style={{ fontWeight: 700, fontSize: 15 }}>{cli?.nome || "—"}</span>
                    <span className="badge" style={{ background: pg.cor + "22", color: pg.cor }}>{pg.label}</span>
                    {v.pg === "credito_loja" && <span style={{ color: "#f472b6", fontSize: 12 }}>{v.nLoja}×</span>}
                    {v.pg === "credito" && v.nCard > 1 && <span style={{ color: "#f59e0b", fontSize: 12 }}>{v.nCard}× cartão</span>}
                    {atras > 0 && <span className="badge" style={{ background: "#7f1d1d22", color: "#f87171" }}>⚠ {atras} em atraso</span>}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>
                    {dtBR(v.data)} · {v.itens.map(i => `${pmap[i.pid]?.nome || "?"} (${i.qty})`).join(", ")}
                  </div>
                  {v.pg === "credito_loja" && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 3 }}>
                        <span>{R$(pago)} recebido</span><span>{pct}%</span>
                      </div>
                      <div style={{ background: "#1e2230", borderRadius: 4, height: 5 }}>
                        <div style={{ background: pct === 100 ? "#22c55e" : "#f472b6", width: `${pct}%`, height: "100%", borderRadius: 4 }} />
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                        {vPars.map(p => {
                          const st = stPar(p);
                          return <div key={p.id} title={`${p.num}ª · ${dtBR(p.vence)} · ${R$(p.valor)}`}
                            style={{ width: 26, height: 26, borderRadius: 5, background: COR[st], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 600 }}>{p.num}</div>;
                        })}
                        <div style={{ fontSize: 11, color: "#64748b", display: "flex", gap: 8, alignItems: "center", marginLeft: 4 }}>
                          {Object.entries(LBL).map(([k, v]) => (
                            <span key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 2, background: COR[k], display: "inline-block" }} />{v}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <span className="sy" style={{ fontWeight: 700, fontSize: 20 }}>{R$(v.total)}</span>
                  {v.pg === "credito_loja" && pct < 100 && (
                    <button className="btn prim" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => onPagar(v.id)}>Registrar Pag.</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
function Clientes({ clis, vendas, pars, pmap, onNovo, onDetalhe, onPagar }) {
  const [busca, setBusca] = useState("");
  const filtrados = clis.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) || c.tel.includes(busca)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Clientes</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{clis.length} cadastrado(s)</p>
        </div>
        <button className="btn prim" onClick={onNovo}>+ Novo Cliente</button>
      </div>
      <input className="inp" placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: 340 }} />
      <div className="card">
        <table>
          <thead><tr><th>Nome</th><th>Telefone</th><th>Compras</th><th>Saldo Aberto</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtrados.map(c => {
              const cVendas = vendas.filter(v => v.cliId === c.id);
              const cPars   = pars.filter(p => cVendas.some(v => v.id === p.vendaId));
              const pendente = cPars.reduce((a, p) => a + Math.max(0, p.valor - p.pago), 0);
              const atras    = cPars.filter(p => stPar(p) === "vencido");
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ color: "#94a3b8" }}>{c.tel}</td>
                  <td style={{ color: "#6366f1" }}>{cVendas.length}</td>
                  <td style={{ color: pendente > 0 ? "#f59e0b" : "#22c55e", fontWeight: 600 }}>{R$(pendente)}</td>
                  <td>
                    {atras.length > 0
                      ? <span className="badge" style={{ background: "#7f1d1d22", color: "#f87171" }}>⚠ {atras.length} em atraso</span>
                      : pendente > 0
                        ? <span className="badge" style={{ background: "#78350f22", color: "#fbbf24" }}>Ativo</span>
                        : <span className="badge" style={{ background: "#14532d22", color: "#4ade80" }}>OK</span>}
                  </td>
                  <td><button className="btn ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => onDetalhe(c)}>Detalhes</button></td>
                </tr>
              );
            })}
            {filtrados.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: 28 }}>Nenhum cliente</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Cobranças ────────────────────────────────────────────────────────────────
function Cobrancas({ pars, vendas, cmap, onPagar }) {
  const [filtro, setFiltro] = useState("todos");
  const vmap = Object.fromEntries(vendas.map(v => [v.id, v]));

  const filtradas = pars
    .filter(p => filtro === "todos" || stPar(p) === filtro)
    .sort((a, b) => a.vence.localeCompare(b.vence));

  const counts = { todos: pars.length };
  pars.forEach(p => { const s = stPar(p); counts[s] = (counts[s] || 0) + 1; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Cobranças</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["todos", "vencido", "aberto", "parcial", "pago"].map(f => (
          <button key={f} className="btn"
            onClick={() => setFiltro(f)}
            style={{ padding: "5px 13px", fontSize: 12, background: filtro === f ? (f === "todos" ? "#6366f1" : COR[f]) : "#1e2230", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}>
            {f === "todos" ? "Todos" : LBL[f]}{counts[f] ? ` (${counts[f]})` : ""}
          </button>
        ))}
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Cliente</th><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Pago</th><th>Saldo</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtradas.map(p => {
              const v  = vmap[p.vendaId];
              const c  = cmap[v?.cliId];
              const st = stPar(p);
              const sl = p.valor - p.pago;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{c?.nome || "—"}</td>
                  <td style={{ color: "#94a3b8" }}>{p.num}ª</td>
                  <td style={{ color: st === "vencido" ? "#ef4444" : "#94a3b8" }}>{dtBR(p.vence)}</td>
                  <td>{R$(p.valor)}</td>
                  <td style={{ color: "#22c55e" }}>{R$(p.pago)}</td>
                  <td style={{ color: sl > 0 ? "#f59e0b" : "#22c55e", fontWeight: 500 }}>{R$(sl)}</td>
                  <td><span className="badge" style={{ background: COR[st] + "22", color: COR[st] }}>{LBL[st]}</span></td>
                  <td>{st !== "pago" && <button className="btn ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => onPagar(p.vendaId)}>Pagar</button>}</td>
                </tr>
              );
            })}
            {filtradas.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: 28 }}>Nenhuma parcela</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Modal: Produto ───────────────────────────────────────────────────────────
function ProdModal({ prod, onClose, onSave }) {
  const [f, setF] = useState(prod || { nome: "", cat: "", custo: "", preco: "", estoque: "0", minimo: "2" });
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const valid = f.nome && +f.preco > 0;
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mod">
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{prod ? "Editar" : "Novo"} Produto</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div><label className="lbl">Nome *</label><input className="inp" value={f.nome} onChange={s("nome")} placeholder="Ex: Blusa Floral M" /></div>
          <div><label className="lbl">Categoria</label><input className="inp" value={f.cat} onChange={s("cat")} placeholder="Ex: Blusas" /></div>
          <div className="fr">
            <div className="fc"><label className="lbl">Custo (R$)</label><input className="inp" type="number" min="0" value={f.custo} onChange={s("custo")} /></div>
            <div className="fc"><label className="lbl">Preço Venda *</label><input className="inp" type="number" min="0" value={f.preco} onChange={s("preco")} /></div>
          </div>
          <div className="fr">
            <div className="fc"><label className="lbl">Estoque Inicial</label><input className="inp" type="number" min="0" value={f.estoque} onChange={s("estoque")} /></div>
            <div className="fc"><label className="lbl">Estoque Mínimo</label><input className="inp" type="number" min="0" value={f.minimo} onChange={s("minimo")} /></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn prim" disabled={!valid} onClick={() => onSave({ ...f, custo: +f.custo, preco: +f.preco, estoque: +f.estoque || 0, minimo: +f.minimo || 0 })} style={{ opacity: valid ? 1 : .4 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Entrada ───────────────────────────────────────────────────────────
function EntradaModal({ prods, onClose, onSave }) {
  const [f, setF] = useState({ pid: "", qty: "", data: hoje(), obs: "" });
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const valid = f.pid && +f.qty > 0;
  const prod = prods.find(p => p.id === f.pid);
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mod">
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Entrada de Estoque</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <label className="lbl">Produto *</label>
            <select className="inp" value={f.pid} onChange={s("pid")}>
              <option value="">Selecione...</option>
              {prods.map(p => <option key={p.id} value={p.id}>{p.nome} — saldo atual: {p.estoque}</option>)}
            </select>
          </div>
          <div className="fr">
            <div className="fc"><label className="lbl">Quantidade *</label><input className="inp" type="number" min="1" value={f.qty} onChange={s("qty")} /></div>
            <div className="fc"><label className="lbl">Data</label><input className="inp" type="date" value={f.data} onChange={s("data")} /></div>
          </div>
          <div><label className="lbl">Fornecedor / Observação</label><input className="inp" value={f.obs} onChange={s("obs")} placeholder="Fornecedor, NF, compra..." /></div>
          {prod && +f.qty > 0 && (
            <div style={{ background: "#1a1d24", borderRadius: 8, padding: "10px 13px", fontSize: 13, color: "#94a3b8" }}>
              Saldo atual: <b style={{ color: "#f59e0b" }}>{prod.estoque}</b> → após entrada: <b style={{ color: "#22c55e" }}>{prod.estoque + (+f.qty)}</b>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn prim" disabled={!valid} onClick={() => onSave({ ...f, qty: +f.qty })} style={{ opacity: valid ? 1 : .4 }}>Confirmar Entrada</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Cliente ───────────────────────────────────────────────────────────
function CliModal({ onClose, onSave }) {
  const [f, setF] = useState({ nome: "", tel: "", email: "", cpf: "", end: "" });
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mod">
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Novo Cliente</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div><label className="lbl">Nome *</label><input className="inp" value={f.nome} onChange={s("nome")} placeholder="Nome completo" /></div>
          <div className="fr">
            <div className="fc"><label className="lbl">Telefone</label><input className="inp" value={f.tel} onChange={s("tel")} placeholder="31 9xxxx-xxxx" /></div>
            <div className="fc"><label className="lbl">CPF</label><input className="inp" value={f.cpf} onChange={s("cpf")} placeholder="000.000.000-00" /></div>
          </div>
          <div><label className="lbl">E-mail</label><input className="inp" type="email" value={f.email} onChange={s("email")} /></div>
          <div><label className="lbl">Endereço</label><input className="inp" value={f.end} onChange={s("end")} placeholder="Rua, número, bairro..." /></div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn prim" disabled={!f.nome} onClick={() => onSave(f)} style={{ opacity: f.nome ? 1 : .4 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Nova Venda ────────────────────────────────────────────────────────
function VendaModal({ prods, clis, onClose, onSave }) {
  const [f, setF]       = useState({ cliId: "", data: hoje(), pg: "dinheiro", nLoja: 2, nCard: 1, itens: [] });
  const [item, setItem] = useState({ pid: "", qty: "1", preco: "" });
  const sf = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const pmap = Object.fromEntries(prods.map(p => [p.id, p]));

  const selProd = pid => {
    const p = prods.find(x => x.id === pid);
    setItem(a => ({ ...a, pid, preco: p ? String(p.preco) : "" }));
  };

  const addItem = () => {
    if (!item.pid || !+item.qty || !+item.preco) return;
    const prod = pmap[item.pid];
    if (!prod || prod.estoque < +item.qty) return alert(`Estoque insuficiente para "${prod?.nome}" (disponível: ${prod?.estoque})`);
    setF(p => {
      const ex = p.itens.find(i => i.pid === item.pid);
      const itens = ex
        ? p.itens.map(i => i.pid === item.pid ? { ...i, qty: i.qty + +item.qty } : i)
        : [...p.itens, { pid: item.pid, qty: +item.qty, preco: +item.preco }];
      return { ...p, itens };
    });
    setItem({ pid: "", qty: "1", preco: "" });
  };

  const remItem = pid => setF(p => ({ ...p, itens: p.itens.filter(i => i.pid !== pid) }));
  const total   = f.itens.reduce((a, i) => a + i.qty * i.preco, 0);
  const valid   = f.cliId && f.itens.length > 0 && total > 0;

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mod" style={{ maxWidth: 560 }}>
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Nova Venda</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Cliente + Data */}
          <div className="fr">
            <div className="fc">
              <label className="lbl">Cliente *</label>
              <select className="inp" value={f.cliId} onChange={sf("cliId")}>
                <option value="">Selecione...</option>
                {clis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="fc">
              <label className="lbl">Data</label>
              <input className="inp" type="date" value={f.data} onChange={sf("data")} />
            </div>
          </div>

          {/* Itens */}
          <div>
            <label className="lbl">Itens da Venda *</label>
            <div style={{ background: "#1a1d24", borderRadius: 10, padding: 14 }}>
              {/* Linha de adição */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <select className="inp" style={{ flex: 2, minWidth: 130 }} value={item.pid} onChange={e => selProd(e.target.value)}>
                  <option value="">Produto...</option>
                  {prods.filter(p => p.estoque > 0).map(p => <option key={p.id} value={p.id}>{p.nome} (est:{p.estoque})</option>)}
                </select>
                <input className="inp" type="number" min="1" style={{ width: 65 }} placeholder="Qtd" value={item.qty} onChange={e => setItem(a => ({ ...a, qty: e.target.value }))} />
                <input className="inp" type="number" min="0" style={{ width: 95 }} placeholder="R$" value={item.preco} onChange={e => setItem(a => ({ ...a, preco: e.target.value }))} />
                <button className="btn prim" style={{ padding: "8px 14px", whiteSpace: "nowrap" }} onClick={addItem}>+ Add</button>
              </div>
              {/* Lista de itens */}
              {f.itens.length === 0
                ? <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "8px 0" }}>Nenhum item adicionado</p>
                : f.itens.map(i => {
                    const prod = pmap[i.pid];
                    return (
                      <div key={i.pid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0f14", borderRadius: 7, padding: "8px 12px", marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>{prod?.nome} × {i.qty}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: "#6366f1", fontWeight: 600 }}>{R$(i.qty * i.preco)}</span>
                          <button onClick={() => remItem(i.pid)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Pagamento */}
          <div>
            <label className="lbl">Forma de Pagamento *</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(PG).map(([k, v]) => (
                <button key={k} className="btn" onClick={() => setF(p => ({ ...p, pg: k }))}
                  style={{ padding: "7px 14px", fontSize: 12, background: f.pg === k ? v.cor + "33" : "#1e2230", border: `1px solid ${f.pg === k ? v.cor : "#2d3244"}`, color: f.pg === k ? v.cor : "#94a3b8", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parcelas cartão */}
          {f.pg === "credito" && (
            <div>
              <label className="lbl">Parcelas no Cartão</label>
              <select className="inp" value={f.nCard} onChange={sf("nCard")}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}× {i > 0 && total ? `de ${R$(total / (i + 1))}` : "(à vista)"}</option>
                ))}
              </select>
            </div>
          )}

          {/* Parcelas loja */}
          {f.pg === "credito_loja" && (
            <div>
              <label className="lbl">Parcelas (Crédito Loja) — máx. 10×</label>
              <select className="inp" value={f.nLoja} onChange={sf("nLoja")}>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}× {i > 0 && total ? `de ${R$(total / (i + 1))}` : "(à vista)"}</option>
                ))}
              </select>
              <p style={{ color: "#f472b6", fontSize: 12, marginTop: 5 }}>1ª parcela vence 1 mês após a data da venda</p>
            </div>
          )}

          {/* Total */}
          {total > 0 && (
            <div style={{ background: "#1a1d24", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b" }}>Total da venda:</span>
              <span className="sy" style={{ fontWeight: 700, fontSize: 22, color: "#22c55e" }}>{R$(total)}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn prim" disabled={!valid} onClick={() => onSave({ ...f, nLoja: +f.nLoja, nCard: +f.nCard, total })} style={{ opacity: valid ? 1 : .4 }}>Registrar Venda</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Detalhe do Cliente ────────────────────────────────────────────────
function DetCliModal({ cli, vendas, pars, pmap, onClose, onPagar }) {
  const total   = vendas.reduce((a, v) => a + v.total, 0);
  const cPars   = pars.filter(p => vendas.some(v => v.id === p.vendaId));
  const pagoPars = cPars.reduce((a, p) => a + p.pago, 0);
  const pagoAv  = vendas.filter(v => v.pg !== "credito_loja").reduce((a, v) => a + v.total, 0);
  const pendente = cPars.reduce((a, p) => a + Math.max(0, p.valor - p.pago), 0);
  const vencidas = cPars.filter(p => stPar(p) === "vencido");

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mod" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div className="sy" style={{ fontWeight: 700, fontSize: 20 }}>{cli.nome}</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
              {cli.tel}{cli.email ? ` · ${cli.email}` : ""}{cli.cpf ? ` · CPF: ${cli.cpf}` : ""}
            </div>
            {cli.end && <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{cli.end}</div>}
          </div>
          {vencidas.length > 0 && (
            <span className="badge" style={{ background: "#7f1d1d22", color: "#f87171", fontSize: 13, padding: "4px 10px" }}>
              ⚠ {vencidas.length} em atraso
            </span>
          )}
        </div>

        {/* Alerta de inadimplência */}
        {vencidas.length > 0 && (
          <div style={{ background: "#7f1d1d22", border: "1px solid #7f1d1d55", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#f87171" }}>
            ⚠ Cliente possui <b>{vencidas.length}</b> parcela(s) vencida(s) totalizando <b>{R$(vencidas.reduce((a, p) => a + p.valor - p.pago, 0))}</b> em atraso.
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { l: "Comprado",  v: R$(total),              c: "#6366f1" },
            { l: "Pago",      v: R$(pagoPars + pagoAv),  c: "#22c55e" },
            { l: "Pendente",  v: R$(pendente),            c: "#f59e0b" },
          ].map(s => (
            <div key={s.l} style={{ background: "#1a1d24", borderRadius: 8, padding: 12 }}>
              <div className="sy" style={{ fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Compras */}
        <div className="sy" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Histórico de Compras</div>
        {vendas.length === 0
          ? <p style={{ color: "#64748b", fontSize: 13 }}>Nenhuma compra registrada</p>
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...vendas].reverse().map(v => {
                const vPars  = pars.filter(p => p.vendaId === v.id);
                const vPago  = vPars.reduce((a, p) => a + p.pago, 0);
                const pg     = PG[v.pg];
                const pct    = vPars.length ? Math.round((vPago / v.total) * 100) : 100;
                const atras  = vPars.filter(p => stPar(p) === "vencido");
                return (
                  <div key={v.id} style={{ background: "#1a1d24", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: "#94a3b8" }}>{dtBR(v.data)}</span>
                          <span className="badge" style={{ background: pg.cor + "22", color: pg.cor }}>{pg.label}</span>
                          {atras.length > 0 && <span className="badge" style={{ background: "#7f1d1d22", color: "#f87171" }}>Atraso</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                          {v.itens.map(i => `${pmap[i.pid]?.nome || "?"} (${i.qty})`).join(", ")}
                        </div>
                        {v.pg === "credito_loja" && (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 3 }}>
                              <span>{v.nLoja}× · {pct}% pago</span>
                            </div>
                            <div style={{ background: "#0d0f14", borderRadius: 3, height: 4 }}>
                              <div style={{ background: pct === 100 ? "#22c55e" : "#f472b6", width: `${pct}%`, height: "100%", borderRadius: 3 }} />
                            </div>
                            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                              {vPars.map(p => {
                                const st = stPar(p);
                                return <div key={p.id} title={`${p.num}ª · ${dtBR(p.vence)} · ${R$(p.valor)}`}
                                  style={{ width: 22, height: 22, borderRadius: 4, background: COR[st], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 600 }}>{p.num}</div>;
                              })}
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <span className="sy" style={{ fontWeight: 700, color: "#6366f1" }}>{R$(v.total)}</span>
                        {v.pg === "credito_loja" && pct < 100 && (
                          <button className="btn prim" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => onPagar(v.id)}>Pagar</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button className="btn ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Pagar Parcela ─────────────────────────────────────────────────────
function PagarModal({ venda, pars, onClose, onPay }) {
  const [sel, setSel]   = useState([]);
  const [vals, setVals] = useState({});
  const [data, setData] = useState(hoje());
  const [obs, setObs]   = useState("");

  const pendentes = pars.filter(p => stPar(p) !== "pago");

  const toggle = id => {
    const par = pars.find(p => p.id === id);
    if (!par) return;
    const saldo = +(par.valor - par.pago).toFixed(2);
    setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    setVals(p => ({ ...p, [id]: p[id] !== undefined ? undefined : saldo }));
  };
  const setVal = (id, v) => setVals(p => ({ ...p, [id]: v === "" ? "" : +v }));
  const total  = sel.reduce((a, id) => a + (+vals[id] || 0), 0);
  const valid  = sel.length > 0 && total > 0 && sel.every(id => {
    const v = +vals[id] || 0;
    const p = pars.find(x => x.id === id);
    return v > 0 && p && v <= (p.valor - p.pago) + 0.001;
  });

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mod" style={{ maxWidth: 500 }}>
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Registrar Pagamento</div>
        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 18 }}>
          {venda?.itens?.map((i, idx) => idx < 2 ? "" : "").join("") || "Crédito Loja"}
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#94a3b8" }}>Selecione as parcelas:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {pendentes.length === 0 && <p style={{ color: "#22c55e", fontSize: 13 }}>✓ Todas as parcelas estão pagas!</p>}
          {pendentes.map(p => {
            const st   = stPar(p);
            const sl   = +(p.valor - p.pago).toFixed(2);
            const isSel = sel.includes(p.id);
            return (
              <div key={p.id} onClick={() => toggle(p.id)}
                style={{ background: isSel ? "#1e2538" : "#1a1d24", border: `1px solid ${isSel ? "#6366f1" : "#2d3244"}`, borderRadius: 10, padding: "11px 13px", cursor: "pointer", transition: "all .15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${isSel ? "#6366f1" : "#2d3244"}`, background: isSel ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isSel && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>{p.num}ª Parcela</span>
                      <span className="badge" style={{ background: COR[st] + "22", color: COR[st] }}>{LBL[st]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Vence: {dtBR(p.vence)} · Saldo: <span style={{ color: "#f59e0b" }}>{R$(sl)}</span>
                      {p.pago > 0 && <span> · Já pago: {R$(p.pago)}</span>}
                    </div>
                  </div>
                </div>
                {isSel && (
                  <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8 }} onClick={e => e.stopPropagation()}>
                    <label className="lbl" style={{ margin: 0, whiteSpace: "nowrap" }}>Valor:</label>
                    <input className="inp" type="number" min="0.01" max={sl} step="0.01"
                      value={vals[p.id] ?? ""} onChange={e => setVal(p.id, e.target.value)}
                      placeholder={String(sl)} style={{ maxWidth: 130 }} />
                    <button className="btn ghost" style={{ padding: "5px 9px", fontSize: 11 }} onClick={() => setVal(p.id, sl)}>Total</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sel.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 18 }}>
            <div className="fr">
              <div className="fc"><label className="lbl">Data do Pagamento</label><input className="inp" type="date" value={data} onChange={e => setData(e.target.value)} /></div>
            </div>
            <div><label className="lbl">Observação</label><input className="inp" value={obs} onChange={e => setObs(e.target.value)} placeholder="Pix, dinheiro, referência..." /></div>
            <div style={{ background: "#1a1d24", borderRadius: 8, padding: "11px 13px", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#64748b" }}>Total a registrar:</span>
              <strong className="sy" style={{ color: "#22c55e" }}>{R$(total)}</strong>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn prim" disabled={!valid} onClick={() => { sel.forEach(id => { const v = +vals[id]; if (v > 0) onPay(id, v, data, obs); }); onClose(); }} style={{ opacity: valid ? 1 : .4 }}>Confirmar Pagamento</button>
        </div>
      </div>
    </div>
  );
}
