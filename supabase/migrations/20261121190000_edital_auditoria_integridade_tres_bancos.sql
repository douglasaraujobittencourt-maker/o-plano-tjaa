-- AUDITORIA DE CATÁLOGO: Caixa TBN 2024, BB Agente Comercial 2022/001 e BNB Analista Bancário 1 (2024).
-- FONTES: Anexos oficiais e planilha original BB/Caixa. Execute no SQL Editor após criar o esquema básico.
-- Esta migração é idempotente, NÃO apaga sessões, revisões, progressos ou os IDs originais.
-- IMPORTANTE: a execução altera SOMENTE catálogos estáticos e os IDs de ligação de temas EQUIVALENTES.
BEGIN;

INSERT INTO public.edital_materias
(numero,secao_ordem,titulo_central,nomenclatura_caixa,nomenclatura_bb,ciclo,escopo)
VALUES
 (1,'Seção 1','1. Conhecimentos Bancários / Conhecimentos Bancários','CAIXA: Conhecimentos Bancários + Comportamentos Éticos e Compliance [itens comuns]','BB: Conhecimentos Bancários + Atualidades do Mercado Financeiro','Ciclo 1','Comum (Caixa + BB)'),
 (2,'Seção 2','2. Língua Portuguesa / Língua Portuguesa','CAIXA: Língua Portuguesa','BB: Língua Portuguesa','Ciclo 1','Comum (Caixa + BB)'),
 (3,'Seção 3','3. Matemática Financeira / Matemática Financeira','CAIXA: Matemática Financeira','BB: Matemática Financeira + Matemática [itens 10 e 11]','Ciclo 1','Comum (Caixa + BB)'),
 (4,'Seção 4','4. Atendimento Bancário / Vendas e Negociação','CAIXA: Atendimento Bancário + Conhecimentos Bancários [itens 42 a 45]','BB: Vendas e Negociação','Ciclo 1','Comum (Caixa + BB)'),
 (5,'Seção 5','5. Conhecimentos de Tecnologia da Informação e Comunicação / Conhecimentos de Informática','CAIXA: Conhecimentos de Tecnologia da Informação e Comunicação','BB: Conhecimentos de Informática','Ciclo 2','Comum (Caixa + BB)'),
 (6,'Seção 6','6. Língua Inglesa / Língua Inglesa','CAIXA: Língua Inglesa','BB: Língua Inglesa','Ciclo 2','Comum (Caixa + BB)'),
 (7,'Seção 7','7. Noções de Probabilidade e Estatística','CAIXA: Noções de Probabilidade e Estatística','BB: — (Exclusiva Caixa)','Ciclo 2','Só Caixa'),
 (8,'Seção 8','8. Conhecimentos e Comportamentos Digitais','CAIXA: Conhecimentos e Comportamentos Digitais','BB: — (Exclusiva Caixa)','Ciclo 2','Só Caixa'),
 (9,'Seção 9','9. Comportamentos Éticos e Compliance [complementos exclusivos]','CAIXA: Comportamentos Éticos e Compliance [complementos exclusivos]','BB: — (Exclusiva Caixa)','Ciclo 2','Só Caixa'),
 (10,'Seção 10','10. Matemática [itens 1 a 11]','CAIXA: — (Exclusiva BB)','BB: Matemática [itens 1 a 11]','Ciclo 2','Só BB')
ON CONFLICT(numero) DO UPDATE SET
secao_ordem=excluded.secao_ordem,titulo_central=excluded.titulo_central,
nomenclatura_caixa=excluded.nomenclatura_caixa,nomenclatura_bb=excluded.nomenclatura_bb,
ciclo=excluded.ciclo,escopo=excluded.escopo;

