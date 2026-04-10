import { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { uid, hoje, agora } from "./utils";
import { mkPar } from "./seed";
import { useSupabaseData } from "./useSupabase";
import { useAuth } from "./useAuth";
import "./index.css";

import Painel from "./components/Painel";
import Estoque from "./components/Estoque";
import Vendas from "./components/Vendas";
import Clientes from "./components/Clientes";
import Cobrancas from "./components/Cobrancas";
import Logs from "./components/Logs";
import AdminPanel from "./components/AdminPanel";
import ProdModal from "./components/ProdModal";
import EntradaModal from "./components/EntradaModal";
import CliModal from "./components/CliModal";
import VendaModal from "./components/VendaModal";
import DetCliModal from "./components/DetCliModal";
import PagarModal from "./components/PagarModal";

// ---- Project Config Screen (one-time setup) ----
function ConfigScreen({ onSave }) {
  const [url, setUrl] = useState(localStorage.getItem("lc_supa_url") || "");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    const trimUrl = url.trim(), trimKey = key.trim();
    if (!trimUrl || !trimKey) { setError("Preencha todos os campos."); return; }
    setLoading(true); setError(null);
    try {
      const supa = createClient(trimUrl, trimKey);
      const { error: err } = await supa.from("clientes").select("id").limit(1);
      if (err) {
        if (err.code === "42P01") setError("Tabelas não encontradas. Execute o SQL de setup primeiro.");
        else setError("Conexão falhou: " + err.message);
        setLoading(false); return;
      }
      localStorage.setItem("lc_supa_url", trimUrl);
      localStorage.setItem("lc_supa_key", trimKey);
      onSave(trimUrl, trimKey);
    } catch { setError("Não foi possível conectar."); setLoading(false); }
  };

  return (
    <Centered>
      <Brand />
      <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>Configure o projeto Supabase.</p>
      <Field value={url} onChange={setUrl} placeholder="URL do projeto (https://xxx.supabase.co)" />
      <Field value={key} onChange={setKey} placeholder="Anon Key" type="password" onEnter={handleSave} style={{ marginTop: 8 }} />
      {error && <Err>{error}</Err>}
      <SubmitBtn onClick={handleSave} loading={loading}>Conectar</SubmitBtn>
      <Footer />
    </Centered>
  );
}

