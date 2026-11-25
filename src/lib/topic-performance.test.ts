import { test } from "node:test";
import { strict as assert } from "node:assert";
import { aggregateTopicPerformance } from "./topic-performance";

const topics = [{"id":10,"topico_central":"Crase"},{"id":11,"topico_central":"Regência"},{"id":12,"topico_central":"Concordância"},{"id":13,"topico_central":"Ortografia"},{"id":100,"topico_central":"Alias"}];
const sessions = [{"edital_assunto_id":10,"questions_done":30,"questions_correct":24},{"edital_assunto_id":100,"questions_done":20,"questions_correct":16},{"edital_assunto_id":11,"questions_done":2,"questions_correct":0},{"edital_assunto_id":13,"questions_done":3,"questions_correct":3},{"edital_assunto_id":999,"questions_done":5,"questions_correct":2},{"edital_assunto_id":null,"questions_done":4,"questions_correct":1},{"edital_assunto_id":12,"questions_done":0,"questions_correct":0}];
test("agrega sessões, aliases, assunto removido e sem vínculo sem duplicação", () => {
  const rows = aggregateTopicPerformance(topics, sessions, id => id === 100 ? 10 : id);
  assert.deepEqual(rows.map(r => [r.id, r.qDone, r.qCorrect, r.accuracy]), [[10,50,40,80],[11,2,0,0],[12,0,0,null],[13,3,3,100],[null,9,3,33]]);
  assert.equal(rows.reduce((n,r) => n+r.qDone,0), 64);
  assert.equal(rows.reduce((n,r) => n+r.qCorrect,0), 46);
});
test("sem questões não é zero por cento; respeita o subconjunto do período", () => {
  assert.ok(aggregateTopicPerformance(topics, []).every(r => r.accuracy === null));
  assert.equal(aggregateTopicPerformance(topics, [sessions[2]])[1].accuracy, 0);
  assert.deepEqual(aggregateTopicPerformance([], []), []);
});
test("renomear um assunto preserva o histórico pelo ID", () => {
  const rows = aggregateTopicPerformance([{id:10,topico_central:"Novo nome"}], [sessions[0]]);
  assert.equal(rows[0].name, "Novo nome");
  assert.equal(rows[0].qDone, 30);
});
