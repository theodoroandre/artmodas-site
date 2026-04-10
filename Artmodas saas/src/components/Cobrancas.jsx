import { useState } from "react";
import { R$, dtBR } from "../utils";
import { stPar, COR, LBL } from "../constants";

export default function Cobrancas({ pars, vendas, cmap, canEdit, onPagar }) {
  const [filtro, setFiltro] = useState("todos");
  const vmap = Object.fromEntries(vendas.map((v) => [v.id, v]));

  const filtradas = pars
    .filter((p) => filtro === "todos" || stPar(p) === filtro)
    .sort((a, b) => a.vence.localeCompare(b.vence));

  const counts = { todos: pars.length };
  pars.forEach((p) => { const s = stPar(p); counts[s] = (counts[s] || 0) + 1; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Cobranças</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["todos", "vencido", "aberto", "parcial", "pago"].map((f) => (
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
            {filtradas.map((p) => {
              const v = vmap[p.vendaId];
              const c = cmap[v?.cliId];
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
                  <td>{canEdit && st !== "pago" && <button className="btn ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => onPagar(p.vendaId)}>Pagar</button>}</td>
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
