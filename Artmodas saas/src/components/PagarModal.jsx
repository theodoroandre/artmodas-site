import { useState } from "react";
import { R$, dtBR, hoje } from "../utils";
import { stPar, COR, LBL } from "../constants";

export default function PagarModal({ venda, pars, onClose, onPay }) {
  const [sel, setSel] = useState([]);
  const [vals, setVals] = useState({});
  const [data, setData] = useState(hoje());
  const [obs, setObs] = useState("");

  const pendentes = pars.filter((p) => stPar(p) !== "pago");

  const toggle = (id) => {
    const par = pars.find((p) => p.id === id);
    if (!par) return;
    const saldo = +(par.valor - par.pago).toFixed(2);
    setSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    setVals((p) => ({ ...p, [id]: p[id] !== undefined ? undefined : saldo }));
  };
  const setVal = (id, v) => setVals((p) => ({ ...p, [id]: v === "" ? "" : +v }));
  const total = sel.reduce((a, id) => a + (+vals[id] || 0), 0);
  const valid = sel.length > 0 && total > 0 && sel.every((id) => {
    const v = +vals[id] || 0;
    const p = pars.find((x) => x.id === id);
    return v > 0 && p && v <= (p.valor - p.pago) + 0.001;
  });

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mod" style={{ maxWidth: 500 }}>
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Registrar Pagamento</div>
        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 18 }}>Crédito Loja</div>

        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#94a3b8" }}>Selecione as parcelas:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {pendentes.length === 0 && <p style={{ color: "#22c55e", fontSize: 13 }}>✓ Todas as parcelas estão pagas!</p>}
          {pendentes.map((p) => {
            const st = stPar(p);
            const sl = +(p.valor - p.pago).toFixed(2);
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
                  <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <label className="lbl" style={{ margin: 0, whiteSpace: "nowrap" }}>Valor:</label>
                    <input className="inp" type="number" min="0.01" max={sl} step="0.01"
                      value={vals[p.id] ?? ""} onChange={(e) => setVal(p.id, e.target.value)}
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
              <div className="fc"><label className="lbl">Data do Pagamento</label><input className="inp" type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
            </div>
            <div><label className="lbl">Observação</label><input className="inp" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Pix, dinheiro, referência..." /></div>
            <div style={{ background: "#1a1d24", borderRadius: 8, padding: "11px 13px", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#64748b" }}>Total a registrar:</span>
              <strong className="sy" style={{ color: "#22c55e" }}>{R$(total)}</strong>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn prim" disabled={!valid} onClick={() => { sel.forEach((id) => { const v = +vals[id]; if (v > 0) onPay(id, v, data, obs); }); onClose(); }} style={{ opacity: valid ? 1 : .4 }}>Confirmar Pagamento</button>
        </div>
      </div>
    </div>
  );
}
