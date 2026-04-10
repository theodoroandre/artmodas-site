import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { uid, hoje, agora } from "./utils";
import { mkPar } from "./seed";
import { useSupabaseData } from "./useSupabase";
import "./index.css";

import Painel from "./components/Painel";
import Estoque from "./components/Estoque";
import Vendas from "./components/Vendas";
import Clientes from "./components/Clientes";
import Cobrancas from "./components/Cobrancas";
import Logs from "./components/Logs";
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
  { id: "logs",      l: "Logs" },
];

function LoginScreen() {
  const [url, setUrl] = useState(localStorage.getItem("lc_supa_url") || "");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    const trimUrl = url.trim();
    const trimKey = key.trim();
    if (!trimUrl || !trimKey) { setError("Preencha todos os campos."); return; }
    setLoading(true);
    setError(null);
    try {
      const supa = createClient(trimUrl, trimKey);
      const { error: err } = await supa.from("clientes").select("id").limit(1);
      if (err) {
        if (err.code === "42P01") setError("Tabelas não encontradas. Execute o SQL de setup no Supabase primeiro.");
        else setError("Conexão falhou: " + err.message);
        setLoading(false);
        return;
      }
      localStorage.setItem("lc_supa_url", trimUrl);
      localStorage.setItem("lc_supa_key", trimKey);
      window.location.reload();
    } catch {
      setError("Não foi possível conectar. Verifique a URL.");
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0d0f14", minHeight: "100vh", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1e2230", borderRadius: 12, padding: 32, width: 400, maxWidth: "90vw" }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: "#6366f1", marginBottom: 4, letterSpacing: "-.02em" }}>
          LOJA<span style={{ color: "#e2e8f0" }}>CTRL</span>
        </div>
        <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>Entre com suas credenciais Supabase.</p>
        <input
          value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="URL do projeto (https://xxx.supabase.co)"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0d0f14", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <input
          type="password" value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="Anon Key"
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
  const supaUrl = localStorage.getItem("lc_supa_url") || "";
  const supaKey = localStorage.getItem("lc_supa_key") || "";
  if (!supaUrl || !supaKey) return <LoginScreen />;
  return <MainApp supaUrl={supaUrl} supaKey={supaKey} />;
}

