export const uid = () => Math.random().toString(36).slice(2, 9);
export const R$ = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dtBR = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");
export const hoje = () => new Date().toISOString().slice(0, 10);
export const addMes = (d, n) => {
  const dt = new Date(d + "T00:00:00");
  dt.setMonth(dt.getMonth() + n);
  return dt.toISOString().slice(0, 10);
};
