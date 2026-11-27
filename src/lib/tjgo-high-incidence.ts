// Matriz de incidência fornecida pelo usuário para o TJGO 2021 — AJAA.
// Apenas sinalização visual dos assuntos oficiais, por matéria e IDs estáveis.
import type {BankExam} from "./bank-exams";
const selected:Readonly<Record<number,readonly number[]>> = {
  "201": [
    20107,
    20101,
    20108,
    20102,
    20123,
    20114,
    20115,
    20116,
    20121,
    20112,
    20103,
    20113,
    20122,
    20118,
    20104,
    20111
  ],
  "202": [
    20201,
    20217,
    20218,
    20202,
    20209,
    20225,
    20208,
    20210,
    20211,
    20226,
    20205,
    20220,
    20204,
    20221,
    20222,
    20224,
    20215,
    20212,
    20227,
    20213,
    20228,
    20214
  ],
  "203": [
    20301,
    20310,
    20303,
    20311,
    20312,
    20313,
    20307,
    20308,
    20309,
    20302,
    20316,
    20304,
    20317,
    20306,
    20314,
    20305,
    20315
  ],
  "204": [
    20401,
    20408,
    20402,
    20409,
    20403,
    20404,
    20410,
    20405,
    20406,
    20414,
    20407,
    20415,
    20411,
    20412,
    20413
  ],
  "205": [
    20501,
    20413,
    20504,
    20503,
    20502
  ],
  "206": [
    20601,
    20607,
    20608,
    20609,
    20602,
    20603,
    20604,
    20605,
    20606,
    20611,
    20612,
    20613
  ]
};
export function isGoHighIncidence(matter:number,row:{ids:readonly number[];official:boolean},bank:BankExam):boolean{
 if(bank==="caixa"||!row.official||!row.ids.length)return false;
 const ids=selected[matter];
 return !!ids&&row.ids.every(id=>ids.includes(id));
}
