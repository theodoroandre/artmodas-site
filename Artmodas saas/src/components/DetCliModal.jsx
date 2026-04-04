import { R$, dtBR } from "../utils";
import { PG, stPar, COR } from "../constants";

export default function DetCliModal({ cli, vendas, pars, pmap, onClose, onPagar }) {
  const total = vendas.reduce((a, v) => a + v.total, 0);
  const cPars = pars.filter((p) => vendas.some((v) => v.id === p.vendaId));
  const pagoPars = cPars.reduce((a, p) => a + p.pago, 0);
  const pagoAv = vendas.filter((v) => v.pg !== "credito_loja").reduce((a, v) => a + v.total, 0);
  const pendente = cPars.reduce((a, p) => a + Math.max(0, p.valor - p.pago), 0);
  const vencidas = cPars.filter((p) => stPar(p) === "vencido");

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mod" style={{ maxWidth: 560 }}>
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

        {vencidas.length > 0 && (
          <div style={{ background: "#7f1d1d22", border: "1px solid #7f1d1d55", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#f87171" }}>
            ⚠ Cliente possui <b>{vencidas.length}</b> parcela(s) vencida(s) totalizando <b>{R$(vencidas.reduce((a, p) => a + p.valor - p.pago, 0))}</b> em atraso.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { l: "Comprado", v: R$(total),             c: "#6366f1" },
            { l: "Pago",     v: R$(pagoPars + pagoAv), c: "#22c55e" },
            { l: "Pendente", v: R$(pendente),           c: "#f59e0b" },
          ].map((s) => (
            <div key={s.l} style={{ background: "#1a1d24", borderRadius: 8, padding: 12 }}>
              <div className="sy" style={{ fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div className="sy" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Histórico de Compras</div>
        {vendas.length === 0
          ? <p style={{ color: "#64748b", fontSize: 13 }}>Nenhuma compra registrada</p>
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...vendas].reverse().map((v) => {
                const vPars = pars.filter((p) => p.vendaId === v.id);
                const vPago = vPars.reduce((a, p) => a + p.pago, 0);
                const pg = PG[v.pg];
                const pct = vPars.length ? Math.round((vPago / v.total) * 100) : 100;
                const atras = vPars.filter((p) => stPar(p) === "vencido");
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
                          {v.itens.map((i) => `${pmap[i.pid]?.nome || "?"} (${i.qty})`).join(", ")}
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
                              {vPars.map((p) => {
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
