import { useState } from "react";

const COLORS = {
  "Produto":   { bg: "#312e81", color: "#a5b4fc" },
  "Cliente":   { bg: "#1e3a5f", color: "#7dd3fc" },
  "Venda":     { bg: "#14532d", color: "#86efac" },
  "Estoque":   { bg: "#78350f", color: "#fbbf24" },
  "Pagamento": { bg: "#4c1d95", color: "#c4b5fd" },
};

export default function Logs({ logs }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const sorted = [...logs].reverse();
  const filtrados = sorted.filter((l) => {
    if (filtro && l.cat !== filtro) return false;
    if (busca) {
      const b = busca.toLowerCase();
      return l.desc.toLowerCase().includes(b) || l.cat.toLowerCase().includes(b);
    }
    return true;
  });

  const cats = [...new Set(logs.map((l) => l.cat))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Logs</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{logs.length} registro(s)</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input className="inp" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ maxWidth: 280 }} />
        <select className="inp" value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Todas categorias</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Data/Hora</th><th>Categoria</th><th>Acao</th><th>Descricao</th></tr></thead>
          <tbody>
            {filtrados.map((l) => {
              const c = COLORS[l.cat] || { bg: "#334155", color: "#94a3b8" };
              return (
                <tr key={l.id}>
                  <td style={{ color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>{l.ts}</td>
                  <td><span className="badge" style={{ background: c.bg + "33", color: c.color }}>{l.cat}</span></td>
                  <td style={{ fontWeight: 500 }}>{l.acao}</td>
                  <td style={{ color: "#94a3b8" }}>{l.desc}</td>
                </tr>
              );
            })}
            {filtrados.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "#64748b", padding: 28 }}>Nenhum registro</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
