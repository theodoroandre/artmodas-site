import { useState } from "react";
import { hoje } from "../utils";
import SearchSelect from "./SearchSelect";

export default function EntradaModal({ prods, onClose, onSave }) {
  const [f, setF] = useState({ pid: "", qty: "", data: hoje(), obs: "" });
  const s = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const valid = f.pid && +f.qty > 0;
  const prod = prods.find((p) => p.id === f.pid);
  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mod">
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Entrada de Estoque</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <label className="lbl">Produto *</label>
            <SearchSelect
              placeholder="Buscar produto..."
              value={f.pid}
              onChange={(v) => setF((p) => ({ ...p, pid: v }))}
              options={prods.map((p) => ({ value: p.id, label: p.nome, sub: `saldo: ${p.estoque}` }))}
            />
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
