import { useState, useMemo } from "react";
import { uid, hoje } from "./utils";
import { mkPar, PROD0, CLI0, VENDAS0, PAR0, MOV0 } from "./seed";
import { useGoogleSheet, useSheetLoader } from "./useGoogleSheets";
import "./index.css";

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

function LoginScreen() {
  const [url, setUrl] = useState(localStorage.getItem("lc_script_url") || "");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = () => {
    const trimUrl = url.trim();
    const trimPwd = pwd.trim();
    if (!trimUrl || !trimPwd) { setError("Preencha todos os campos."); return; }
    setLoading(true);
    setError(null);
    fetch(trimUrl + "?action=readAll&pwd=" + encodeURIComponent(trimPwd))
      .then((r) => r.json())
      .then((r) => {
        if (!r.ok) {
          setError(r.error === "auth" ? "Senha incorreta." : r.error);
          setLoading(false);
          return;
        }
        localStorage.setItem("lc_script_url", trimUrl);
        localStorage.setItem("lc_script_pwd", trimPwd);
        window.location.reload();
      })
      .catch(() => {
        setError("Não foi possível conectar. Verifique a URL.");
        setLoading(false);
      });
  };

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0d0f14", minHeight: "100vh", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1e2230", borderRadius: 12, padding: 32, width: 400, maxWidth: "90vw" }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: "#6366f1", marginBottom: 4, letterSpacing: "-.02em" }}>
          LOJA<span style={{ color: "#e2e8f0" }}>CTRL</span>
        </div>
        <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>
          Entre com suas credenciais para acessar o sistema.
        </p>
        <input
          value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="URL do Google Apps Script"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0d0f14", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <input
          type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
          placeholder="Senha"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0d0f14", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", marginTop: 8 }}
        />
        {error && <div style={{ marginTop: 8, color: "#ef4444", fontSize: 12 }}>{error}</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", marginTop: 16, padding: "10px 0", borderRadius: 8, border: "none", background: loading ? "#4b5563" : "#6366f1", color: "#fff", cursor: loading ? "default" : "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14 }}>
          {loading ? "Conectando..." : "Entrar"}
        </button>
        <footer style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "#555" }}>
          © {new Date().getFullYear()} All rights reserved — Andre Theodoro
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const scriptUrl = localStorage.getItem("lc_script_url") || "";
  const scriptPwd = localStorage.getItem("lc_script_pwd") || "";

  // Must be authenticated to use the app
  if (!scriptUrl || !scriptPwd) return <LoginScreen />;

  return <MainApp scriptUrl={scriptUrl} />;
}

