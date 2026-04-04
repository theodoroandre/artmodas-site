import { useState, useMemo } from "react";
import { uid, hoje } from "./utils";
import { mkPar, PROD0, CLI0, VENDAS0, PAR0, MOV0 } from "./seed";
import { useGoogleSheet, useSheetLoader } from "./useGoogleSheets";
import "./index.css";

// Paste your Google Apps Script web app URL here:
const SCRIPT_URL = localStorage.getItem("lc_script_url") || "";

import Painel from "./components/Painel";
import Estoque from "./components/Estoque";
import Vendas from "./components/Vendas";
import Clientes from "./components/Clientes";
import Cobrancas from "./components/Cobrancas";
import ProdModal from "./components/ProdModal";
import EntradaModal from "./components/EntradaModal";
import CliModal from "./components/CliModal";
import VendaModal from "./components/VendaModal";
import DetCliModal from "./components/DetCliModal";
import PagarModal from "./components/PagarModal";

const TABS = [
  { id: "painel",    l: "Painel" },
  { id: "estoque",   l: "Estoque" },
  { id: "vendas",    l: "Vendas" },
  { id: "clientes",  l: "Clientes" },
  { id: "cobrancas", l: "Cobranças" },
];

export default function App() {
  const [tab, setTab]       = useState("painel");
  const [prods, setProds, savingProds]   = useGoogleSheet("lc_prods", PROD0, SCRIPT_URL);
  const [clis, setClis, savingClis]      = useGoogleSheet("lc_clis", CLI0, SCRIPT_URL);
  const [vendas, setVendas, savingVendas]= useGoogleSheet("lc_vendas", VENDAS0, SCRIPT_URL);
  const [pars, setPars, savingPars]      = useGoogleSheet("lc_pars", PAR0, SCRIPT_URL);
  const [movs, setMovs, savingMovs]     = useGoogleSheet("lc_movs", MOV0, SCRIPT_URL);
  const [modal, setModal]   = useState(null);
  const [showConfig, setShowConfig] = useState(!SCRIPT_URL);
  const [urlInput, setUrlInput] = useState(SCRIPT_URL);
  const close = () => setModal(null);

  const isSaving = savingProds || savingClis || savingVendas || savingPars || savingMovs;

  const setters = useMemo(() => ({ setProds, setClis, setVendas, setPars, setMovs }), []);
  const { loaded, error, refresh } = useSheetLoader(SCRIPT_URL, setters);

  const saveUrl = () => {
    localStorage.setItem("lc_script_url", urlInput.trim());
    window.location.reload();
  };

  const pmap = Object.fromEntries(prods.map((p) => [p.id, p]));
  const cmap = Object.fromEntries(clis.map((c) => [c.id, c]));
  const vmap = Object.fromEntries(vendas.map((v) => [v.id, v]));

  const addProd  = (p) => setProds((x) => [...x, { ...p, id: uid() }]);
  const editProd = (p) => setProds((x) => x.map((q) => q.id === p.id ? p : q));

  const entrada = ({ pid, qty, data, obs }) => {
    setProds((x) => x.map((p) => p.id === pid ? { ...p, estoque: p.estoque + qty } : p));
    setMovs((x) => [...x, { id: uid(), pid, tipo: "entrada", qty, data, motivo: obs || "Entrada de estoque" }]);
  };

  const addVenda = (v) => {
    const nv = { ...v, id: uid() };
    setVendas((x) => [...x, nv]);
    nv.itens.forEach((it) => {
      setProds((x) => x.map((p) => p.id === it.pid ? { ...p, estoque: Math.max(0, p.estoque - it.qty) } : p));
      setMovs((x) => [...x, { id: uid(), pid: it.pid, tipo: "saida", qty: it.qty, data: nv.data, motivo: "Venda", vendaId: nv.id }]);
    });
    if (nv.pg === "credito_loja") setPars((x) => [...x, ...mkPar(nv)]);
  };

  const pagarPar = (id, val, data, obs) => {
    setPars((x) => x.map((p) => {
      if (p.id !== id) return p;
      const np = Math.min(p.valor, +(p.pago + val).toFixed(2));
      return { ...p, pago: np, pagamentos: [...p.pagamentos, { id: uid(), val, data, obs }] };
    }));
  };

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0d0f14", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Nav */}
      <div style={{ background: "#0d0f14", borderBottom: "1px solid #1e2230", padding: "0 22px", display: "flex", alignItems: "center", gap: 18, position: "sticky", top: 0, zIndex: 50 }}>
        <div className="sy" style={{ fontWeight: 800, fontSize: 17, color: "#6366f1", padding: "15px 0", letterSpacing: "-.02em", cursor: "pointer" }} onClick={() => setShowConfig(true)}>
          LOJA<span style={{ color: "#e2e8f0" }}>CTRL</span>
          {SCRIPT_URL && (
            <span style={{ fontSize: 9, marginLeft: 6, color: isSaving ? "#f59e0b" : "#22c55e", verticalAlign: "middle" }}>
              {isSaving ? "salvando..." : "sync"}
            </span>
          )}
        </div>
        <nav style={{ display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="btn"
              style={{ padding: "5px 13px", borderRadius: 7, fontSize: 13, background: tab === t.id ? "#1e2230" : "transparent", color: tab === t.id ? "#e2e8f0" : "#64748b", border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {t.l}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "painel"    && <Painel prods={prods} clis={clis} vendas={vendas} pars={pars} cmap={cmap} setTab={setTab} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
        {tab === "estoque"   && <Estoque prods={prods} movs={movs} pmap={pmap} cmap={cmap} vmap={vmap} onNovoProd={() => setModal({ type: "prod" })} onEntrada={() => setModal({ type: "entrada" })} onEdit={(p) => setModal({ type: "prod", prod: p })} />}
        {tab === "vendas"    && <Vendas vendas={vendas} cmap={cmap} pmap={pmap} pars={pars} onNova={() => setModal({ type: "venda" })} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
        {tab === "clientes"  && <Clientes clis={clis} vendas={vendas} pars={pars} pmap={pmap} onNovo={() => setModal({ type: "cli" })} onDetalhe={(c) => setModal({ type: "detCli", cli: c })} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
        {tab === "cobrancas" && <Cobrancas pars={pars} vendas={vendas} cmap={cmap} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
      </div>

      {/* Modals */}
      {modal?.type === "prod"    && <ProdModal    prod={modal.prod} onClose={close} onSave={(p) => { modal.prod ? editProd(p) : addProd(p); close(); }} />}
      {modal?.type === "entrada" && <EntradaModal prods={prods} onClose={close} onSave={(e) => { entrada(e); close(); }} />}
      {modal?.type === "cli"     && <CliModal     onClose={close} onSave={(c) => { setClis((x) => [...x, { ...c, id: uid(), cad: hoje() }]); close(); }} />}
      {modal?.type === "venda"   && <VendaModal   prods={prods} clis={clis} onClose={close} onSave={(v) => { addVenda(v); close(); }} />}
      {modal?.type === "detCli"  && <DetCliModal  cli={modal.cli} vendas={vendas.filter((v) => v.cliId === modal.cli.id)} pars={pars} pmap={pmap} onClose={close} onPagar={(vid) => { close(); setModal({ type: "pagar", vid }); }} />}
      {modal?.type === "pagar"   && <PagarModal   venda={vmap[modal.vid]} pars={pars.filter((p) => p.vendaId === modal.vid)} onClose={close} onPay={pagarPar} />}

      {/* Loading overlay */}
      {!loaded && SCRIPT_URL && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,15,20,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ textAlign: "center", color: "#e2e8f0" }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Carregando dados...</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Conectando ao Google Sheets</div>
          </div>
        </div>
      )}

      {/* Config modal */}
      {showConfig && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => SCRIPT_URL && setShowConfig(false)}>
          <div style={{ background: "#1e2230", borderRadius: 12, padding: 28, width: 420, maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 6px", color: "#e2e8f0", fontSize: 16 }}>Configurar Google Sheets</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              Cole a URL do seu Google Apps Script para sincronizar dados na nuvem.
            </p>
            <input
              value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0d0f14", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
            />
            {error && <div style={{ marginTop: 8, color: "#ef4444", fontSize: 12 }}>Erro: {error}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              {SCRIPT_URL && (
                <button onClick={() => setShowConfig(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancelar
                </button>
              )}
              <button onClick={saveUrl} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                Salvar e Conectar
              </button>
              {SCRIPT_URL && (
                <button onClick={() => { localStorage.removeItem("lc_script_url"); window.location.reload(); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                  Desconectar
                </button>
              )}
            </div>
            {!SCRIPT_URL && (
              <p style={{ margin: "16px 0 0", color: "#64748b", fontSize: 11, lineHeight: 1.5 }}>
                Sem URL configurada o app funciona normalmente com dados locais no navegador.
                <button onClick={() => setShowConfig(false)} style={{ marginLeft: 6, background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontFamily: "inherit", fontSize: 11, textDecoration: "underline" }}>
                  Continuar offline
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      <footer style={{ position: "fixed", bottom: 0, right: 0, padding: "8px 16px", fontSize: 12, color: "#888" }}>
        © {new Date().getFullYear()} All rights reserved — Andre Theodoro
      </footer>
    </div>
  );
}
