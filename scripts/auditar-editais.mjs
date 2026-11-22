// npm run audit:editais — valida fontes incorporadas e matriz de equivalências.
import {readFileSync} from "node:fs";
import {inflateSync} from "node:zlib";

function ensure(cond, message) {
  if (!cond) throw new Error("AUDITORIA FALHOU: " + message);
}
function inflated(filename, variable) {
  const txt = readFileSync(filename,"utf8");
  const re = new RegExp("const "+variable+"\\s*=\\s*\"([^\"]+)\"");
  const match = txt.match(re);
  ensure(match, "Catálogo empacotado "+variable+" ausente");
  return JSON.parse(inflateSync(Buffer.from(match[1],"base64")).toString("utf8"));
}
const bb = inflated("src/lib/edital-caixa-bb-data.ts", "PACKED_CATALOG");
const bnb = inflated("src/lib/edital-bnb-data.ts", "PACKED_BNB");
const original = bb.a.map((x,i)=>({id:i+1,mat:x[0],escopo:x[2],nome:x[4]}));
const restaurados = [
  {id:183,mat:10,escopo:"Só BB",nome:"10. Sequências"},
  {id:184,mat:10,escopo:"Só BB",nome:"11. Progressões aritméticas e progressões geométricas"},
];
const todosBb = [...original,...restaurados];
const bnbRows = bnb.flatMap((m,i)=>m.topicos.map(([num,nome])=>({mat:i+101,num,nome})))
  .map((x,i)=>({...x,id:i+1001}));
const idsBb = new Set(todosBb.map(x=>x.id));
const idsBnb = new Set(bnbRows.map(x=>x.id));
ensure(bb.m.length===10 && original.length===182, "BB/Caixa original deveria ter 10 matérias e 182 assuntos");
ensure(bnb.length===3 && bnbRows.length===126, "BNB deveria ter 3 matérias e 126 itens/subitens");
ensure(idsBb.size===184 && idsBnb.size===126, "IDs repetidos em algum catálogo");
ensure(todosBb.every(x=>x.nome?.trim() && bb.m.some(m=>m[0]===x.mat)), "Assunto BB/Caixa órfão/vazio");
ensure(bnbRows.every(x=>x.nome?.trim() && x.id<=1126), "Assunto BNB órfão/vazio");
ensure([20,11,95].every((n,i)=>bnb[i].topicos.length===n),"Subitens oficiais do BNB alterados");

const eqText=readFileSync("src/lib/edital-topic-equivalence.ts","utf8");
const equiv=[...eqText.matchAll(/\{ origem: (\d+), canonico: (\d+), tema:/g)]
  .map(m=>({bnb:+m[1],canonical:+m[2]}));
ensure(equiv.length===26, "Matriz de equivalências não tem 26 vínculos aprovados");
ensure(new Set(equiv.map(e=>e.bnb)).size===26, "BNB vinculado duas vezes");
ensure(equiv.every(e=>idsBnb.has(e.bnb)&&idsBb.has(e.canonical)), "Equivalência órfã");

const assertTerms=[
  "FNE", "PRONAF", "FINAME", "FAT", "Microfinanças",
  "Noções de direito aplicadas", "Código de Conduta Ética",
  "Política de Responsabilidade Socioambiental", "Estratégia ASG",
  "Análise combinatória", "probabilidade", "Juros simples e compostos",
];
const normaliza=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const novoVinculo = equiv.find(e => e.bnb === 1017);
const topicoCaixa = todosBb.find(e => e.id === 72);
const topicoBNB = bnbRows.find(e => e.id === 1017);
ensure(novoVinculo?.canonical === 72, "BNB 1017 deve corresponder ao ID canônico Caixa 72");
ensure(topicoCaixa?.mat === 2 && topicoCaixa.escopo === "Só Caixa" && topicoBNB?.mat === 101,
  "A equivalência Significação das palavras está em matéria ou escopo inesperado");
ensure(!!topicoCaixa?.nome && !!topicoBNB?.nome &&
  normaliza(topicoCaixa.nome.trim()) === normaliza(topicoBNB.nome.trim()) &&
  normaliza(topicoCaixa.nome.trim()) === normaliza("Significação das palavras"),
  "BNB 1017 e Caixa 72 não têm nomenclaturas equivalentes");
const sqlNovoVinculo = readFileSync("supabase/migrations/20261121213000_equivalencia_bnb_1017_caixa_72.sql","utf8");
ensure(/VALUES\s*\(1017,\s*72\s*,/i.test(sqlNovoVinculo),
  "Migração SQL do vínculo BNB 1017 → Caixa 72 ausente");
const corpus=normaliza(bnbRows.map(x=>x.nome).join(" "));
for(const term of assertTerms) ensure(corpus.includes(normaliza(term)), "BNB ausente: "+term);
const rawBnbMigration = readFileSync("supabase/migrations/20261121154000_bnb_edital_catalog.sql","utf8");
const sqlRows=[...rawBnbMigration.matchAll(/\((\d{4}),(\d{3}),'([^']+)','((?:[^']|'')*)',(\d+)\)/g)];
ensure(sqlRows.length===126,"Seed SQL BNB não tem 126 registros");
for(let i=0;i<126;i++){
  ensure(+sqlRows[i][1]===bnbRows[i].id,"Ordem/id BNB mudou na migração");
  const text=sqlRows[i][4].replace(/''/g,"'").replace(/\s+/g," ").trim();
  ensure(text===bnbRows[i].nome.replace(/\s+/g," ").trim(),"BNB SQL diferente do frontend: id "+bnbRows[i].id);
}
const patchedBB=readFileSync("src/lib/edital-caixa-bb-data.ts","utf8");
ensure(patchedBB.includes("183, \"10. Sequências\"") &&
  patchedBB.includes("184, \"11. Progressões aritméticas e progressões geométricas\""),
  "Matemática do BB não contém itens 10 e 11");

const mapeados=new Set(equiv.map(e=>e.canonical));
const counters=new Map();
for(const item of todosBb){
  const banks=[item.escopo!=="Só Caixa"&&"BB",item.escopo!=="Só BB"&&"Caixa",mapeados.has(item.id)&&"BNB"].filter(Boolean);
  const key=banks.join(" + ");
  counters.set(key,(counters.get(key)||0)+1);
}
counters.set("BNB",126-equiv.length);
const expected={
  "BB + Caixa + BNB":19,"BB + Caixa":57,
  "BB + BNB":5,"Caixa + BNB":2,
  BB:20,Caixa:81,BNB:100,
};
ensure([...Object.entries(expected)].every(([k,v])=>counters.get(k)===v),
  "Interseções incompatíveis com a matriz auditada");
const qtd=[...counters.values()].reduce((a,b)=>a+b,0);
ensure(qtd===284,"A unificação deveria gerar 284 temas únicos");
console.log(JSON.stringify({
  versao:"Editais 2024/2022/2024",materiasOficiais:{BB:8,Caixa:9,BNB:3},
  materiasIntegradas:10,registrosFonte:{BB:101,Caixa:159,BNB:126,total:310},
  temasUnicos:qtd,intersecoes:Object.fromEntries(counters),equivalencias:equiv.length,
  resultado:"AUDITORIA DOS CATÁLOGOS INCORPORADOS APROVADA"
},null,2));