// ---- Login Screen ----
function LoginScreen({ supa, onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [hasUsers, setHasUsers] = useState(true); // default true to avoid flash of button

  useEffect(() => {
    supa.from("user_profiles").select("id", { count: "exact", head: true })
      .then(({ count }) => setHasUsers((count ?? 0) > 0));
  }, [supa]);

  const switchMode = (m) => { setMode(m); setError(null); };

  const handleLogin = async () => {
    if (!email || !password) { setError("Preencha email e senha."); return; }
    setLoading(true); setError(null);
    const { error: err } = await supa.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message === "Invalid login credentials" ? "Email ou senha incorretos." : err.message); setLoading(false); }
  };

  const handleSignup = async () => {
    if (!email || !password) { setError("Preencha email e senha."); return; }
    if (password.length < 6) { setError("Senha mínimo 6 caracteres."); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supa.auth.signUp({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.user && name) {
      await supa.from("user_profiles").update({ name }).eq("id", data.user.id);
    }
    // If email confirmation is disabled, user is logged in automatically.
    // If enabled, show message.
    if (data.session === null) {
      setError(null);
      setLoading(false);
      switchMode("login");
      alert("Conta criada! Verifique seu email para confirmar antes de entrar.");
    }
  };

  const handleForgot = async () => {
    if (!email) { setError("Digite seu email."); return; }
    setLoading(true); setError(null);
    const { error: err } = await supa.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setResetSent(true);
  };

  if (resetSent) return (
    <Centered>
      <Brand />
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Email enviado</div>
        <p style={{ color: "#64748b", fontSize: 13 }}>Verifique sua caixa de entrada e clique no link para redefinir a senha.</p>
      </div>
      <button onClick={() => { switchMode("login"); setResetSent(false); }}
        style={{ width: "100%", marginTop: 16, padding: "10px 0", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
        Voltar ao login
      </button>
      <Footer />
    </Centered>
  );

  const titles = { login: "Entre com sua conta.", signup: "Crie sua conta.", forgot: "Recuperar senha." };
  const actions = { login: handleLogin, signup: handleSignup, forgot: handleForgot };
  const btnLabels = { login: "Entrar", signup: "Criar conta", forgot: "Enviar link" };

  return (
    <Centered>
      <Brand />
      <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>{titles[mode]}</p>
      {mode === "signup" && <Field value={name} onChange={setName} placeholder="Nome (opcional)" style={{ marginBottom: 8 }} />}
      <Field value={email} onChange={setEmail} placeholder="Email" type="email" onEnter={actions[mode]} />
      {mode !== "forgot" && <Field value={password} onChange={setPassword} placeholder="Senha" type="password" onEnter={actions[mode]} style={{ marginTop: 8 }} />}
      {error && <Err>{error}</Err>}
      <SubmitBtn onClick={actions[mode]} loading={loading}>{btnLabels[mode]}</SubmitBtn>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", gap: 12 }}>
          {mode !== "login"   && <LinkBtn onClick={() => switchMode("login")}>← Entrar</LinkBtn>}
          {mode === "login" && !hasUsers && <LinkBtn onClick={() => switchMode("signup")}>Criar conta</LinkBtn>}
          {mode === "login"   && <LinkBtn onClick={() => switchMode("forgot")}>Esqueci a senha</LinkBtn>}
        </div>
        <LinkBtn onClick={() => { localStorage.removeItem("lc_supa_url"); localStorage.removeItem("lc_supa_key"); window.location.reload(); }} style={{ color: "#475569" }}>
          Trocar projeto
        </LinkBtn>
      </div>
      <Footer />
    </Centered>
  );
}

// ---- Root ----
export default function App() {
  const [supaUrl, setSupaUrl] = useState(localStorage.getItem("lc_supa_url") || "");
  const [supaKey, setSupaKey] = useState(localStorage.getItem("lc_supa_key") || "");

  const supa = useMemo(() => supaUrl && supaKey ? createClient(supaUrl, supaKey) : null, [supaUrl, supaKey]);

  if (!supa) return <ConfigScreen onSave={(u, k) => { setSupaUrl(u); setSupaKey(k); }} />;
  return <AuthGate supa={supa} />;
}

function AuthGate({ supa }) {
  const { user, profile, isAdmin, isApproved, authLoaded, needsPasswordReset, updatePassword, signOut, canView, canEdit } = useAuth(supa);

  if (!authLoaded) return (
    <Centered><div style={{ color: "#64748b", fontSize: 13 }}>Carregando...</div></Centered>
  );

  if (needsPasswordReset) return <ResetPasswordScreen onSave={updatePassword} />;

  if (!user || !profile) return <LoginScreen supa={supa} onLogin={() => {}} />;

  if (!isApproved) return (
    <Centered>
      <Brand />
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Aguardando aprovação</div>
        <p style={{ color: "#64748b", fontSize: 13 }}>Sua conta foi criada mas ainda não foi aprovada pelo administrador.</p>
      </div>
      <button onClick={async () => { await signOut(); window.location.reload(); }}
        style={{ width: "100%", marginTop: 16, padding: "10px 0", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
        Sair
      </button>
      <Footer />
    </Centered>
  );

  return <MainApp supa={supa} profile={profile} isAdmin={isAdmin} canView={canView} canEdit={canEdit} signOut={signOut} />;
}

function ResetPasswordScreen({ onSave }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!password || password.length < 6) { setError("Mínimo 6 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    setLoading(true); setError(null);
    const { error: err } = await onSave(password);
    if (err) { setError(err.message); setLoading(false); }
  };

  return (
    <Centered>
      <Brand />
      <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>Defina uma nova senha.</p>
      <Field value={password} onChange={setPassword} placeholder="Nova senha" type="password" />
      <Field value={confirm} onChange={setConfirm} placeholder="Confirmar senha" type="password" onEnter={handleSave} style={{ marginTop: 8 }} />
      {error && <Err>{error}</Err>}
      <SubmitBtn onClick={handleSave} loading={loading}>Salvar nova senha</SubmitBtn>
      <Footer />
    </Centered>
  );
}

// ---- Main App ----
function MainApp({ supa, profile, isAdmin, canView, canEdit, signOut }) {
  const [tab, setTab]     = useState("painel");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const close = () => setModal(null);

  const { prods, clis, vendas, pars, movs, logs, set, insert, upsert, remove, loaded, saving: isSaving } = useSupabaseData(supa);

  const logout = async () => { await signOut(); window.location.reload(); };

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
    set("produtos", (x) => [...x, np]); insert("produtos", np);
    log("Produto", "Cadastro", `Produto "${np.nome}" cadastrado`);
  };
  const editProd = (p) => {
    const old = pmap[p.id];
    set("produtos", (x) => x.map((q) => q.id === p.id ? p : q)); upsert("produtos", p);
    log("Produto", "Edicao", `Produto "${old?.nome || p.nome}": ${diff(old || {}, p, ["cod", "nome", "preco", "estoque"]) || "sem alteracoes"}`);
  };
  const editCli = (c) => {
    const old = cmap[c.id];
    set("clientes", (x) => x.map((q) => q.id === c.id ? c : q)); upsert("clientes", c);
    log("Cliente", "Edicao", `Cliente "${old?.nome || c.nome}": ${diff(old || {}, c, ["nome", "tel", "cpf", "email", "end"]) || "sem alteracoes"}`);
  };
  const entrada = ({ pid, qty, data, obs }) => {
    const prod = pmap[pid]; const nome = prod?.nome || pid;
    if (prod) { const np = { ...prod, estoque: prod.estoque + qty }; set("produtos", (x) => x.map((p) => p.id === pid ? np : p)); upsert("produtos", np); }
    const mov = { id: uid(), pid, tipo: "entrada", qty, data, motivo: obs || "Entrada de estoque" };
    set("movimentacoes", (x) => [...x, mov]); insert("movimentacoes", mov);
    log("Estoque", "Entrada", `+${qty} un. de "${nome}"${obs ? ` — ${obs}` : ""}`);
  };
  const addVenda = (v) => {
    const nv = { ...v, id: uid() }; const cli = cmap[nv.cliId];
    set("vendas", (x) => [...x, nv]); insert("vendas", nv);
    nv.itens.forEach((it) => {
      const prod = pmap[it.pid];
      if (prod) { const np = { ...prod, estoque: Math.max(0, prod.estoque - it.qty) }; set("produtos", (x) => x.map((p) => p.id === it.pid ? np : p)); upsert("produtos", np); }
      const mov = { id: uid(), pid: it.pid, tipo: "saida", qty: it.qty, data: nv.data, motivo: "Venda", vendaId: nv.id };
      set("movimentacoes", (x) => [...x, mov]); insert("movimentacoes", mov);
    });
    if (nv.pg === "credito_loja") {
      const newPars = mkPar(nv);
      set("parcelamentos", (x) => [...x, ...newPars]); newPars.forEach((p) => insert("parcelamentos", p));
    }
    log("Venda", "Nova venda", `Venda para "${cli?.nome || "?"}" — ${nv.itens.length} item(ns), ${nv.pg}`);
  };
  const delVenda = (vid) => {
    const v = vmap[vid]; if (!v) return; const cli = cmap[v.cliId];
    set("vendas", (x) => x.filter((vn) => vn.id !== vid)); remove("vendas", vid);
    const relPars = pars.filter((p) => p.vendaId === vid);
    set("parcelamentos", (x) => x.filter((p) => p.vendaId !== vid)); relPars.forEach((p) => remove("parcelamentos", p.id));
    v.itens.forEach((it) => {
      const prod = pmap[it.pid];
      if (prod) { const np = { ...prod, estoque: prod.estoque + it.qty }; set("produtos", (x) => x.map((p) => p.id === it.pid ? np : p)); upsert("produtos", np); }
      const mov = { id: uid(), pid: it.pid, tipo: "entrada", qty: it.qty, data: hoje(), motivo: "Estorno venda", vendaId: vid };
      set("movimentacoes", (x) => [...x, mov]); insert("movimentacoes", mov);
    });
    log("Venda", "Exclusao", `Venda para "${cli?.nome || "?"}" excluida com estorno`);
  };
  const pagarPar = (id, val, data, obs) => {
    const par = pars.find((p) => p.id === id), v = par ? vmap[par.vendaId] : null, cli = v ? cmap[v.cliId] : null;
    let updated;
    set("parcelamentos", (x) => x.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, pago: Math.min(p.valor, +(p.pago + val).toFixed(2)), pagamentos: [...p.pagamentos, { id: uid(), val, data, obs }] };
      return updated;
    }));
    if (updated) upsert("parcelamentos", updated);
    log("Pagamento", "Recebimento", `R$ ${val.toFixed(2)} recebido de "${cli?.nome || "?"}" — parcela ${par?.num || "?"}`);
  };

  const TABS = [
    { id: "painel",    l: "Painel" },
    { id: "estoque",   l: "Estoque" },
    { id: "vendas",    l: "Vendas" },
    { id: "clientes",  l: "Clientes" },
    { id: "cobrancas", l: "Cobranças" },
    { id: "logs",      l: "Logs" },
    ...(isAdmin ? [{ id: "admin", l: "Admin" }] : []),
  ].filter((t) => t.id === "admin" || canView(t.id));

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0d0f14", minHeight: "100vh", color: "#e2e8f0" }}>
      <div className="topbar" style={{ background: "#0d0f14", borderBottom: "1px solid #1e2230", padding: "0 22px", display: "flex", alignItems: "center", gap: 18, position: "sticky", top: 0, zIndex: 50 }}>
        <button className="hamburger" onClick={() => setMenuOpen(true)}
          style={{ display: "none", background: "none", border: "none", color: "#e2e8f0", fontSize: 22, cursor: "pointer", padding: "6px 4px", lineHeight: 1 }}>☰</button>
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
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#64748b", fontSize: 12 }}>{profile?.name || profile?.email}</span>
          <button className="btn-sair-desktop" onClick={logout} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, background: "transparent", color: "#64748b", border: "1px solid #334155", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Sair</button>
        </div>
      </div>

      {menuOpen && <div className="side-overlay" onClick={() => setMenuOpen(false)} />}
      <div className={`side-panel ${menuOpen ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div className="sy" style={{ fontWeight: 800, fontSize: 17, color: "#6366f1", letterSpacing: "-.02em" }}>LOJA<span style={{ color: "#e2e8f0" }}>CTRL</span></div>
          <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12, padding: "0 4px" }}>{profile?.name || profile?.email}</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }} className="btn"
              style={{ padding: "10px 14px", borderRadius: 8, fontSize: 14, textAlign: "left", background: tab === t.id ? "#1e2230" : "transparent", color: tab === t.id ? "#e2e8f0" : "#94a3b8", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {t.l}
            </button>
          ))}
        </nav>
        <button onClick={() => { setMenuOpen(false); logout(); }}
          style={{ marginTop: 24, padding: "10px 14px", borderRadius: 8, fontSize: 13, width: "100%", textAlign: "left", background: "transparent", color: "#ef4444", border: "1px solid #7f1d1d44", cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "painel"    && <Painel prods={prods} clis={clis} vendas={vendas} pars={pars} cmap={cmap} setTab={setTab} onPagar={canEdit("cobrancas") ? (vid) => setModal({ type: "pagar", vid }) : null} />}
        {tab === "estoque"   && <Estoque prods={prods} movs={movs} pmap={pmap} cmap={cmap} vmap={vmap} canEdit={canEdit("estoque")} onNovoProd={() => setModal({ type: "prod" })} onEntrada={() => setModal({ type: "entrada" })} onEdit={(p) => setModal({ type: "prod", prod: p })} />}
        {tab === "vendas"    && <Vendas vendas={vendas} cmap={cmap} pmap={pmap} pars={pars} canEdit={canEdit("vendas")} onNova={() => setModal({ type: "venda" })} onPagar={(vid) => setModal({ type: "pagar", vid })} onExcluir={delVenda} />}
        {tab === "clientes"  && <Clientes clis={clis} vendas={vendas} pars={pars} pmap={pmap} canEdit={canEdit("clientes")} onNovo={() => setModal({ type: "cli" })} onEdit={(c) => setModal({ type: "cli", cli: c })} onDetalhe={(c) => setModal({ type: "detCli", cli: c })} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
        {tab === "cobrancas" && <Cobrancas pars={pars} vendas={vendas} cmap={cmap} canEdit={canEdit("cobrancas")} onPagar={(vid) => setModal({ type: "pagar", vid })} />}
        {tab === "logs"      && <Logs logs={logs} />}
        {tab === "admin"     && isAdmin && <AdminPanel supa={supa} currentUserId={profile?.id} />}
      </div>

      {modal?.type === "prod"    && <ProdModal    prod={modal.prod} onClose={close} onSave={(p) => { modal.prod ? editProd(p) : addProd(p); close(); }} />}
      {modal?.type === "entrada" && <EntradaModal prods={prods} onClose={close} onSave={(e) => { entrada(e); close(); }} />}
      {modal?.type === "cli"     && <CliModal     cli={modal.cli} onClose={close} onSave={(c) => {
        if (modal.cli) { editCli(c); } else {
          const nc = { ...c, id: uid(), cad: hoje() };
          set("clientes", (x) => [...x, nc]); insert("clientes", nc);
          log("Cliente", "Cadastro", `Cliente "${c.nome}" cadastrado`);
        }
        close();
      }} />}
      {modal?.type === "venda"   && <VendaModal   prods={prods} clis={clis} onClose={close} onSave={(v) => { addVenda(v); close(); }} />}
      {modal?.type === "detCli"  && <DetCliModal  cli={modal.cli} vendas={vendas.filter((v) => v.cliId === modal.cli.id)} pars={pars} pmap={pmap} onClose={close} onPagar={(vid) => { close(); setModal({ type: "pagar", vid }); }} />}
      {modal?.type === "pagar"   && <PagarModal   venda={vmap[modal.vid]} pars={pars.filter((p) => p.vendaId === modal.vid)} onClose={close} onPay={pagarPar} />}

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

// ---- Shared UI helpers ----
function Centered({ children }) {
  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0d0f14", minHeight: "100vh", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1e2230", borderRadius: 12, padding: 32, width: 400, maxWidth: "90vw" }}>
        {children}
      </div>
    </div>
  );
}
function Brand() {
  return <div style={{ fontWeight: 800, fontSize: 22, color: "#6366f1", marginBottom: 4, letterSpacing: "-.02em", fontFamily: "'Syne',sans-serif" }}>LOJA<span style={{ color: "#e2e8f0" }}>CTRL</span></div>;
}
function Field({ value, onChange, placeholder, type = "text", onEnter, style }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0d0f14", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", ...style }} />
  );
}
function Err({ children }) { return <div style={{ marginTop: 8, color: "#ef4444", fontSize: 12 }}>{children}</div>; }
function SubmitBtn({ onClick, loading, children }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ width: "100%", marginTop: 16, padding: "10px 0", borderRadius: 8, border: "none", background: loading ? "#4b5563" : "#6366f1", color: "#fff", cursor: loading ? "default" : "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14 }}>
      {loading ? "Aguarde..." : children}
    </button>
  );
}
function Footer() {
  return <footer style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "#555" }}>© {new Date().getFullYear()} All rights reserved — Andre Theodoro</footer>;
}
function LinkBtn({ onClick, children, style }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 11, cursor: "pointer", fontFamily: "inherit", ...style }}>{children}</button>;
}
