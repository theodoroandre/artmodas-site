import { useState } from "react";
import { R$ } from "../utils";
import { stPar } from "../constants";

export default function Clientes({ clis, vendas, pars, pmap, onNovo, onEdit, onDetalhe, onPagar }) {
  const [busca, setBusca] = useState("");
  const filtrados = clis.filter(
    (c) => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.tel.includes(busca)
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
      <input className="inp" placeholder="Buscar por nome ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ maxWidth: 340 }} />
      <div className="card">
        <table>
          <thead><tr><th>Nome</th><th>Telefone</th><th>Compras</th><th>Saldo Aberto</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtrados.map((c) => {
              const cVendas = vendas.filter((v) => v.cliId === c.id);
              const cPars = pars.filter((p) => cVendas.some((v) => v.id === p.vendaId));
              const pendente = cPars.reduce((a, p) => a + Math.max(0, p.valor - p.pago), 0);
              const atras = cPars.filter((p) => stPar(p) === "vencido");
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
                  <td style={{ display: "flex", gap: 4 }}>
                    <button className="btn ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => onEdit(c)}>Editar</button>
                    <button className="btn ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => onDetalhe(c)}>Detalhes</button>
                  </td>
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
