import { useState } from "react";
import { R$, dtBR } from "../utils";
import { PG, stPar, COR, LBL } from "../constants";

export default function Vendas({ vendas, cmap, pmap, pars, canEdit, onNova, onPagar, onExcluir }) {
  const [busca, setBusca] = useState("");
  const filtradas = vendas.filter((v) => {
    const c = cmap[v.cliId];
    return c?.nome.toLowerCase().includes(busca.toLowerCase()) ||
      v.itens.some((i) => pmap[i.pid]?.nome.toLowerCase().includes(busca.toLowerCase()));
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Vendas</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{vendas.length} venda(s)</p>
        </div>
        {canEdit && <button className="btn prim" onClick={onNova}>+ Nova Venda</button>}
      </div>
      <input className="inp" placeholder="Buscar por cliente ou produto..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ maxWidth: 340 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtradas.length === 0 && <div className="card" style={{ padding: 32, textAlign: "center", color: "#64748b" }}>Nenhuma venda</div>}
        {[...filtradas].reverse().map((v) => {
          const cli = cmap[v.cliId];
          const pg = PG[v.pg];
          const vPars = pars.filter((p) => p.vendaId === v.id);
          const pago = vPars.reduce((a, p) => a + p.pago, 0);
          const pct = vPars.length ? Math.round((pago / v.total) * 100) : 100;
          const atras = vPars.filter((p) => stPar(p) === "vencido").length;
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
                    {dtBR(v.data)} · {v.itens.map((i) => `${pmap[i.pid]?.nome || "?"} (${i.qty})`).join(", ")}
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
                        {vPars.map((p) => {
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
                  {canEdit && v.pg === "credito_loja" && pct < 100 && (
                    <button className="btn prim" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => onPagar(v.id)}>Registrar Pag.</button>
                  )}
                  {canEdit && (
                    <button className="btn ghost" style={{ padding: "6px 12px", fontSize: 12, color: "#ef4444", borderColor: "#ef444444" }}
                      onClick={() => { if (confirm("Excluir esta venda? O estoque será estornado.")) onExcluir(v.id); }}>
                      Excluir
                    </button>
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
