import { uid, hoje, addMes } from "./utils";

export const PROD0 = [
  { id: "p1", nome: "Blusa Floral M",  cat: "Blusas",   custo: 35, preco: 89.9,  estoque: 8, minimo: 3 },
  { id: "p2", nome: "Calça Jeans 40",  cat: "Calças",   custo: 60, preco: 149.9, estoque: 5, minimo: 2 },
  { id: "p3", nome: "Vestido Midi P",  cat: "Vestidos", custo: 75, preco: 189.9, estoque: 3, minimo: 2 },
  { id: "p4", nome: "Saia Plissada G", cat: "Saias",    custo: 45, preco: 99.9,  estoque: 0, minimo: 2 },
];

export const CLI0 = [
  { id: "c1", nome: "Ana Souza",  tel: "31 99999-0001", email: "ana@email.com", cpf: "", end: "", cad: hoje() },
  { id: "c2", nome: "Bruno Lima", tel: "31 98888-0002", email: "",              cpf: "", end: "", cad: hoje() },
];

export const mkPar = (v) => {
  if (v.pg !== "credito_loja" || !v.nLoja) return [];
  const base = +(v.total / v.nLoja).toFixed(2);
  return Array.from({ length: v.nLoja }, (_, i) => ({
    id: uid(), vendaId: v.id, num: i + 1,
    valor: i === v.nLoja - 1 ? +(v.total - base * (v.nLoja - 1)).toFixed(2) : base,
    vence: addMes(v.data, i + 1), pago: 0, pagamentos: [],
  }));
};

const VND0 = [
  { id: "v1", cliId: "c1", data: hoje(), pg: "credito_loja", nLoja: 3, nCard: 1, itens: [{ pid: "p1", qty: 1, preco: 89.9 }, { pid: "p3", qty: 1, preco: 189.9 }], total: 279.8 },
  { id: "v2", cliId: "c2", data: hoje(), pg: "pix",          nLoja: 0, nCard: 1, itens: [{ pid: "p2", qty: 1, preco: 149.9 }], total: 149.9 },
];

export const VENDAS0 = VND0;
export const PAR0 = VND0.flatMap(mkPar);
export const MOV0 = VND0.flatMap((v) =>
  v.itens.map((it) => ({ id: uid(), pid: it.pid, tipo: "saida", qty: it.qty, data: v.data, motivo: "Venda", vendaId: v.id }))
);
