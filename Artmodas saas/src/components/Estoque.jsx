import { useState } from "react";
import { R$, dtBR } from "../utils";

export default function Estoque({ prods, movs, pmap, cmap, vmap, canEdit, onNovoProd, onEntrada, onEdit }) {
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState("todas");
  const [showMovs, setShowMovs] = useState(false);

  const cats = [...new Set(prods.map((p) => p.cat))];
  const filtrados = prods.filter(
    (p) => (p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.cod && p.cod.includes(busca))) && (cat === "todas" || p.cat === cat)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Estoque</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{prods.length} produto(s)</p>
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn ghost" onClick={onEntrada}>↑ Entrada</button>
            <button className="btn prim" onClick={onNovoProd}>+ Novo Produto</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input className="inp" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ maxWidth: 260 }} />
        <select className="inp" value={cat} onChange={(e) => setCat(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="todas">Todas categorias</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Codigo</th><th>Produto</th><th>Categoria</th><th>Custo</th><th>Preço Venda</th><th>Saldo</th><th>Mínimo</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtrados.map((p) => {
              const crit = p.estoque <= p.minimo;
              const zero = p.estoque === 0;
              return (
                <tr key={p.id}>
                  <td style={{ color: "#64748b", fontSize: 12 }}>{p.cod || "—"}</td>
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
                  <td>{canEdit && <button className="btn ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => onEdit(p)}>Editar</button>}</td>
                </tr>
              );
            })}
            {filtrados.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", color: "#64748b", padding: 28 }}>Nenhum produto</td></tr>}
          </tbody>
        </table>
      </div>

      <div>
        <button className="btn ghost" style={{ fontSize: 12, marginBottom: 12 }} onClick={() => setShowMovs(!showMovs)}>
          {showMovs ? "▲" : "▼"} Histórico de Movimentações ({movs.length})
        </button>
        {showMovs && (
          <div className="card">
            <table>
              <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Motivo / Cliente</th></tr></thead>
              <tbody>
                {[...movs].reverse().map((m) => {
                  const venda = m.vendaId ? vmap[m.vendaId] : null;
                  const cli = venda ? cmap[venda.cliId] : null;
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