function MainApp({ scriptUrl }) {
  const [tab, setTab]       = useState("painel");
  const [menuOpen, setMenuOpen] = useState(false);
  const [prods, setProds, savingProds]   = useGoogleSheet("lc_prods", PROD0, scriptUrl);
  const [clis, setClis, savingClis]      = useGoogleSheet("lc_clis", CLI0, scriptUrl);
  const [vendas, setVendas, savingVendas]= useGoogleSheet("lc_vendas", VENDAS0, scriptUrl);
  const [pars, setPars, savingPars]      = useGoogleSheet("lc_pars", PAR0, scriptUrl);
  const [movs, setMovs, savingMovs]     = useGoogleSheet("lc_movs", MOV0, scriptUrl);
  const [modal, setModal]   = useState(null);
  const close = () => setModal(null);

  const isSaving = savingProds || savingClis || savingVendas || savingPars || savingMovs;

  const setters = useMemo(() => ({ setProds, setClis, setVendas, setPars, setMovs }), []);
  const { loaded, error } = useSheetLoader(scriptUrl, setters);

  const logout = () => {
    localStorage.removeItem("lc_script_url");
    localStorage.removeItem("lc_script_pwd");
    // Clear cached data
    ["lc_prods", "lc_clis", "lc_vendas", "lc_pars", "lc_movs"].forEach((k) => localStorage.removeItem(k));
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

  const delVenda = (vid) => {
    const v = vmap[vid];
    if (!v) return;
    setVendas((x) => x.filter((vn) => vn.id !== vid));
    setPars((x) => x.filter((p) => p.vendaId !== vid));
    v.itens.forEach((it) => {
      setProds((x) => x.map((p) => p.id === it.pid ? { ...p, estoque: p.estoque + it.qty } : p));
      setMovs((x) => [...x, { id: uid(), pid: it.pid, tipo: "entrada", qty: it.qty, data: hoje(), motivo: "Estorno venda", vendaId: vid }]);
    });
  };

  const pagarPar = (id, val, data, obs) => {
    setPars((x) => x.map((p) => {
      if (p.id !== id) return p;
      const np = Math.min(p.valor, +(p.pago + val).toFixed(2));
      return { ...p, pago: np, pagamentos: [...p.pagamentos, { id: uid(), val, data, obs }] };
    }));
  };

  // Auth error — kick back to login
  if (loaded && error === "Senha incorreta") {
    logout();
    return null;
  }

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0d0f14", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Nav */}
      <div className="topbar" style={{ background: "#0d0f14", borderBottom: "1px solid #1e2230", padding: "0 22px", display: "flex", alignItems: "center", gap: 18, position: "sticky", top: 0, zIndex: 50 }}>
        <button className="hamburger" onClick={() => setMenuOpen(true)}
          style={{ display: "none", background: "none", border: "none", color: "#e2e8f0", fontSize: 22, cursor: "pointer", padding: "6px 4px", lineHeight: 1 }}>
          ☰
        </button>
        <div className="sy" style={{ fontWeight: 800, fontSize: 17, color: "#6366f1", padding: "15px 0", letterSpacing: "-.02em" }}>
          LOJA<span style={{ color: "#e2e8f0" }}>CTRL</span>
          <span style={{ fontSize: 9, marginLeft: 6, color: isSaving ? "#f59e0b" : "#22c55e", verticalAlign: "middle" }}>
            {isSaving ? "salvando..." : "sync"}
          </span>
        </div>
        <nav className="nav-desktop" style={{ display: "flex", gap: 2, overflowX: "auto", flex: 1 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="btn"
              style={{ padding: "5px 13px", borderRadius: 7, fontSize: 13, background: tab === t.id ? "#1e2230" : "transparent", color: tab === t.id ? "#e2e8f0" : "#64748b", border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {t.l}
            </button>
          ))}
        </nav>
        <button className="btn-sair-desktop" onClick={logout} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, background: "transparent", color: "#64748b", border: "1px solid #334155", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          Sair
        </button>
      </div>

      {/* Side panel (mobile) */}
      {menuOpen && <div className="side-overlay" onClick={() => setMenuOpen(false)} />}
      <div className={`side-panel ${menuOpen ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div className="sy" style={{ fontWeight: 800, fontSize: 17, color: "#6366f1", letterSpacing: "-.02em" }}>
            LOJA<span style={{ color: "#e2e8f0" }}>CTRL</span>
          </div>
          <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }} className="btn"
              style={{ padding: "10px 14px", borderRadius: 8, fontSize: 14, textAlign: "left", background: tab === t.id ? "#1e2230" : "transparent", color: tab === t.id ? "#e2e8f0" : "#94a3b8", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {t.l}
            </button>
          ))}
        </nav>
        <button onClick={() => { setMenuOpen(false); logout(); }}
          style={{ marginTop: 24, padding: "10px 14px", borderRadius: 8, fontSize: 13, width: "100%", textAlign: "left", background: "transparent", color: "#ef4444", border: "1px solid #7f1d1d44", cursor: "pointer", fontFamily: "inherit" }}>
          Sair
        </button>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "painel"    && <Painel prods={prods} clis={clis} vendas={vendas} pars={pars} cmap={cmap} setTab={setTab} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
        {tab === "estoque"   && <Estoque prods={prods} movs={movs} pmap={pmap} cmap={cmap} vmap={vmap} onNovoProd={() => setModal({ type: "prod" })} onEntrada={() => setModal({ type: "entrada" })} onEdit={(p) => setModal({ type: "prod", prod: p })} />}
        {tab === "vendas"    && <Vendas vendas={vendas} cmap={cmap} pmap={pmap} pars={pars} onNova={() => setModal({ type: "venda" })} onPagar={(vid) => setModal({ type: "pagar", vid })} onExcluir={delVenda} />}
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
      {!loaded && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,15,20,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ textAlign: "center", color: "#e2e8f0" }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Carregando dados...</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Conectando ao Google Sheets</div>
          </div>
        </div>
      )}

      <footer style={{ position: "fixed", bottom: 0, right: 0, padding: "8px 16px", fontSize: 12, color: "#888" }}>
        © {new Date().getFullYear()} All rights reserved — Andre Theodoro
      </footer>
    </div>
  );
}