INSERT INTO public.edital_assuntos
(id,materia_numero,ciclo,escopo,bloco_ordem,topico_central,nomenclatura_caixa,nomenclatura_bb,ordem_exibicao)
VALUES
 (1,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Sistema Financeiro Nacional','Conhecimentos Bancários: Sistema Financeiro Nacional: Estrutura do Sistema Financeiro Nacional; Órgãos normativos e instituições supervisoras, executoras e operadoras.','Conhecimentos Bancários: Sistema Financeiro Nacional: Estrutura do Sistema Financeiro Nacional; Órgãos normativos e instituições supervisoras, executoras e operadoras.',1),
 (2,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Desdobramentos do mercado financeiro','Conhecimentos Bancários: Mercado financeiro e seus desdobramentos (mercado monetário, de crédito, de capitais e cambial).','Conhecimentos Bancários: Mercado financeiro e seus desdobramentos (mercados monetário, de crédito, de capitais e cambial).',2),
 (3,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Bancos na era digital','Conhecimentos Bancários: Os bancos na Era Digital: Atualidade, tendências e desafios.','Atualidades do Mercado Financeiro: Os bancos na Era Digital: Atualidade, tendências e desafios.',3),
 (4,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Internet banking e Mobile banking','Conhecimentos Bancários: Internet banking. / Mobile banking.','Atualidades do Mercado Financeiro: Internet banking. / Mobile banking.',4),
 (5,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Open Finance / Open Banking','Conhecimentos Bancários: Open finance.','Atualidades do Mercado Financeiro: Open banking.',5),
 (6,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Novos modelos de negócios','Conhecimentos Bancários: Novos modelos de negócios.','Atualidades do Mercado Financeiro: Novos modelos de negócios.',6),
 (7,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Fintechs, startups e big techs','Conhecimentos Bancários: Fintechs, startups e big techs.','Atualidades do Mercado Financeiro: Fintechs, startups e big techs.',7),
 (8,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Shadow banking','Conhecimentos Bancários: Sistema de bancos-sombra (Shadow banking).','Atualidades do Mercado Financeiro: Sistema de bancos-sombra (Shadow banking).',8),
 (9,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Blockchain, bitcoin e criptomoedas','Conhecimentos Bancários: Moedas e ativos digitais: blockchain, bitcoin e demais criptomoedas.','Atualidades do Mercado Financeiro: O dinheiro na era digital: blockchain, bitcoin e demais criptomoedas.',9),
 (10,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Correspondentes bancários','Conhecimentos Bancários: Correspondentes bancários.','Atualidades do Mercado Financeiro: Correspondentes bancários.',10),
 (11,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','PIX (Pagamentos instantâneos)','Conhecimentos Bancários: Sistema de pagamentos instantâneos (PIX).','Atualidades do Mercado Financeiro: Sistema de pagamentos instantâneos (PIX).',11),
 (12,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Transformação digital no Sistema Financeiro','Conhecimentos Bancários: Transformação digital no Sistema Financeiro.','Atualidades do Mercado Financeiro: Transformação digital no Sistema Financeiro.',12),
 (13,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Moeda e política monetária','Conhecimentos Bancários: Moeda e política monetária: Políticas monetárias convencionais e não-convencionais (Quantitative Easing);','Conhecimentos Bancários: Moeda e política monetária: Políticas monetárias convencionais e não-convencionais (Quantitative Easing);',13),
 (14,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Taxa SELIC, operações compromissadas e depósitos remunerados','Conhecimentos Bancários: Taxa SELIC e operações compromissadas; O debate sobre os depósitos remunerados dos bancos comerciais no Banco Central do Brasil.','Conhecimentos Bancários: Taxa SELIC e operações compromissadas; O debate sobre os depósitos remunerados dos bancos comerciais no Banco Central do Brasil.',14),
 (15,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Orçamento público, títulos do Tesouro e dívida pública','Conhecimentos Bancários: Orçamento público, títulos do Tesouro Nacional e dívida pública.','Conhecimentos Bancários: Orçamento público, títulos do Tesouro Nacional e dívida pública.',15),
 (16,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Produtos Bancários','Conhecimentos Bancários: Produtos Bancários: Programas sociais e Benefícios do trabalhador; Noções de cartões de crédito e débito, crédito direto ao consumidor, crédito rural, poupança, capitalização, previdência, consórcio, investimentos e seguros.','Conhecimentos Bancários: Produtos Bancários: Noções de cartões de crédito e débito, crédito direto ao consumidor, crédito rural, poupança, capitalização, previdência, consórcio, investimentos e seguros.',16),
 (17,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Mercado de capitais','Conhecimentos Bancários: Noções de Mercado de capitais.','Conhecimentos Bancários: Noções de Mercado de capitais.',17),
 (18,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Mercado de câmbio','Conhecimentos Bancários: Noções de Mercado de Câmbio: Instituições autorizadas a operar e operações básicas.','Conhecimentos Bancários: Noções de Mercado de Câmbio: Instituições autorizadas a operar e operações básicas.',18),
 (19,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Regimes de taxas de câmbio','Conhecimentos Bancários: Regimes de taxas de câmbio fixas, flutuantes e regimes intermediários.','Conhecimentos Bancários: Regimes de taxas de câmbio fixas, flutuantes e regimes intermediários.',19),
 (20,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Taxas de câmbio nominais e reais','Conhecimentos Bancários: Taxas de câmbio nominais e reais;','Conhecimentos Bancários: Taxas de câmbio nominais e reais;',20),
 (21,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Impactos cambiais no comércio exterior','Conhecimentos Bancários: Impactos das taxas de câmbio sobre as exportações e importações.','Conhecimentos Bancários: Impactos das taxas de câmbio sobre as exportações e importações.',21),
 (22,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Diferencial de juros, prêmios de risco e fluxo de capitais','Conhecimentos Bancários: Diferencial de juros interno e externo, prêmios de risco, fluxo de capitais e seus impactos sobre as taxas de câmbio.','Conhecimentos Bancários: Diferencial de juros interno e externo, prêmios de risco, fluxo de capitais e seus impactos sobre as taxas de câmbio.',22),
 (23,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Mercado interbancário','Conhecimentos Bancários: Dinâmica do Mercado: Operações no mercado interbancário.','Conhecimentos Bancários: Dinâmica do Mercado: Operações no mercado interbancário.',23),
 (24,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Tesouraria, varejo bancário e recuperação de crédito','Conhecimentos Bancários: Mercado bancário: Operações de tesouraria, varejo bancário e recuperação de crédito.','Conhecimentos Bancários: Mercado bancário: Operações de tesouraria, varejo bancário e recuperação de crédito.',24),
 (25,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Taxas de juros e curva de juros','Conhecimentos Bancários: Taxas de juros de curto prazo e a curva de juros; taxas de juros nominais e reais.','Conhecimentos Bancários: Taxas de juros de curto prazo e a curva de juros; taxas de juros nominais e reais.',25),
 (26,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Garantias do Sistema Financeiro Nacional','Conhecimentos Bancários: Garantias do Sistema Financeiro Nacional: aval; fiança; penhor mercantil; alienação fiduciária; hipoteca; fianças bancárias.','Conhecimentos Bancários: Garantias do Sistema Financeiro Nacional: aval; fiança; penhor mercantil; alienação fiduciária; hipoteca; fianças bancárias.',26),
 (27,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Autorregulação bancária','Conhecimentos Bancários: Autorregulação bancária. (Normativos SARB específicos constam em Atendimento Bancário na Caixa)','Conhecimentos Bancários: Autorregulação bancária e Normativos SARB.',27),
 (28,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns — compliance e ética','Prevenção e combate à lavagem de dinheiro','Comportamentos Éticos e Compliance: Prevenção à lavagem de dinheiro: Lei nº 9.613/98 e suas alterações; Circular nº 3.978, de 23 de janeiro de 2020 e Carta Circular nº 4.001, de 29 de janeiro de 2020 e suas alterações.','Conhecimentos Bancários: Crime de lavagem de dinheiro: conceito e etapas; Prevenção e combate ao crime de lavagem de dinheiro: Lei nº 9.613/98 e suas alterações; Circular nº 3.978, de 23 de janeiro de 2020 e Carta Circular nº 4.001, de 29 de janeiro de 2020 e suas alterações.',28),
 (29,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns — compliance e ética','Sigilo Bancário','Comportamentos Éticos e Compliance: Sigilo Bancário: Lei Complementar nº 105/2001 e suas alterações.','Conhecimentos Bancários: Sigilo Bancário: Lei Complementar nº 105/2001 e suas alterações.',29),
 (30,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns — compliance e ética','Lei Geral de Proteção de Dados (LGPD)','Comportamentos Éticos e Compliance: Lei Geral de Proteção de Dados (LGPD): Lei nº 13.709, de 14 de agosto de 2018 e suas alterações.','Conhecimentos Bancários: Lei Geral de Proteção de Dados (LGPD): Lei nº 13.709, de 14 de agosto de 2018 e suas alterações.',30),
 (31,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns — compliance e ética','Legislação anticorrupção','Comportamentos Éticos e Compliance: Legislação anticorrupção: Lei nº 12.846/2013 e DECRETO Nº 11.129, DE 11 DE JULHO DE 2022.','Conhecimentos Bancários: Legislação anticorrupção: Lei nº 12.846/2013 e Decreto nº 11.129 de 11/07/2022.',31),
 (32,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns — compliance e ética','Segurança cibernética','Comportamentos Éticos e Compliance: Segurança cibernética: Resolução CMN nº 4893, de 26 de fevereiro de 2021.','Conhecimentos Bancários: Segurança cibernética: Resolução CMN nº 4.893, de 26/02/2021.',32),
 (33,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns — compliance e ética','Segurança da informação','Comportamentos Éticos e Compliance / TIC: Segurança da informação: fundamentos, conceitos e mecanismos de segurança;','Conhecimentos de Informática: Segurança da informação: fundamentos, conceitos e mecanismos de segurança.',33),
 (34,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns — compliance e ética','Ética empresarial, profissional e gestão da ética','Comportamentos Éticos e Compliance: Atitudes éticas, respeito, valores e virtudes; noções de ética empresarial e profissional. A gestão da ética nas empresas públicas e privadas.','Conhecimentos Bancários: Ética aplicada: ética, moral, valores e virtudes; noções de ética empresarial e profissional. A gestão da ética nas empresas públicas e privadas.',34),
 (35,1,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns — compliance e ética','Responsabilidade socioambiental','Comportamentos Éticos e Compliance: Política de Responsabilidade Socioambiental da Caixa Econômica Federal (disponível no sítio da CAIXA na internet).','Conhecimentos Bancários: Política de Responsabilidade Socioambiental do Banco do Brasil (disponível no sítio do BB na internet). / ASG (Ambiental, Social e Governança): Economia Sustentável; Financiamentos; Mercado PJ.',35),
 (36,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Estatuto Social da CAIXA','Conhecimentos Bancários: Estatuto Social da CAIXA (Disponível no sítio da Caixa Econômica Federal).','—',36),
 (37,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Real digital (DREX)','Conhecimentos Bancários: Moedas digitais dos Bancos Centrais: o Real digital (DREX).','—',37),
 (38,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Programas sociais e Benefícios do trabalhador','Conhecimentos Bancários: Produtos Bancários: Programas sociais e Benefícios do trabalhador;','—',38),
 (39,1,'Ciclo 1','Só Caixa','Complementos da Caixa','PIS (Lei Complementar nº 7/1970)','Conhecimentos Bancários: Lei Complementar nº 7/1970 (PIS).','—',39),
 (40,1,'Ciclo 1','Só Caixa','Complementos da Caixa','FGTS (Lei nº 8.036/1990)','Conhecimentos Bancários: Lei nº 8.036/1990 (FGTS): possibilidades e condições de utilização/saque.','—',40),
 (41,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Certificado de Regularidade do FGTS','Conhecimentos Bancários: Certificado de Regularidade do FGTS.','—',41),
 (42,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Guia de Recolhimento (GRF)','Conhecimentos Bancários: Guia de Recolhimento (GRF).','—',42),
 (43,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Bolsa Família (Lei nº 10.836/2004)','Conhecimentos Bancários: Lei nº 10.836/2004 (Bolsa Família).','—',43),
 (44,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Abertura e movimentação de contas','Conhecimentos Bancários: Produtos: Abertura e movimentação de contas: documentos básicos.','—',44),
 (45,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Pessoa física e pessoa jurídica','Conhecimentos Bancários: Pessoa física e pessoa jurídica: capacidade e incapacidade civil, representação e domicílio.','—',45),
 (46,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Sistema de pagamentos brasileiro','Conhecimentos Bancários: Sistema de pagamentos brasileiro.','—',46),
 (47,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Programa Desemprego e Abono Salarial (Lei nº 7.998/1990)','Conhecimentos Bancários: Lei nº 7.998/1990 (Programa Desemprego e Abono Salarial - beneficiários e critérios para saque).','—',47),
 (48,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Saúde e bem-estar, ergonomia','Conhecimentos Bancários: Saúde e bem-estar, ergonomia.','—',48),
 (49,1,'Ciclo 1','Só Caixa','Complementos da Caixa','Negociação, escuta empática','Conhecimentos Bancários: Negociação, escuta empática.','—',49),
 (50,1,'Ciclo 1','Só Caixa','Complementos da Caixa','CRM','Conhecimentos Bancários: CRM.','—',50),
 (51,1,'Ciclo 1','Só BB','Complementos do BB','Funções da moeda','—','Atualidades do Mercado Financeiro: Funções da moeda.',51),
 (52,1,'Ciclo 1','Só BB','Complementos do BB','Marketplace','—','Atualidades do Mercado Financeiro: Marketplace.',52),
 (53,1,'Ciclo 1','Só BB','Complementos do BB','Arranjos de pagamentos','—','Atualidades do Mercado Financeiro: Arranjos de pagamentos.',53),
 (54,1,'Ciclo 1','Só BB','Complementos do BB','Segmentação e interações digitais','—','Atualidades do Mercado Financeiro: Segmentação e interações digitais.',54),
 (55,1,'Ciclo 1','Só BB','Complementos do BB','Código de Ética do Banco do Brasil','—','Conhecimentos Bancários: Código de Ética do Banco do Brasil (disponível no sítio do BB na internet).',55),
 (56,1,'Ciclo 1','Só BB','Complementos do BB','Política de Responsabilidade Socioambiental do BB','—','Conhecimentos Bancários: Política de Responsabilidade Socioambiental do Banco do Brasil (disponível no sítio do BB na internet).',56),
 (57,1,'Ciclo 1','Só BB','Complementos do BB','ASG (Ambiental, Social e Governança)','—','Conhecimentos Bancários: ASG (Ambiental, Social e Governança): Economia Sustentável; Financiamentos; Mercado PJ.',57),
 (58,2,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Compreensão e interpretação de textos','Compreensão e interpretação de textos.','Compreensão de textos.',58),
 (59,2,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Ortografia oficial','Ortografia oficial.','Ortografia oficial.',59),
 (60,2,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Crase','Emprego do sinal indicativo de crase.','Emprego do acento indicativo de crase.',60),
 (61,2,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Sintaxe da oração e do período','Sintaxe da oração e do período.','Sintaxe da oração e do período.',61),
 (62,2,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Pontuação','Pontuação.','Emprego dos sinais de pontuação.',62),
 (63,2,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Concordância nominal e verbal','Concordância nominal e verbal.','Concordância verbal e nominal.',63),
 (64,2,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Regência nominal e verbal','Regência nominal e verbal.','Regência verbal e nominal.',64),
 (65,2,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Colocação pronominal','Colocação do pronome átono.','Colocação dos pronomes oblíquos átonos (próclise, mesóclise e ênclise).',65),
 (66,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Argumentação e persuasão','Argumentação e persuasão.','—',66),
 (67,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Comunicação assertiva','Comunicação assertiva: linguagem simples, concisa e objetiva.','—',67),
 (68,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Organização textual','Organização textual.','—',68),
 (69,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Coesão e coerência','Coesão e coerência;','—',69),
 (70,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Tipologia textual','Tipologia textual.','—',70),
 (71,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Acentuação gráfica','Acentuação gráfica.','—',71),
 (72,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Significação das palavras','Significação das palavras.','—',72),
 (73,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Redação oficial e Manual da Presidência','Redação oficial: escrita de textos formais e Manual de Redação da Presidência da República (disponível no sítio do Planalto, na internet).','—',73),
 (74,2,'Ciclo 1','Só Caixa','Complementos da Caixa','Novo Acordo Ortográfico','Novo Acordo Ortográfico.','—',74),
 (75,2,'Ciclo 1','Só BB','Complementos do BB','Classe e emprego de palavras','—','Classe e emprego de palavras.',75),
 (76,3,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Conceitos gerais de Matemática Financeira','Matemática Financeira: Conceitos gerais: valor do dinheiro no tempo, valor presente, valor futuro, juro, taxa de juro, prazo da operação.','Matemática Financeira: Conceitos gerais - O conceito do valor do dinheiro no tempo; Capital, juros, taxas de juros; Capitalização, regimes de capitalização; Fluxos de caixa e diagramas de fluxo de caixa; Equivalência financeira.',76),
 (77,3,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Juros Simples','Matemática Financeira: Juros Simples.','Matemática Financeira: Juros simples - Cálculo do montante, dos juros, da taxa de juros, do principal e do prazo da operação financeira.',77),
 (78,3,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Juros Compostos','Matemática Financeira: Juros Compostos.','Matemática Financeira: Juros compostos - Cálculo do montante, dos juros, da taxa de juros, do principal e do prazo da operação financeira.',78),
 (79,3,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Sistemas de Amortização (SAC e Price / Francês)','Matemática Financeira: Sistemas de Amortização de qualquer tipo, incluindo os sistemas com amortizações constantes (SAC) e com prestações constantes (Francês ou PRICE).','Matemática Financeira: Sistemas de amortização - Sistema price; Sistema SAC.',79),
 (80,3,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Sequências numéricas, PA e PG','Matemática Financeira: Sequências numéricas: leis de formação expressas de forma geral (em função da posição do termo) ou de forma recursiva (em função de um ou mais termos anteriores); progressões aritméticas; progressões geométricas.','Matemática: Sequências. / Progressões aritméticas e progressões geométricas.',80),
 (81,3,'Ciclo 1','Só Caixa','Complementos da Caixa','Séries Uniformes','Matemática Financeira: Séries Uniformes.','—',81),
 (82,3,'Ciclo 1','Só Caixa','Complementos da Caixa','Equivalência de Capitais em fluxos regulares ou irregulares','Matemática Financeira: Equivalência de Capitais em fluxos regulares ou irregulares: VP, VF, prazos e taxas de retorno.','—',82),
 (83,3,'Ciclo 1','Só Caixa','Complementos da Caixa','Sistemas de Amortização de qualquer tipo','Matemática Financeira: Sistemas de Amortização de qualquer tipo (além de SAC e Francês ou PRICE).','—',83),
 (84,3,'Ciclo 1','Só Caixa','Complementos da Caixa','Descontos (racional composto e comercial simples)','Matemática Financeira: Descontos: racional composto e comercial simples.','—',84),
 (85,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Estratégia empresarial e posicionamento','Conhecimentos Bancários: Noções de estratégia empresarial: análise de mercado, forças competitivas, imagem institucional, identidade e posicionamento.','Vendas e Negociação: Noções de estratégia empresarial: análise de mercado, forças competitivas, imagem institucional, identidade e posicionamento',85),
 (86,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Segmentação de mercado','Conhecimentos Bancários: Segmentação de mercado.','Vendas e Negociação: Segmentação de mercado.',86),
 (87,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Ações para aumentar o valor percebido pelo cliente','Atendimento Bancário: Ações para aumentar o valor percebido pelo cliente.','Vendas e Negociação: Ações para aumentar o valor percebido pelo cliente.',87),
 (88,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Gestão da experiência do cliente','Atendimento Bancário: Gestão da experiência do cliente.','Vendas e Negociação: Gestão da experiência do cliente.',88),
 (89,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Características dos serviços','Conhecimentos Bancários: Características dos serviços: intangibilidade, inseparabilidade, variabilidade e perecibilidade.','Vendas e Negociação: Características dos serviços: intangibilidade, inseparabilidade, variabilidade e perecibilidade.',89),
 (90,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Gestão da qualidade em serviços','Conhecimentos Bancários: Gestão da qualidade em serviços.','Vendas e Negociação: Gestão da qualidade em serviços.',90),
 (91,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Técnicas de vendas','Atendimento Bancário: Técnicas de vendas: da pré-abordagem ao pósvendas.','Vendas e Negociação: Técnicas de vendas: da pré-abordagem ao pós-vendas.',91),
 (92,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Noções de marketing digital','Atendimento Bancário: Noções de marketing digital: geração de leads; técnica de copywriting; gatilhos mentais; Inbound marketing.','Vendas e Negociação: Noções de marketing digital: geração de leads; técnica de copywriting; gatilhos mentais; Inbound marketing.',92),
 (93,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Ética e conduta profissional em vendas','Atendimento Bancário: Ética e conduta profissional em vendas.','Vendas e Negociação: Ética e conduta profissional em vendas.',93),
 (94,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Padrões de qualidade no atendimento aos clientes','Atendimento Bancário: Padrões de qualidade no atendimento aos clientes (na Caixa complementado por escuta ativa e empática, clareza, objetividade e cortesia na comunicação).','Vendas e Negociação: Padrões de qualidade no atendimento aos clientes.',94),
 (95,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Canais remotos (atendimento e vendas)','Atendimento Bancário: Atendimento qualificado por canais remotos.','Vendas e Negociação: Utilização de canais remotos para vendas.',95),
 (96,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Comportamento do consumidor','Atendimento Bancário: Comportamento do consumidor e sua relação com vendas e negociação.','Vendas e Negociação: Comportamento do consumidor e sua relação com vendas e negociação.',96),
 (97,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Política de Relacionamento com o Cliente','Atendimento Bancário: Política de Relacionamento com o Cliente: Resolução n°. 4.539 de 24 de novembro de 2016 e Resolução CMN 4.949/21.','Vendas e Negociação: Política de Relacionamento com o Cliente: Resolução nº 4.949, de 30 de setembro de 2021.',97),
 (98,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Ouvidoria (Resolução CMN nº 4.860/2020)','Atendimento Bancário: Resolução CMN nº 4.860, de 23 de outubro de 2020 que dispõe sobre a constituição e o funcionamento de componente organizacional de ouvidoria pelas instituições financeiras e demais instituições autorizadas a funcionar pelo Banco Central do Brasil.','Vendas e Negociação: Resolução CMN nº 4.860, de 23 de outubro de 2020 que dispõe sobre a constituição e o funcionamento de componente organizacional de ouvidoria pelas instituições financeiras e demais instituições autorizadas a funcionar pelo Banco Central do Brasil.',98),
 (99,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Lei Brasileira de Inclusão da Pessoa com Deficiência','Atendimento Bancário: Diversidade e Inclusão: Lei Brasileira de Inclusão da Pessoa com Deficiência (Estatuto da Pessoa com Deficiência): Lei nº 13.146, de 06 de julho de 2015.','Vendas e Negociação: Lei Brasileira de Inclusão da Pessoa com Deficiência (Estatuto da Pessoa com Deficiência): Lei nº 13.146, de 06 de julho de 2015.',99),
 (100,4,'Ciclo 1','Comum (Caixa + BB)','Assuntos comuns','Código de Proteção e Defesa do Consumidor','Atendimento Bancário: Código de Proteção e Defesa do Consumidor: Lei nº 8.078/1990 (versão atualizada).','Vendas e Negociação: Código de Proteção e Defesa do Consumidor: Lei nº 8.078/1990 (versão atualizada).',100),
 (101,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Clientecentrismo','Atendimento Bancário: Clientecentrismo.','—',101),
 (102,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Escuta ativa e empática, clareza, objetividade e cortesia','Atendimento Bancário: Escuta ativa e empática, clareza, objetividade e cortesia na comunicação.','—',102),
 (103,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Atendimento qualificado por canais remotos','Atendimento Bancário: Atendimento qualificado por canais remotos.','—',103),
 (104,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Resolução CMN nº 4.539/2016','Atendimento Bancário: Política de Relacionamento com o Cliente: Resolução n°. 4.539 de 24 de novembro de 2016.','—',104),
 (105,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Resolução CMN nº 3.694/2009 e alterações','Atendimento Bancário: Resolução CMN nº 3.694/2009 e alterações.','—',105),
 (106,4,'Ciclo 1','Só Caixa','Complementos da Caixa','SARB nº 004/2009 (Atendimento nas agências)','Atendimento Bancário: Autorregulação bancária: SARB nº 004/2009 Normativo de atendimento ao consumidor na rede de agências bancárias.','—',106),
 (107,4,'Ciclo 1','Só Caixa','Complementos da Caixa','SARB 023/2020 e Estatuto do Idoso (Lei nº 10.741/2003)','Atendimento Bancário: SARB 023/2020 normativo de relacionamento com o consumidor idoso, Lei nº 10.741 de 2003 - Estatuto do Idoso, assim como as 13.466/2017 (acima de 80 anos) e 14.364/2022 (acompanhantes de idosos),','—',107),
 (108,4,'Ciclo 1','Só Caixa','Complementos da Caixa','SARB 024/2021 (Consumidores potencialmente vulneráveis)','Atendimento Bancário: SARB 024/2021 normativo de relacionamento com consumidores potencialmente vulneráveis,','—',108),
 (109,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Atendimento prioritário a pessoas com TEA (Lei nº 12.764/2012)','Atendimento Bancário: Lei nº 12.764 de 2012 sobre atendimento prioritário a pessoas com transtorno do espectro autista.','—',109),
 (110,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Nome social e identidade de gênero (Decreto nº 8.727/2016)','Atendimento Bancário: Decreto nº 8.727 de 2016 dispõe sobre o uso do nome social e o reconhecimento da identidade de gênero de pessoas travestis e transexuais.','—',110),
 (111,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Acessibilidade e prioridade de atendimento (Decreto nº 5.296/2004)','Atendimento Bancário: Decreto nº 5.296 de 2004 relacionado à prioridade de atendimento às pessoas que especifica e promove a acessibilidade das pessoas portadoras de deficiência ou com mobilidade reduzida,','—',111),
 (112,4,'Ciclo 1','Só Caixa','Complementos da Caixa','Acompanhamento de cão-guia (Decreto nº 5.904/2006)','Atendimento Bancário: Decreto nº 5.904 de 2006 sobre o direito da pessoa com deficiência visual de ingressar e permanecer em ambientes de uso coletivo acompanhada de cão-guia.','—',112),
 (113,4,'Ciclo 1','Só BB','Complementos do BB','Aprendizagem e sustentabilidade organizacional','—','Vendas e Negociação: Aprendizagem e sustentabilidade organizacional.',113),
 (114,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Pacote Microsoft Office 365 (Word, Excel e PowerPoint)','Conhecimento de editor de textos, planilhas e apresentações (ambientes Microsoft Office 365 Word, Excel, PowerPoint e Outlook). (Outlook exclusivo da Caixa)','Edição de textos, planilhas e apresentações (ambientes Microsoft Office Word, Excel e PowerPoint - versão 0365).',114),
 (115,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Segurança da informação (revisar Ciclo 1)','Segurança da informação: fundamentos, conceitos e mecanismos de segurança.','Segurança da informação: fundamentos, conceitos e mecanismos de segurança.',115),
 (116,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Segurança cibernética: Res. CMN nº 4.893/2021 (revisar Ciclo 1)','Segurança cibernética: Resolução CMN nº 4893, de 26 de fevereiro de 2021, prevenção e reação a riscos cibernéticos nos negócios.','Conhecimentos Bancários: Segurança cibernética: Resolução CMN nº 4.893, de 26/02/2021.',116),
 (117,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Organização e gerenciamento de informações, arquivos, pastas e programas','Conceitos de organização e de gerenciamento de informações, arquivos, pastas e programas.','Conceitos de organização e de gerenciamento de informações, arquivos, pastas e programas.',117),
 (118,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Redes de computadores, Internet e Intranet','Redes de computadores: conceitos básicos, ferramentas, aplicativos e conceitos/procedimentos de Internet e Intranet.','Redes de computadores: Conceitos básicos, ferramentas, aplicativos e procedimentos de Internet e intranet.',118),
 (119,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Navegadores Web (Microsoft Edge e Mozilla Firefox)','Navegadores Web (Microsoft Edge versão 120 e Mozilla Firefox versão 122), busca e pesquisa na Web.','Navegador Web (Microsoft Edge versão 91 e Mozilla Firefox versão 78 ESR), busca e pesquisa na Web.',119),
 (120,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Correio eletrônico, grupos de discussão, fóruns e wikis','Correio eletrônico, grupos de discussão, fóruns e wikis.','Correio eletrônico, grupos de discussão, fóruns e wikis.',120),
 (121,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Redes Sociais','Redes Sociais: X (ex-Twitter), Facebook, Linkedin, WhatsApp, YouTube, Instagram e Telegram.','Redes Sociais (Twitter, Facebook, Linkedin, WhatsApp, YouTube, Instagram e Telegram).',121),
 (122,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Sistemas de suporte à decisão e inteligência de negócio','Visão geral sobre sistemas de suporte à decisão e inteligência de negócio.','Visão geral sobre sistemas de suporte à decisão e inteligência de negócio.',122),
 (123,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Tecnologias e ferramentas multimídia','Conceitos de tecnologias e ferramentas multimídia, de reprodução de áudio e vídeo.','Conceitos de tecnologias e ferramentas multimídia, de reprodução de áudio e vídeo.',123),
 (124,5,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Ferramentas de produtividade e trabalho a distância','Ferramentas de produtividade e trabalho a distância: Microsoft Teams, Cisco Webex, Google Hangout, Zoom, Google Drive e Skype. (Zoom exclusivo da Caixa)','Ferramentas de produtividade e trabalho a distância (Microsoft Teams, Cisco Webex, Google Hangout, Google Drive e Skype).',124),
 (125,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Microsoft Outlook','Microsoft Outlook (ambientes Microsoft Office 365 Word, Excel, PowerPoint e Outlook).','—',125),
 (126,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Normas NBR ISO/IEC 27001:2022 e 27002:2022','Noções sobre gestão de segurança da informação: normas NBR ISO/IEC 27001:2022 e NBR ISO/IEC 27002:2022.','—',126),
 (127,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Prevenção e reação a riscos cibernéticos nos negócios','Prevenção e reação a riscos cibernéticos nos negócios.','—',127),
 (128,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Comunicação de dados e meios físicos de transmissão','Fundamentos de comunicação de dados. Meios físicos de transmissão.','—',128),
 (129,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Navegadores Web (Edge 120 e Firefox 122)','Navegadores Web (Microsoft Edge versão 120 e Mozilla Firefox versão 122).','—',129),
 (130,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Zoom','Zoom (ferramentas de produtividade e trabalho a distância).','—',130),
 (131,5,'Ciclo 2','Só Caixa','Complementos da Caixa','IA, Analytics, Blockchain, Openbanking, ML, Data Science e UC_PLAY','Noções de Inteligência Artificial, Analytics, Blochchain, Openbanking, Machine Learning, Data Science. Temáticas também trabalhadas na Trilha UC_PLAY Cultura Digital.','—',131),
 (132,5,'Ciclo 2','Só Caixa','Complementos da Caixa','IA generativa, ChatGPT, prompts, 3D, metaverso, robótica e Cloud','Noções de Inteligência artificial generativa, algorítimos, ChatGPT (transações via CHATBOT), edição de prompt, 3D, metaverso, robótica, Cloud Computing.','—',132),
 (133,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Noções de Transformação Digital','Noções de Transformação Digital;','—',133),
 (134,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Noções sobre Inovação','Noções sobre Inovação;','—',134),
 (135,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Noções sobre Líderes Digitais','Noções sobre Líderes Digitais;','—',135),
 (136,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Noções sobre Agilidade e entrega de valor ao cliente digital','Noções sobre Agilidade: o "ser digital" e a transformação das empresas; Startups e Fintechs; o paradigma ágil; o manifesto ágil, os conceitos e os valores da agilidade; O perfil de um profissional ágil; Como identificar e entregar "valor" para o cliente digital.','—',136),
 (137,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Noções sobre Open Finance','Noções sobre Open Finance;','—',137),
 (138,5,'Ciclo 2','Só Caixa','Complementos da Caixa','Noções de Compliance e LGPD (revisar Ciclo 1)','Noções de Compliance; Noções de LGPD.','—',138),
 (139,5,'Ciclo 2','Só BB','Complementos do BB','Sistemas operacionais: Windows 10 e Linux SUSE SLES 15 SP2','—','Noções de sistemas operacionais - Windows 10 (32-64 bits) e ambiente Linux (SUSE SLES 15 SP2)',139),
 (140,5,'Ciclo 2','Só BB','Complementos do BB','Proteção de estações de trabalho','—','Proteção de estações de trabalho: Controle de dispostivos USB, hardening, antimalware e firewall pessoal.',140),
 (141,5,'Ciclo 2','Só BB','Complementos do BB','Navegador Web (Edge 91 e Firefox 78 ESR)','—','Navegador Web (Microsoft Edge versão 91 e Mozilla Firefox versão 78 ESR)',141),
 (142,5,'Ciclo 2','Só BB','Complementos do BB','Fundamentos sobre análise de dados','—','Fundamentos sobre análise de dados.',142),
 (143,5,'Ciclo 2','Só BB','Complementos do BB','Conceitos de educação a distância','—','Conceitos de educação a distância.',143),
 (144,6,'Ciclo 2','Comum (Caixa + BB)','Assuntos comuns','Compreensão de textos em Língua Inglesa','Conhecimento de vocabulário fundamental e de aspectos gramaticais básicos para a compreensão de textos.','Conhecimento de um vocabulário fundamental e dos aspectos gramaticais básicos para a compreensão de textos.',144),
 (145,7,'Ciclo 2','Só Caixa','Exclusivo Caixa','1. Conceitos gerais, frequências, gráficos e tabelas','1. Conceitos gerais: variável, tipos de variáveis, população, amostra, frequências: absoluta e relativa, frequências acumuladas, representações em gráficos e tabelas (linhas, colunas, setores e histogramas).','—',145),
 (146,7,'Ciclo 2','Só Caixa','Exclusivo Caixa','2. Medidas de tendência central','2. Medidas de tendência central (em dados brutos ou agrupados em classes): média aritmética, média geométrica, média ponderada, moda e mediana.','—',146),
 (147,7,'Ciclo 2','Só Caixa','Exclusivo Caixa','3. Medidas de Posição','3. Medidas de Posição: quartis e percentis.','—',147),
 (148,7,'Ciclo 2','Só Caixa','Exclusivo Caixa','4. Medidas de dispersão','4. Medidas de dispersão (em dados brutos ou agrupados em classes): amplitude, variância, desvio padrão e coeficiente de variação.','—',148),
 (149,7,'Ciclo 2','Só Caixa','Exclusivo Caixa','5. Probabilidade e distribuição binomial','5. Probabilidade: experimento aleatório, espaço amostral, evento; espaços equiprováveis; probabilidade de Laplace; espaços não equiprováveis; teorema do produto; probabilidade condicional e independência; distribuição binomial.','—',149),
 (150,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','1. Mindset de crescimento e Paradigma da abundância','1 - Mindset de crescimento, Paradigma da abundância.','—',150),
 (151,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','2. Intraempreendedorismo','2 - Intraempreendedorismo.','—',151),
 (152,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','3. Design Thinking e Design de Serviço','3 - Design Thinking, Design de Serviço.','—',152),
 (153,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','4. Metodologias ágeis, Lean Manufacturing e SCRUM','4 - Metodologias ágeis, Lean Manufacturing, SCRUM.','—',153),
 (154,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','5. Resolução de problemas complexos, visão sistêmica e estratégica','5 - Resolução de problemas complexos, visão sistêmica e estratégica.','—',154),
 (155,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','6. Ciência de dados','6 - Ciência de dados.','—',155),
 (156,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','7. Senso colaborativo e pontos de vista divergentes','7 - Senso colaborativo e disposição para somar pontos de dista divergentes.','—',156),
 (157,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','8. Pensamento computacional','8 - Pensamento computacional.','—',157),
 (158,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','9. Análise de Negócios','9 - Análise de Negócios.','—',158),
 (159,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','10. Liderança, autoliderança e liderança de equipes','10 - Liderança, autoliderança e liderança de equipes.','—',159),
 (160,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','11. Autodesenvolvimento','11 - Autodesenvolvimento.','—',160),
 (161,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','12. Experiência do consumidor (Customer experience)','12 - Experiência do consumidor (Customer experience).','—',161),
 (162,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','13. Inteligência emocional','13 - Inteligência emocional,','—',162),
 (163,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','14. Desenvolvimento sustentável (Pacto global e ODS)','14 - Desenvolvimento sustentável (Pacto global e Objetivos de Desenvolvimento Sustentável - ODS),','—',163),
 (164,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','15. Objetivos-chaves para resultados (OKR)','15 - Objetivos-chaves para resultados (OKR).','—',164),
 (165,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','16. Gestão do tempo e produtividade','16 - Gestão do tempo e produtividade.','—',165),
 (166,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','17. Técnicas e boas práticas para o trabalho à distância','17 - Técnicas e boas práticas para o trabalho à distância.','—',166),
 (167,8,'Ciclo 2','Só Caixa','Exclusivo Caixa','18. Aprender a aprender e Aprendizagem contínua (Life long learning)','18 - Aprender a aprender e Aprendizagem contínua (Life long learning).','—',167),
 (168,9,'Ciclo 2','Só Caixa','Complementos da Caixa','Resolução CVM 50/2021 (Prevenção à lavagem de dinheiro)','Resolução CVM 50/2021 (complemento do item 1: Prevenção à lavagem de dinheiro).','—',168),
 (169,9,'Ciclo 2','Só Caixa','Complementos da Caixa','Conceitos e medidas de enfrentamento ao assédio moral e sexual','Conceitos e medidas de enfrentamento ao assédio moral e sexual.','—',169),
 (170,9,'Ciclo 2','Só Caixa','Complementos da Caixa','Código de Ética, Conduta e integridade (CAIXA)','Código de Ética, Conduta e integridade (disponível no sítio da CAIXA na internet).','—',170),
 (171,9,'Ciclo 2','Só Caixa','Complementos da Caixa','Artigo 37 da Constituição Federal (Princípios da Adm. Pública)','Artigo 37 da Constituição Federal (Princípios constitucionais da Administração Pública: Princípios da legalidade, impessoalidade, moralidade, publicidade e eficiência).','—',171),
 (172,9,'Ciclo 2','Só Caixa','Complementos da Caixa','Política de Responsabilidade Socioambiental da Caixa','Política de Responsabilidade Socioambiental da Caixa Econômica Federal (disponível no sítio da CAIXA na internet).','—',172),
 (173,9,'Ciclo 2','Só Caixa','Complementos da Caixa','Boas práticas de governança corporativa','Boas práticas de governança corporativa.','—',173),
 (174,10,'Ciclo 2','Só BB','Exclusivo BB','1. Números inteiros, racionais e reais; problemas de contagem','—','1 - Números inteiros, racionais e reais; problemas de contagem.',174),
 (175,10,'Ciclo 2','Só BB','Exclusivo BB','2. Sistema legal de medidas','—','2 - Sistema legal de medidas.',175),
 (176,10,'Ciclo 2','Só BB','Exclusivo BB','3. Razões, proporções, divisão proporcional, regra de três e porcentagens','—','3 - Razões e proporções; divisão proporcional; regras de três simples e compostas; porcentagens.',176),
 (177,10,'Ciclo 2','Só BB','Exclusivo BB','4. Lógica proposicional','—','4 - Lógica proposicional.',177),
 (178,10,'Ciclo 2','Só BB','Exclusivo BB','5. Noções de conjuntos','—','5 - Noções de conjuntos.',178),
 (179,10,'Ciclo 2','Só BB','Exclusivo BB','6. Relações e funções (polinomiais, exponenciais e logarítmicas)','—','6 - Relações e funções; Funções polinomiais; Funções exponenciais e logarítmicas.',179),
 (180,10,'Ciclo 2','Só BB','Exclusivo BB','7. Matrizes','—','7 - Matrizes.',180),
 (181,10,'Ciclo 2','Só BB','Exclusivo BB','8. Determinantes','—','8 - Determinantes.',181),
 (182,10,'Ciclo 2','Só BB','Exclusivo BB','9. Sistemas lineares','—','9 - Sistemas lineares.',182),
 (183,10,'Ciclo 2','Só BB','Exclusivo BB','10. Sequências','—','10 - Sequências.',183),
 (184,10,'Ciclo 2','Só BB','Exclusivo BB','11. Progressões aritméticas e progressões geométricas','—','11 - Progressões aritméticas e progressões geométricas.',184)
ON CONFLICT(id) DO UPDATE SET
materia_numero=excluded.materia_numero,ciclo=excluded.ciclo,escopo=excluded.escopo,
bloco_ordem=excluded.bloco_ordem,topico_central=excluded.topico_central,
nomenclatura_caixa=excluded.nomenclatura_caixa,nomenclatura_bb=excluded.nomenclatura_bb,
ordem_exibicao=excluded.ordem_exibicao;

-- Fonte literal do BNB (126 itens): criação idempotente das tabelas, políticas e seed.
create table if not exists public.edital_bnb_materias (
  numero integer primary key check (numero between 101 and 103),
  titulo_central text not null,
  categoria text not null check (categoria in ('basica','especifica'))
);
create table if not exists public.edital_bnb_assuntos (
  id integer primary key check (id between 1001 and 1126),
  materia_numero integer not null references public.edital_bnb_materias(numero),
  numero_edital text not null,
  topico_central text not null,
  ordem_exibicao integer not null
);
create index if not exists edital_bnb_assuntos_materia_idx on public.edital_bnb_assuntos(materia_numero,ordem_exibicao);
alter table public.edital_bnb_materias enable row level security;
alter table public.edital_bnb_assuntos enable row level security;
drop policy if exists "edital_bnb_materias_leitura" on public.edital_bnb_materias;
create policy "edital_bnb_materias_leitura" on public.edital_bnb_materias for select to authenticated using (true);
drop policy if exists "edital_bnb_assuntos_leitura" on public.edital_bnb_assuntos;
create policy "edital_bnb_assuntos_leitura" on public.edital_bnb_assuntos for select to authenticated using (true);
insert into public.edital_bnb_materias(numero,titulo_central,categoria) values
 (101,'Língua Portuguesa','basica'),
 (102,'Matemática/Raciocínio Lógico e Quantitativo','basica'),
 (103,'Conhecimentos Bancários','especifica')
on conflict(numero) do update set titulo_central=excluded.titulo_central,categoria=excluded.categoria;
insert into public.edital_bnb_assuntos(id,materia_numero,numero_edital,topico_central,ordem_exibicao) values
 (1001,101,'1','Compreensão e interpretação de textos de gêneros variados',1),
 (1002,101,'2','Reconhecimento de tipos e gêneros textuais',2),
 (1003,101,'3','Domínio da ortografia oficial',3),
 (1004,101,'4','Domínio dos mecanismos de coesão textual',4),
 (1005,101,'4.1','Emprego de elementos de referenciação, substituição e repetição, de conectores e de outros elementos de sequenciação textual',5),
 (1006,101,'4.2','Emprego de tempos e modos verbais',6),
 (1007,101,'5','Domínio da estrutura morfossintática do período',7),
 (1008,101,'5.1','Emprego das classes de palavras',8),
 (1009,101,'5.2','Relações de coordenação entre orações e entre termos da oração',9),
 (1010,101,'5.3','Relações de subordinação entre orações e entre termos da oração',10),
 (1011,101,'5.4','Emprego dos sinais de pontuação',11),
 (1012,101,'5.5','Concordância verbal e nominal',12),
 (1013,101,'5.6','Regência verbal e nominal',13),
 (1014,101,'5.7','Emprego do sinal indicativo de crase',14),
 (1015,101,'5.8','Colocação dos pronomes átonos',15),
 (1016,101,'6','Reescrita de frases e parágrafos do texto',16),
 (1017,101,'6.1','Significação das palavras',17),
 (1018,101,'6.2','Substituição de palavras ou de trechos de texto',18),
 (1019,101,'6.3','Reorganização da estrutura de orações e de períodos do texto',19),
 (1020,101,'6.4','Reescrita de textos de diferentes gêneros e níveis de formalidade',20),
 (1021,102,'1','Números reais: operações (adição, subtração, multiplicação, divisão, radiciação e potenciação); expressões numéricas; múltiplos e divisores; máximo divisor comum e mínimo múltiplo comum; problemas',1),
 (1022,102,'2','Proporcionalidade: razões e proporções; divisão em partes diretamente e inversamente proporcionais; médias aritmética, geométrica e ponderada; regras de três simples e composta; porcentagem; problemas',2),
 (1023,102,'3','Funções, equações e inequações de 1º e de 2º graus, exponenciais e logarítmicas: conceito, representação gráfica, problemas',3),
 (1024,102,'4','Sistemas lineares',4),
 (1025,102,'5','Análise combinatória e probabilidade: princípios fundamentais de contagem, arranjos, permutações, combinações, binômio de Newton, cálculo de probabilidades',5),
 (1026,102,'6','Matemática financeira',6),
 (1027,102,'6.1','Juros simples e compostos: capitalização e descontos',7),
 (1028,102,'6.2','Taxas de juros: nominal, efetiva, equivalentes, proporcionais, real e aparente',8),
 (1029,102,'6.3','Planos ou sistemas de amortização de empréstimos e financiamentos',9),
 (1030,102,'6.4','Cálculo financeiro: custo real efetivo de operações de financiamento, empréstimo e investimento',10),
 (1031,102,'6.5','Taxas de retorno',11),
 (1032,103,'1','Sistema Financeiro Nacional',1),
 (1033,103,'1.1','Instituições do Sistema Financeiro Nacional - tipos, finalidades e atuação',2),
 (1034,103,'1.2','Banco Central do Brasil e Conselho Monetário Nacional - funções e atividades',3),
 (1035,103,'1.3','Instituições Financeiras Oficiais Federais - papel e atuação',4),
 (1036,103,'2','Operações de Crédito Bancário',5),
 (1037,103,'2.1','Cadastro de pessoas físicas',6),
 (1038,103,'2.2','Cadastro de pessoas jurídicas',7),
 (1039,103,'2.2.1','Tipos e constituição das pessoas',8),
 (1040,103,'2.2.2','Composição societária/acionária',9),
 (1041,103,'2.2.3','Forma de tributação',10),
 (1042,103,'2.2.4','Mandatos e procurações',11),
 (1043,103,'2.3','Fundamentos do crédito',12),
 (1044,103,'2.3.1','Conceito de crédito',13),
 (1045,103,'2.3.2','Elementos do crédito',14),
 (1046,103,'2.3.3','Requisitos do crédito',15),
 (1047,103,'2.4','Riscos da atividade bancária',16),
 (1048,103,'2.4.1','De crédito',17),
 (1049,103,'2.4.2','De mercado',18),
 (1050,103,'2.4.3','Operacional',19),
 (1051,103,'2.4.4','Sistêmico',20),
 (1052,103,'2.4.5','De liquidez',21),
 (1053,103,'2.5','Principais variáveis relacionadas ao risco de crédito',22),
 (1054,103,'2.5.1','Clientes',23),
 (1055,103,'2.5.2','Operação',24),
 (1056,103,'2.6','Tipos de operações de crédito bancário (empréstimos, descontos, financiamentos e adiantamentos)',25),
 (1057,103,'2.7','Operações de Crédito Geral',26),
 (1058,103,'2.7.1','Crédito pessoal e Crédito Direto ao Consumidor',27),
 (1059,103,'2.7.2','Desconto de duplicatas, notas promissórias e cheques pré-datados',28),
 (1060,103,'2.7.3','Contas garantidas',29),
 (1061,103,'2.7.4','Capital de giro',30),
 (1062,103,'2.7.5','Cartão de crédito',31),
 (1063,103,'2.7.6','Microcrédito urbano',32),
 (1064,103,'2.8','Operações de Crédito Especializado',33),
 (1065,103,'2.8.1','Crédito Rural',34),
 (1066,103,'2.8.1.1','Conceito, beneficiários, preceitos e funções básicas',35),
 (1067,103,'2.8.1.2','Finalidades: operações de investimento, custeio e comercialização',36),
 (1068,103,'2.8.1.3','Programa Nacional de Fortalecimento da Agricultura Familiar (PRONAF): base legal, finalidades, beneficiários, destinação, condições',37),
 (1069,103,'2.8.2','Crédito industrial, agroindustrial, para o comércio e para a prestação de serviços: conceito, finalidades (investimento fixo e capital de giro associado), beneficiários',38),
 (1070,103,'2.9','Recursos utilizados na contratação de financiamentos',39),
 (1071,103,'2.9.1','Fundo Constitucional de Financiamento do Nordeste (FNE): base legal, finalidades, regras, administração',40),
 (1072,103,'2.9.2','BNDES/FINAME: base legal, finalidade, regras, forma de atuação',41),
 (1073,103,'2.9.3','Fundo de Amparo ao Trabalhador (FAT): base legal, finalidades, regras, forma de atuação',42),
 (1074,103,'2.10','Microfinanças: base legal, finalidade, forma de atuação',43),
 (1075,103,'3','Serviços bancários e financeiros',44),
 (1076,103,'3.1','Conta corrente: abertura, manutenção, encerramento, pagamento, devolução de cheques e cadastro de emitentes de cheques sem fundos (CCF)',45),
 (1077,103,'3.2','Depósitos à vista',46),
 (1078,103,'3.3','Depósitos a prazo (CDB e RDB)',47),
 (1079,103,'3.4','Fundos de Investimentos',48),
 (1080,103,'3.5','Caderneta de poupança',49),
 (1081,103,'3.6','Títulos de capitalização',50),
 (1082,103,'3.7','Planos de aposentadoria e de previdência privados',51),
 (1083,103,'3.8','Seguros',52),
 (1084,103,'3.9','Convênios de arrecadação/pagamentos (concessionárias de serviços públicos, tributos, INSS e folha de pagamento de clientes)',53),
 (1085,103,'3.10','Serviço de Compensação de Cheque e Outros Papéis',54),
 (1086,103,'3.11','Cobrança',55),
 (1087,103,'3.12','Sistema de Pagamentos Brasileiro (SPB)',56),
 (1088,103,'4','Aspectos jurídicos',57),
 (1089,103,'4.1','Noções de direito aplicadas às operações de crédito',58),
 (1090,103,'4.1.1','Sujeito e Objeto do Direito',59),
 (1091,103,'4.1.2','Fato e ato jurídico',60),
 (1092,103,'4.1.3','Contratos: conceito de contrato, requisitos dos contratos, classificação dos contratos; contratos nominados, contratos de compra e venda, empréstimo, sociedade, fiança, contratos formais e informais',61),
 (1093,103,'4.2','Instrumentos de formalização das operações de crédito',62),
 (1094,103,'4.2.1','Contratos por instrumento público e particular',63),
 (1095,103,'4.2.2','Cédulas e notas de crédito',64),
 (1096,103,'4.3','Garantias',65),
 (1097,103,'4.3.1','Fidejussórias: fiança e aval',66),
 (1098,103,'4.3.2','Reais: hipoteca e penhor',67),
 (1099,103,'4.3.3','Alienação fiduciária de bens móveis',68),
 (1100,103,'4.4','Títulos de Crédito - nota promissória, duplicata, cheque',69),
 (1101,103,'5','O Banco do Nordeste do Brasil S.A.: legislação básica, programas e informações gerais de sua atuação como agente impulsionador do desenvolvimento sustentável da região nordeste',70),
 (1102,103,'6','Ética aplicada: ética, moral, valores e virtudes',71),
 (1103,103,'6.1','noções de ética empresarial e profissional',72),
 (1104,103,'6.2','A gestão da ética nas empresas públicas e privadas',73),
 (1105,103,'6.3','Código de Conduta Ética e Integridade do Banco do Nordeste do Brasil (disponível na página do BNB na internet)',74),
 (1106,103,'7','Política de Responsabilidade Socioambiental do Banco do Nordeste do Brasil (disponível na página do BNB na internet)',75),
 (1107,103,'8','Estratégia ASG (Ambiental, Social e Governança): Estratégia de sustentabilidade do Banco do Nordeste do Brasil (disponível na página do BNB na internet)',76),
 (1108,103,'9','Atualidades do mercado financeiro',77),
 (1109,103,'9.1','Os bancos na Era Digital: Atualidade, tendências e desafios',78),
 (1110,103,'9.2','Internet banking',79),
 (1111,103,'9.3','Mobile banking',80),
 (1112,103,'9.4','Open banking',81),
 (1113,103,'9.5','Novos modelos de negócios',82),
 (1114,103,'9.6','Fintechs, startups e big techs',83),
 (1115,103,'9.7','Sistema de bancos sombra (Shadow banking)',84),
 (1116,103,'9.8','Funções da moeda',85),
 (1117,103,'9.9','O dinheiro na era digital: blockchain, bitcoin e demais criptomoedas',86),
 (1118,103,'9.10','Marketplace',87),
 (1119,103,'9.11','Correspondentes bancários',88),
 (1120,103,'9.12','Arranjos de pagamentos',89),
 (1121,103,'9.13','Sistema de pagamentos instantâneos (PIX)',90),
 (1122,103,'9.14','Segmentação e interações digitais',91),
 (1123,103,'9.15','Transformação digital no Sistema Financeiro',92),
 (1124,103,'9.16','Lei Geral de Proteção de Dados (LGPD): Lei nº 13.709, de 14 de agosto de 2018 e suas alterações',93),
 (1125,103,'9.17','Legislação anticorrupção: Lei nº 12.846/2013 e Decreto nº 11.129 de 11/07/2022',94),
 (1126,103,'9.18','Segurança cibernética: Resolução CMN nº 4.893, de 26/02/2021',95)
on conflict(id) do update set
 materia_numero=excluded.materia_numero,numero_edital=excluded.numero_edital,
 topico_central=excluded.topico_central,ordem_exibicao=excluded.ordem_exibicao;

-- Temas equivalentes em exame manual. Nunca mapear só pela semelhança de palavras.
CREATE TABLE IF NOT EXISTS public.edital_equivalencias_bnb (
  bnb_assunto_id integer PRIMARY KEY REFERENCES public.edital_bnb_assuntos(id),
  assunto_canonico_id integer NOT NULL REFERENCES public.edital_assuntos(id),
  justificativa text NOT NULL DEFAULT 'Conteúdo equivalente confirmado no edital',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS edital_equivalencias_bnb_canonico_idx
  ON public.edital_equivalencias_bnb(assunto_canonico_id);
ALTER TABLE public.edital_equivalencias_bnb ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "edital_equivalencias_bnb_leitura" ON public.edital_equivalencias_bnb;
CREATE POLICY "edital_equivalencias_bnb_leitura" ON public.edital_equivalencias_bnb
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.edital_equivalencias_bnb TO authenticated;
INSERT INTO public.edital_equivalencias_bnb(bnb_assunto_id,assunto_canonico_id)
VALUES
 (1001,58),
 (1003,59),
 (1012,63),
 (1013,64),
 (1014,60),
 (1015,65),
 (1024,182),
 (1032,1),
 (1087,46),
 (1109,3),
 (1112,5),
 (1113,6),
 (1114,7),
 (1115,8),
 (1116,51),
 (1117,9),
 (1118,52),
 (1119,10),
 (1120,53),
 (1121,11),
 (1122,54),
 (1123,12),
 (1124,30),
 (1125,31),
 (1126,32)
ON CONFLICT(bnb_assunto_id) DO UPDATE SET
assunto_canonico_id=excluded.assunto_canonico_id;

-- Permite os dois assuntos BB restaurados no antigo progresso manual, sem mudar linhas históricas.
ALTER TABLE public.edital_progresso_usuario
  DROP CONSTRAINT IF EXISTS edital_progresso_usuario_assunto_id_check;
ALTER TABLE public.edital_progresso_usuario
  ADD CONSTRAINT edital_progresso_usuario_assunto_id_check
  CHECK (assunto_id BETWEEN 1 AND 184);

ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS edital_assunto_id integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS edital_assunto_id integer;

-- Backfill de IDs BNB já salvos, sem apagar qualquer sessão/revisão.
UPDATE public.study_sessions s SET edital_assunto_id=e.assunto_canonico_id
FROM public.edital_equivalencias_bnb e
WHERE s.edital_assunto_id=e.bnb_assunto_id;
UPDATE public.reviews r SET edital_assunto_id=e.assunto_canonico_id
FROM public.edital_equivalencias_bnb e
WHERE r.edital_assunto_id=e.bnb_assunto_id;

-- Valida e canonicaliza novos registros, para impedir ligações órfãs.
CREATE OR REPLACE FUNCTION public.edital_validar_assunto_canonico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE canonical integer;
BEGIN
  IF NEW.edital_assunto_id IS NULL THEN RETURN NEW; END IF;
  SELECT assunto_canonico_id INTO canonical
    FROM public.edital_equivalencias_bnb
    WHERE bnb_assunto_id=NEW.edital_assunto_id;
  IF canonical IS NOT NULL THEN NEW.edital_assunto_id:=canonical; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.edital_assuntos WHERE id=NEW.edital_assunto_id)
     AND NOT EXISTS (SELECT 1 FROM public.edital_bnb_assuntos WHERE id=NEW.edital_assunto_id)
  THEN
    RAISE EXCEPTION 'edital_assunto_id % inexistente nos catálogos',NEW.edital_assunto_id
      USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.edital_validar_assunto_canonico() FROM PUBLIC;
DROP TRIGGER IF EXISTS edital_validar_assunto_sessao ON public.study_sessions;
CREATE TRIGGER edital_validar_assunto_sessao
BEFORE INSERT OR UPDATE OF edital_assunto_id ON public.study_sessions
FOR EACH ROW EXECUTE FUNCTION public.edital_validar_assunto_canonico();
DROP TRIGGER IF EXISTS edital_validar_assunto_revisao ON public.reviews;
CREATE TRIGGER edital_validar_assunto_revisao
BEFORE INSERT OR UPDATE OF edital_assunto_id ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.edital_validar_assunto_canonico();

-- Auditoria: aborte toda a transação se algo ficou incompleto.
DO $$
DECLARE total_bb int; total_bnb int; total_mapeado int;
BEGIN
  SELECT count(*) INTO total_bb FROM public.edital_assuntos;
  SELECT count(*) INTO total_bnb FROM public.edital_bnb_assuntos;
  SELECT count(*) INTO total_mapeado FROM public.edital_equivalencias_bnb;
  IF total_bb<>184 OR total_bnb<>126 OR total_mapeado<>25 THEN
    RAISE EXCEPTION 'Falha na auditoria: BB/Caixa %, BNB %, equivalências %; esperado 184,126,25',
      total_bb,total_bnb,total_mapeado;
  END IF;
  IF EXISTS(SELECT 1 FROM public.study_sessions s WHERE s.edital_assunto_id IS NOT NULL
     AND NOT EXISTS(SELECT 1 FROM public.edital_assuntos a WHERE a.id=s.edital_assunto_id)
     AND NOT EXISTS(SELECT 1 FROM public.edital_bnb_assuntos b WHERE b.id=s.edital_assunto_id))
  THEN RAISE EXCEPTION 'Sessões vinculadas a edital_assunto_id órfão; revisar antes do commit'; END IF;
  IF EXISTS(SELECT 1 FROM public.reviews r WHERE r.edital_assunto_id IS NOT NULL
     AND NOT EXISTS(SELECT 1 FROM public.edital_assuntos a WHERE a.id=r.edital_assunto_id)
     AND NOT EXISTS(SELECT 1 FROM public.edital_bnb_assuntos b WHERE b.id=r.edital_assunto_id))
  THEN RAISE EXCEPTION 'Revisões vinculadas a edital_assunto_id órfão; revisar antes do commit'; END IF;
END $$;

COMMIT;

-- Distribuição por interseção (285 temas visuais; preservando 310 registros-fonte).
WITH base AS (
  SELECT a.id AS canonical,
    (a.escopo<>'Só BB') AS caixa, (a.escopo<>'Só Caixa') AS bb,
    EXISTS(SELECT 1 FROM public.edital_equivalencias_bnb e WHERE e.assunto_canonico_id=a.id) AS bnb
  FROM public.edital_assuntos a
  UNION ALL
  SELECT b.id,false,false,true
  FROM public.edital_bnb_assuntos b
  WHERE NOT EXISTS (SELECT 1 FROM public.edital_equivalencias_bnb e WHERE e.bnb_assunto_id=b.id)
)
SELECT
  CASE WHEN bb AND caixa AND bnb THEN 'BB + Caixa + BNB'
       WHEN bb AND caixa THEN 'BB + Caixa'
       WHEN bb AND bnb THEN 'BB + BNB'
       WHEN caixa AND bnb THEN 'Caixa + BNB'
       WHEN bb THEN 'Só BB'
       WHEN caixa THEN 'Só Caixa'
       ELSE 'Só BNB' END AS escopo,
  count(*) AS temas_unificados
FROM base GROUP BY 1 ORDER BY 1;

-- Relevante: revisões agendadas anteriormente em duplicidade são apenas diagnosticadas,
-- NÃO marcadas como feitas nem excluídas.
SELECT user_id,edital_assunto_id,layer,count(*) AS pendencias_repetidas
FROM public.reviews WHERE edital_assunto_id IS NOT NULL AND done=false
GROUP BY user_id,edital_assunto_id,layer HAVING count(*)>1;
