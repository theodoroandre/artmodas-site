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
    const { data: { subscription } } = supa.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setAuthLoaded(true); }
    });
    return () => subscription.unsubscribe();
  }, [supa]);

  const signIn = (email, password) =>
    supa.auth.signInWithPassword({ email, password }).then(({ error }) => ({ error }));

  const signOut = () => supa.auth.signOut();

  const isAdmin = profile?.role === "admin";
  const permissions = isAdmin ? ALL_PERMS : (profile?.permissions || {});
  const canView = (tab) => isAdmin || permissions[tab]?.view === true;
  const canEdit = (tab) => isAdmin || permissions[tab]?.edit === true;

  return { user, profile, isAdmin, authLoaded, signIn, signOut, canView, canEdit };
}
