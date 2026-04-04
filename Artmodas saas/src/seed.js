import { uid, addMes } from "./utils";

export const PROD0 = [];
export const CLI0 = [];

export const mkPar = (v) => {
  if (v.pg !== "credito_loja" || !v.nLoja) return [];
  const base = +(v.total / v.nLoja).toFixed(2);
  return Array.from({ length: v.nLoja }, (_, i) => ({
    id: uid(), vendaId: v.id, num: i + 1,
    valor: i === v.nLoja - 1 ? +(v.total - base * (v.nLoja - 1)).toFixed(2) : base,
    vence: addMes(v.data, i + 1), pago: 0, pagamentos: [],
  }));
};

export const VENDAS0 = [];
export const PAR0 = [];
export const MOV0 = [];
export const LOG0 = [];
