import { useState, useEffect } from "react";

const ALL_PERMS = {
  painel:    { view: true, edit: true },
  estoque:   { view: true, edit: true },
  vendas:    { view: true, edit: true },
  clientes:  { view: true, edit: true },
  cobrancas: { view: true, edit: true },
  logs:      { view: true, edit: true },
};

export function useAuth(supa) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  const loadProfile = async (uid) => {
    const { data } = await supa.from("user_profiles").select("*").eq("id", uid).single();
    setProfile(data || null);
    setAuthLoaded(true);
  };

  useEffect(() => {
    if (!supa) { setAuthLoaded(true); return; }
    supa.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setAuthLoaded(true);
    });
    const { data: { subscription } } = supa.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { setNeedsPasswordReset(true); setAuthLoaded(true); return; }
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setAuthLoaded(true); }
    });
    return () => subscription.unsubscribe();
  }, [supa]);

  const signIn = (email, password) =>
    supa.auth.signInWithPassword({ email, password }).then(({ error }) => ({ error }));

  const signOut = () => supa.auth.signOut();

  const sendPasswordReset = (email) =>
    supa.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    }).then(({ error }) => ({ error }));

  const updatePassword = (newPassword) =>
    supa.auth.updateUser({ password: newPassword }).then(({ error }) => {
      if (!error) setNeedsPasswordReset(false);
      return { error };
    });

  const isAdmin    = profile?.role === "admin";
  const isApproved = profile?.approved !== false; // undefined = not yet migrated = allow through
  const permissions = isAdmin ? ALL_PERMS : (profile?.permissions || {});
  const canView = (tab) => isAdmin || permissions[tab]?.view === true;
  const canEdit = (tab) => isAdmin || permissions[tab]?.edit === true;

  return { user, profile, isAdmin, isApproved, authLoaded, needsPasswordReset, signIn, signOut, sendPasswordReset, updatePassword, canView, canEdit };
}
