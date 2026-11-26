import type { Catalog, Assunto } from "@/lib/edital-caixa-bb-data";
import type { BnbCatalog } from "@/lib/edital-bnb-data";
import { tribunalCatalog, orderTribunalTopics } from "@/lib/tribunal-catalog";
// IDs legados somente para compatibilidade com componentes existentes.
export type BankExam = "bb" | "caixa" | "bnb";
export const BANK_LABELS:Record<BankExam,string>={bb:"TJGO",caixa:"TJDFT",bnb:"TJGO + TJDFT"};
export const BANK_OPTIONS:BankExam[]=["bnb","bb","caixa"];
export const bankTopicAllowed=(a:Pick<Assunto,"escopo">,bank:BankExam)=>bank==="bnb"||(bank==="bb"?a.escopo!=="Só Caixa":a.escopo!=="Só BB");
export const bankMatterAllowed=(numero:number,escopo:string,bank:BankExam)=>numero>=201&&numero<=214&&bankTopicAllowed({escopo},bank);
export function subjectMatterNumber(name:string,bank:BankExam):number|null{
 const m=tribunalCatalog.materias.find(m=>m.titulo_central===name);
 return m&&bankMatterAllowed(m.numero,m.escopo,bank)?m.numero:null;
}
export const subjectBelongsToBank=(name:string,bank:BankExam)=>subjectMatterNumber(name,bank)!==null;
export function bankMatterNumbers(bank:BankExam,catalog:Catalog|undefined,_bnb?:BnbCatalog):number[]{
 return (catalog?.materias??[]).filter(m=>bankMatterAllowed(m.numero,m.escopo,bank)).map(m=>m.numero);
}
export function bankTopicsForMatter(numero:number,bank:BankExam,catalog:Catalog|undefined,_bnb?:BnbCatalog):Assunto[]{
 return orderTribunalTopics((catalog?.assuntos??[]).filter(a=>a.materia_numero===numero&&bankTopicAllowed(a,bank)),numero,bank,a=>a.id);
}
export function subjectTopicIds(name:string,bank:BankExam,catalog:Catalog|undefined,_bnb?:BnbCatalog):number[]{
 const id=subjectMatterNumber(name,bank);return id===null?[]:bankTopicsForMatter(id,bank,catalog).map(a=>a.id);
}
