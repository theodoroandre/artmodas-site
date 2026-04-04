import { useState } from "react";

export default function CliModal({ onClose, onSave }) {
  const [f, setF] = useState({ nome: "", tel: "", email: "", cpf: "", end: "" });
  const s = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mod">
        <div className="sy" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Novo Cliente</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div><label className="lbl">Nome *</label><input className="inp" value={f.nome} onChange={s("nome")} placeholder="Nome completo" /></div>
          <div className="fr">
            <div className="fc"><label className="lbl">Telefone</label><input className="inp" value={f.tel} onChange={s("tel")} placeholder="31 9xxxx-xxxx" /></div>
            <div className="fc"><label className="lbl">CPF</label><input className="inp" value={f.cpf} onChange={s("cpf")} placeholder="000.000.000-00" /></div>
          </div>
          <div><label className="lbl">E-mail</label><input className="inp" type="email" value={f.email} onChange={s("email")} /></div>
          <div><label className="lbl">Endereço</label><input className="inp" value={f.end} onChange={s("end")} placeholder="Rua, número, bairro..." /></div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn prim" disabled={!f.nome} onClick={() => onSave(f)} style={{ opacity: f.nome ? 1 : .4 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
