// Ciclo acordado: seis sessões alternadas, sem dias fixos.
export const tribunalStudyPlan = {
  priority: "TJGO",
  secondary: "TJDFT",
  sources: {
    TJGO: "https://www.tjgo.jus.br/images/docs/CCS/EDITAL_TJ_ABERTURA_2021_Servidor-Assinado.pdf",
    TJDFT: "https://conhecimento.fgv.br/sites/default/files/concursos/tjdft_-_edital_07-10-2022_retificado_3.pdf",
  },
  sessions: [
    [{subject:"Administração Pública",minutes:90},{subject:"Direito Constitucional",minutes:30}],
    [{subject:"Direito Administrativo",minutes:60},{subject:"Língua Portuguesa",minutes:60}],
    [{subject:"Administração Pública",minutes:90},{subject:"Direito Constitucional",minutes:30}],
    [{subject:"Direito Administrativo",minutes:60},{subject:"Língua Portuguesa",minutes:60}],
    [{subject:"Administração Pública",minutes:60},{subject:"Direito Constitucional",minutes:60}],
    [{subject:"Direito Administrativo",minutes:30},{subject:"Língua Portuguesa",minutes:30},{subject:"Redação (Prova Discursiva)",minutes:60}],
  ],
  // Fila conferida nos anexos históricos; complementos futuros só após confirmação.
  queue: [
    "Legislação Complementar","História e Geografia de Goiás",
    "Gestão de Pessoas e complementos de AFO","Ética no Serviço Público",
    "Direito Processual Civil","Legislação Institucional do TJDFT",
    "Direito Penal","Direito Processual Penal","Direito Civil",
  ],
} as const;
