import { R$, dtBR, hoje } from "../utils";
import { stPar } from "../constants";

export default function Painel({ prods, clis, vendas, pars, cmap, setTab, onPagar }) {
  const estBaixo = prods.filter((p) => p.estoque <= p.minimo);
  const vencidas = pars.filter((p) => stPar(p) === "vencido");
  const totalVendido = vendas.reduce((a, v) => a + v.total, 0);
  const totalPars = pars.reduce((a, p) => a + p.pago, 0);
  const totalAvista = vendas.filter((v) => v.pg !== "credito_loja").reduce((a, v) => a + v.total, 0);
  const totalPendente = pars.reduce((a, p) => a + Math.max(0, p.valor - p.pago), 0);

  const inadiSet = new Set();
  vencidas.forEach((p) => {
    const v = vendas.find((x) => x.id === p.vendaId);
    if (v) inadiSet.add(v.cliId);
  });

  const proxVenc = pars
    .filter((p) => stPar(p) !== "pago" && p.vence >= hoje())
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
          { l: "Total Vendido",  v: R$(totalVendido),            cor: "#6366f1" },
          { l: "Total Recebido", v: R$(totalPars + totalAvista), cor: "#22c55e" },
          { l: "A Receber",      v: R$(totalPendente),           cor: "#f59e0b" },
          { l: "Inadimplentes",  v: inadiSet.size,               cor: "#ef4444" },
        ].map((s) => (
          <div key={s.l} className="card" style={{ padding: 18 }}>
            <div className="sy" style={{ fontSize: 26, fontWeight: 700, color: s.cor }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="sy" style={{ fontWeight: 700, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠ Estoque Crítico</span>
            <span style={{ background: "#78350f44", color: "#fbbf24", borderRadius: 20, padding: "1px 9px", fontSize: 12 }}>{estBaixo.length}</span>
          </div>
          {estBaixo.length === 0
            ? <p style={{ color: "#64748b", fontSize: 13 }}>Estoque OK ✓</p>
            : <table><thead><tr><th>Produto</th><th>Saldo</th><th>Mín</th></tr></thead>
                <tbody>{estBaixo.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td style={{ color: p.estoque === 0 ? "#ef4444" : "#f59e0b", fontWeight: 600 }}>{p.estoque}</td>
                    <td style={{ color: "#64748b" }}>{p.minimo}</td>
                  </tr>
                ))}</tbody></table>}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="sy" style={{ fontWeight: 700, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🔴 Parcelas Vencidas</span>
            <span style={{ background: "#7f1d1d44", color: "#f87171", borderRadius: 20, padding: "1px 9px", fontSize: 12 }}>{vencidas.length}</span>
          </div>
          {vencidas.length === 0
            ? <p style={{ color: "#64748b", fontSize: 13 }}>Nenhuma em atraso 🎉</p>
            : <table><thead><tr><th>Cliente</th><th>Venceu</th><th>Saldo</th></tr></thead>
                <tbody>{vencidas.slice(0, 5).map((p) => {
                  const v = vendas.find((x) => x.id === p.vendaId);
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

        <div className="card" style={{ padding: 18 }}>
          <div className="sy" style={{ fontWeight: 700, marginBottom: 12 }}>📅 Próximos Vencimentos</div>
          {proxVenc.length === 0
            ? <p style={{ color: "#64748b", fontSize: 13 }}>Nenhum</p>
            : <table><thead><tr><th>Cliente</th><th>Vence</th><th>Valor</th></tr></thead>
                <tbody>{proxVenc.map((p) => {
                  const v = vendas.find((x) => x.id === p.vendaId);
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
