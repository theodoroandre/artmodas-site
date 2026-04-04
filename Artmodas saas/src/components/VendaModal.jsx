import { useState } from "react";
import { R$, hoje } from "../utils";
import { PG } from "../constants";

export default function VendaModal({ prods, clis, onClose, onSave }) {
  const [f, setF] = useState({ cliId: "", data: hoje(), pg: "dinheiro", nLoja: 2, nCard: 1, itens: [] });
  const [item, setItem] = useState({ pid: "", qty: "1", preco: "" });
  const sf = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const pmap = Object.fromEntries(prods.map((p) => [p.id, p]));

  const selProd = (pid) => {
    const p = prods.find((x) => x.id === pid);
    setItem((a) => ({ ...a, pid, preco: p ? String(p.preco) : "" }));
  };

  const addItem = () => {
    if (!item.pid || !+item.qty || !+item.preco) return;
    const prod = pmap[item.pid];
    if (!prod || prod.estoque < +item.qty) return alert(`Estoque insuficiente para "${prod?.nome}" (disponível: ${prod?.estoque})`);
    setF((p) => {
      const ex = p.itens.find((i) => i.pid === item.pid);
      const itens = ex
        ? p.itens.map((i) => i.pid === item.pid ? { ...i, qty: i.qty + +item.qty } : i)
        : [...p.itens, { pid: item.pid, qty: +item.qty, preco: +item.preco }];
      return { ...p, itens };
    });
    setItem({ pid: "", qty: "1", preco: "" });
  };

  const remItem = (pid) => setF((p) => ({ ...p, itens: p.itens.filter((i) => i.pid !== pid) }));
  const total = f.itens.reduce((a, i) => a + i.qty * i.preco, 0);
  const valid = f.cliId && f.itens.length > 0 && total > 0;

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mod" style={{ maxWidth: 560 }}>
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Nova Venda</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="fr">
            <div className="fc">
              <label className="lbl">Cliente *</label>
              <select className="inp" value={f.cliId} onChange={sf("cliId")}>
                <option value="">Selecione...</option>
                {clis.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="fc">
              <label className="lbl">Data</label>
              <input className="inp" type="date" value={f.data} onChange={sf("data")} />
            </div>
          </div>

          <div>
            <label className="lbl">Itens da Venda *</label>
            <div style={{ background: "#1a1d24", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <select className="inp" style={{ flex: 2, minWidth: 130 }} value={item.pid} onChange={(e) => selProd(e.target.value)}>
                  <option value="">Produto...</option>
                  {prods.filter((p) => p.estoque > 0).map((p) => <option key={p.id} value={p.id}>{p.nome} (est:{p.estoque})</option>)}
                </select>
                <input className="inp" type="number" min="1" style={{ width: 65 }} placeholder="Qtd" value={item.qty} onChange={(e) => setItem((a) => ({ ...a, qty: e.target.value }))} />
                <input className="inp" type="number" min="0" style={{ width: 95 }} placeholder="R$" value={item.preco} onChange={(e) => setItem((a) => ({ ...a, preco: e.target.value }))} />
                <button className="btn prim" style={{ padding: "8px 14px", whiteSpace: "nowrap" }} onClick={addItem}>+ Add</button>
              </div>
              {f.itens.length === 0
                ? <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "8px 0" }}>Nenhum item adicionado</p>
                : f.itens.map((i) => {
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

          <div>
            <label className="lbl">Forma de Pagamento *</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(PG).map(([k, v]) => (
                <button key={k} className="btn" onClick={() => setF((p) => ({ ...p, pg: k }))}
                  style={{ padding: "7px 14px", fontSize: 12, background: f.pg === k ? v.cor + "33" : "#1e2230", border: `1px solid ${f.pg === k ? v.cor : "#2d3244"}`, color: f.pg === k ? v.cor : "#94a3b8", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

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
