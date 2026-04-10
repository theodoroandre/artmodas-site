import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const TABS = ["painel", "estoque", "vendas", "clientes", "cobrancas", "logs"];
const DEFAULT_PERMS = Object.fromEntries(TABS.map((t) => [t, { view: false, edit: false }]));

export default function AdminPanel({ supa, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const load = () =>
    supa.from("user_profiles").select("*").order("email")
      .then(({ data }) => setUsers(data || []));

  useEffect(() => {
    load();
    const ch = supa.channel("rt_users")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_profiles" }, load)
      .subscribe();
    return () => supa.removeChannel(ch);
  }, [supa]);

  const createUser = async () => {
    if (!form.email || !form.password) { setError("Email e senha obrigatórios."); return; }
    setCreating(true); setError(null); setSuccess(null);
    // Use a separate client so the admin's session is not replaced
    const { data: { supaUrl, supaKey } } = { data: { supaUrl: localStorage.getItem("lc_supa_url"), supaKey: localStorage.getItem("lc_supa_key") } };
    const tmpSupa = createClient(supaUrl, supaKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error: err } = await tmpSupa.auth.signUp({ email: form.email, password: form.password });
    if (err) { setError(err.message); setCreating(false); return; }
    if (data.user) {
      await supa.from("user_profiles").upsert({
        id: data.user.id, email: form.email, name: form.name, role: "user", permissions: DEFAULT_PERMS,
      });
    }
    setForm({ email: "", password: "", name: "" });
    setSuccess("Usuário criado.");
    setCreating(false);
    load();
  };

  const approve = async (uid) => {
    await supa.from("user_profiles").update({ approved: true }).eq("id", uid);
    setUsers((u) => u.map((x) => x.id === uid ? { ...x, approved: true } : x));
  };

  const setRole = async (uid, role) => {
    await supa.from("user_profiles").update({ role }).eq("id", uid);
    setUsers((u) => u.map((x) => x.id === uid ? { ...x, role } : x));
  };

  const togglePerm = async (uid, tab, type) => {
    const user = users.find((u) => u.id === uid);
    if (!user || user.role === "admin") return;
    const cur = user.permissions[tab] || { view: false, edit: false };
    const newPerms = { ...user.permissions, [tab]: { ...cur, [type]: !cur[type] } };
    await supa.from("user_profiles").update({ permissions: newPerms }).eq("id", uid);
    setUsers((u) => u.map((x) => x.id === uid ? { ...x, permissions: newPerms } : x));
  };

  const deleteUser = async (uid) => {
    if (uid === currentUserId) return alert("Não pode excluir a si mesmo.");
    if (!confirm("Remover este usuário do sistema?")) return;
    await supa.from("user_profiles").delete().eq("id", uid);
    setUsers((u) => u.filter((x) => x.id !== uid));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 className="sy" style={{ fontSize: 22, fontWeight: 700 }}>Admin — Usuários</h1>

      {/* Create user */}
      <div className="card" style={{ padding: 20 }}>
        <div className="sy" style={{ fontWeight: 700, marginBottom: 14 }}>Criar Usuário</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="inp" placeholder="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ flex: 1, minWidth: 140 }} />
          <input className="inp" placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={{ flex: 1, minWidth: 180 }} />
          <input className="inp" placeholder="Senha *" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} style={{ flex: 1, minWidth: 140 }} />
          <button className="btn prim" onClick={createUser} disabled={creating} style={{ whiteSpace: "nowrap" }}>
            {creating ? "Criando..." : "+ Criar"}
          </button>
        </div>
        {error && <div style={{ marginTop: 8, color: "#ef4444", fontSize: 12 }}>{error}</div>}
        {success && <div style={{ marginTop: 8, color: "#22c55e", fontSize: 12 }}>{success}</div>}
      </div>

      {/* User list */}
      {users.map((u) => (
        <div key={u.id} className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{u.name || u.email}</div>
              {u.name && <div style={{ color: "#64748b", fontSize: 12 }}>{u.email}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {!u.approved && (
                <span className="badge" style={{ background: "#78350f22", color: "#fbbf24" }}>Pendente</span>
              )}
              <span className="badge" style={{ background: u.role === "admin" ? "#6366f122" : "#1e2230", color: u.role === "admin" ? "#818cf8" : "#94a3b8" }}>
                {u.role}
              </span>
              {!u.approved && u.id !== currentUserId && (
                <button className="btn prim" style={{ fontSize: 11, padding: "4px 12px" }} onClick={() => approve(u.id)}>
                  Aprovar
                </button>
              )}
              {u.approved && u.id !== currentUserId && (
                <>
                  <button className="btn ghost" style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() => setRole(u.id, u.role === "admin" ? "user" : "admin")}>
                    {u.role === "admin" ? "→ user" : "→ admin"}
                  </button>
                </>
              )}
              {u.id !== currentUserId && (
                <button className="btn ghost" style={{ fontSize: 11, padding: "4px 10px", color: "#ef4444", borderColor: "#ef444444" }}
                  onClick={() => deleteUser(u.id)}>
                  Remover
                </button>
              )}
            </div>
          </div>

          {u.role !== "admin" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ fontSize: 12, width: "auto" }}>
                <thead>
                  <tr>
                    <th style={{ paddingRight: 16, textAlign: "left", color: "#64748b", fontWeight: 500, paddingBottom: 6 }}>Aba</th>
                    <th style={{ paddingRight: 12, color: "#64748b", fontWeight: 500, paddingBottom: 6 }}>Ver</th>
                    <th style={{ color: "#64748b", fontWeight: 500, paddingBottom: 6 }}>Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {TABS.map((tab) => {
                    const p = u.permissions[tab] || { view: false, edit: false };
                    return (
                      <tr key={tab}>
                        <td style={{ paddingRight: 16, color: "#94a3b8", paddingBottom: 4 }}>{tab}</td>
                        <td style={{ paddingRight: 12, paddingBottom: 4, textAlign: "center" }}>
                          <Toggle value={p.view} onChange={() => togglePerm(u.id, tab, "view")} />
                        </td>
                        <td style={{ paddingBottom: 4, textAlign: "center" }}>
                          <Toggle value={p.edit} disabled={!p.view} onChange={() => p.view && togglePerm(u.id, tab, "edit")} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {u.role === "admin" && <div style={{ color: "#64748b", fontSize: 12 }}>Acesso total a todas as abas.</div>}
        </div>
      ))}

      {users.length === 0 && <div style={{ color: "#64748b", textAlign: "center", padding: 32 }}>Nenhum usuário</div>}
    </div>
  );
}

function Toggle({ value, onChange, disabled }) {
  return (
    <div onClick={disabled ? undefined : onChange}
      style={{ width: 32, height: 18, borderRadius: 9, background: value ? "#6366f1" : "#2d3244", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, position: "relative", transition: "background .2s", display: "inline-block" }}>
      <div style={{ position: "absolute", top: 3, left: value ? 17 : 3, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
    </div>
  );
}
