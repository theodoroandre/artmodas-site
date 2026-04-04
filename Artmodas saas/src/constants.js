import { hoje } from "./utils";

export const PG = {
  dinheiro:     { label: "Dinheiro",   cor: "#22c55e" },
  pix:          { label: "Pix",        cor: "#818cf8" },
  debito:       { label: "Débito",      cor: "#38bdf8" },
  credito:      { label: "Crédito",     cor: "#f59e0b" },
  credito_loja: { label: "Créd. Loja",  cor: "#f472b6" },
};

export const stPar = (p) => {
  if (p.pago >= p.valor) return "pago";
  if (p.pago > 0) return "parcial";
  if (p.vence < hoje()) return "vencido";
  return "aberto";
};

export const COR = { pago: "#22c55e", parcial: "#f59e0b", vencido: "#ef4444", aberto: "#64748b" };
export const LBL = { pago: "Pago", parcial: "Parcial", vencido: "Vencido", aberto: "Aberto" };
