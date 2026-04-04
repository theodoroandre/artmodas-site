import { useState } from "react";

export default function ProdModal({ prod, onClose, onSave }) {
  const [f, setF] = useState(prod || { nome: "", cat: "", custo: "", preco: "", estoque: "0", minimo: "2" });
  const s = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const valid = f.nome && +f.preco > 0;
  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mod">
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{prod ? "Editar" : "Novo"} Produto</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div><label className="lbl">Nome *</label><input className="inp" value={f.nome} onChange={s("nome")} placeholder="Ex: Blusa Floral M" /></div>
          <div><label className="lbl">Categoria</label><input className="inp" value={f.cat} onChange={s("cat")} placeholder="Ex: Blusas" /></div>
          <div className="fr">
            <div className="fc"><label className="lbl">Custo (R$)</label><input className="inp" type="number" min="0" value={f.custo} onChange={s("custo")} /></div>
            <div className="fc"><label className="lbl">Preço Venda *</label><input className="inp" type="number" min="0" value={f.preco} onChange={s("preco")} /></div>
          </div>
          <div className="fr">
            <div className="fc"><label className="lbl">Estoque Inicial</label><input className="inp" type="number" min="0" value={f.estoque} onChange={s("estoque")} /></div>
            <div className="fc"><label className="lbl">Estoque Mínimo</label><input className="inp" type="number" min="0" value={f.minimo} onChange={s("minimo")} /></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn prim" disabled={!valid} onClick={() => onSave({ ...f, custo: +f.custo, preco: +f.preco, estoque: +f.estoque || 0, minimo: +f.minimo || 0 })} style={{ opacity: valid ? 1 : .4 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