function MainApp({ supaUrl, supaKey }) {
  const [tab, setTab]     = useState("painel");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const close = () => setModal(null);

  const { prods, clis, vendas, pars, movs, logs, set, insert, upsert, remove, loaded, saving: isSaving } = useSupabaseData(supaUrl, supaKey);

  const logout = () => {
    ["lc_supa_url", "lc_supa_key"].forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  const pmap = Object.fromEntries(prods.map((p) => [p.id, p]));
  const cmap = Object.fromEntries(clis.map((c) => [c.id, c]));
  const vmap = Object.fromEntries(vendas.map((v) => [v.id, v]));

  const log = (cat, acao, desc) => {
    const entry = { id: uid(), ts: agora(), cat, acao, desc };
    set("logs", (x) => [...x, entry]);
    insert("logs", entry);
  };

  const diff = (old, novo, campos) => campos.map((k) => {
    const a = old[k] ?? "", b = novo[k] ?? "";
    return String(a) !== String(b) ? `${k}: "${a}" → "${b}"` : null;
  }).filter(Boolean).join(", ");

  const addProd = (p) => {
    const np = { ...p, id: uid() };
    set("produtos", (x) => [...x, np]);
    insert("produtos", np);
    log("Produto", "Cadastro", `Produto "${np.nome}" cadastrado`);
  };

  const editProd = (p) => {
    const old = pmap[p.id];
    set("produtos", (x) => x.map((q) => q.id === p.id ? p : q));
    upsert("produtos", p);
    log("Produto", "Edicao", `Produto "${old?.nome || p.nome}": ${diff(old || {}, p, ["cod", "nome", "preco", "estoque"]) || "sem alteracoes"}`);
  };

  const editCli = (c) => {
    const old = cmap[c.id];
    set("clientes", (x) => x.map((q) => q.id === c.id ? c : q));
    upsert("clientes", c);
    log("Cliente", "Edicao", `Cliente "${old?.nome || c.nome}": ${diff(old || {}, c, ["nome", "tel", "cpf", "email", "end"]) || "sem alteracoes"}`);
  };

  const entrada = ({ pid, qty, data, obs }) => {
    const prod = pmap[pid];
    const nome = prod?.nome || pid;
    if (prod) {
      const np = { ...prod, estoque: prod.estoque + qty };
      set("produtos", (x) => x.map((p) => p.id === pid ? np : p));
      upsert("produtos", np);
    }
    const mov = { id: uid(), pid, tipo: "entrada", qty, data, motivo: obs || "Entrada de estoque" };
    set("movimentacoes", (x) => [...x, mov]);
    insert("movimentacoes", mov);
    log("Estoque", "Entrada", `+${qty} un. de "${nome}"${obs ? ` — ${obs}` : ""}`);
  };

  const addVenda = (v) => {
    const nv = { ...v, id: uid() };
    const cli = cmap[nv.cliId];
    set("vendas", (x) => [...x, nv]);
    insert("vendas", nv);
    nv.itens.forEach((it) => {
      const prod = pmap[it.pid];
      if (prod) {
        const np = { ...prod, estoque: Math.max(0, prod.estoque - it.qty) };
        set("produtos", (x) => x.map((p) => p.id === it.pid ? np : p));
        upsert("produtos", np);
      }
      const mov = { id: uid(), pid: it.pid, tipo: "saida", qty: it.qty, data: nv.data, motivo: "Venda", vendaId: nv.id };
      set("movimentacoes", (x) => [...x, mov]);
      insert("movimentacoes", mov);
    });
    if (nv.pg === "credito_loja") {
      const newPars = mkPar(nv);
      set("parcelamentos", (x) => [...x, ...newPars]);
      newPars.forEach((p) => insert("parcelamentos", p));
    }
    log("Venda", "Nova venda", `Venda para "${cli?.nome || "?"}" — ${nv.itens.length} item(ns), ${nv.pg}`);
  };

  const delVenda = (vid) => {
    const v = vmap[vid];
    if (!v) return;
    const cli = cmap[v.cliId];
    set("vendas", (x) => x.filter((vn) => vn.id !== vid));
    remove("vendas", vid);
    const relPars = pars.filter((p) => p.vendaId === vid);
    set("parcelamentos", (x) => x.filter((p) => p.vendaId !== vid));
    relPars.forEach((p) => remove("parcelamentos", p.id));
    v.itens.forEach((it) => {
      const prod = pmap[it.pid];
      if (prod) {
        const np = { ...prod, estoque: prod.estoque + it.qty };
        set("produtos", (x) => x.map((p) => p.id === it.pid ? np : p));
        upsert("produtos", np);
      }
      const mov = { id: uid(), pid: it.pid, tipo: "entrada", qty: it.qty, data: hoje(), motivo: "Estorno venda", vendaId: vid };
      set("movimentacoes", (x) => [...x, mov]);
      insert("movimentacoes", mov);
    });
    log("Venda", "Exclusao", `Venda para "${cli?.nome || "?"}" excluida com estorno`);
  };

  const pagarPar = (id, val, data, obs) => {
    const par = pars.find((p) => p.id === id);
    const v = par ? vmap[par.vendaId] : null;
    const cli = v ? cmap[v.cliId] : null;
    let updated;
    set("parcelamentos", (x) => x.map((p) => {
      if (p.id !== id) return p;
      const np = Math.min(p.valor, +(p.pago + val).toFixed(2));
      updated = { ...p, pago: np, pagamentos: [...p.pagamentos, { id: uid(), val, data, obs }] };
      return updated;
    }));
    if (updated) upsert("parcelamentos", updated);
    log("Pagamento", "Recebimento", `R$ ${val.toFixed(2)} recebido de "${cli?.nome || "?"}" — parcela ${par?.num || "?"}`);
  };

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
        {tab === "clientes"  && <Clientes clis={clis} vendas={vendas} pars={pars} pmap={pmap} onNovo={() => setModal({ type: "cli" })} onEdit={(c) => setModal({ type: "cli", cli: c })} onDetalhe={(c) => setModal({ type: "detCli", cli: c })} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
        {tab === "cobrancas" && <Cobrancas pars={pars} vendas={vendas} cmap={cmap} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
        {tab === "logs"      && <Logs logs={logs} />}
      </div>

      {/* Modals */}
      {modal?.type === "prod"    && <ProdModal    prod={modal.prod} onClose={close} onSave={(p) => { modal.prod ? editProd(p) : addProd(p); close(); }} />}
      {modal?.type === "entrada" && <EntradaModal prods={prods} onClose={close} onSave={(e) => { entrada(e); close(); }} />}
      {modal?.type === "cli"     && <CliModal     cli={modal.cli} onClose={close} onSave={(c) => {
        if (modal.cli) {
          editCli(c);
        } else {
          const nc = { ...c, id: uid(), cad: hoje() };
          set("clientes", (x) => [...x, nc]);
          insert("clientes", nc);
          log("Cliente", "Cadastro", `Cliente "${c.nome}" cadastrado`);
        }
        close();
      }} />}
      {modal?.type === "venda"   && <VendaModal   prods={prods} clis={clis} onClose={close} onSave={(v) => { addVenda(v); close(); }} />}
      {modal?.type === "detCli"  && <DetCliModal  cli={modal.cli} vendas={vendas.filter((v) => v.cliId === modal.cli.id)} pars={pars} pmap={pmap} onClose={close} onPagar={(vid) => { close(); setModal({ type: "pagar", vid }); }} />}
      {modal?.type === "pagar"   && <PagarModal   venda={vmap[modal.vid]} pars={pars.filter((p) => p.vendaId === modal.vid)} onClose={close} onPay={pagarPar} />}

      {/* Loading overlay */}
      {!loaded && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,15,20,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ textAlign: "center", color: "#e2e8f0" }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Carregando dados...</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Conectando ao Supabase</div>
          </div>
        </div>
      )}

      <footer style={{ position: "fixed", bottom: 0, right: 0, padding: "8px 16px", fontSize: 12, color: "#888" }}>
        © {new Date().getFullYear()} All rights reserved — Andre Theodoro
      </footer>
    </div>
  );
}
