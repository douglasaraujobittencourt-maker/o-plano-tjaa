# Edital Verticalizado — Caixa TBN + Banco do Brasil Agente Comercial

## Acesso
Faça login no O Plano e abra **6 - Edital Verticalizado** (`/app/edital`).
O catálogo oficial da planilha fornecida está embutido no frontend e carrega automaticamente: 10 matérias, 182 assuntos (113 no Ciclo 1; 69 no Ciclo 2; 76 comuns, 83 Caixa, 23 BB).

## Funcionalidades
- Painel com 7 KPIs, tabela de matérias, barras e progresso por escopo.
- Checklist por ciclo e matéria, texto comparativo de editais, filtros e busca.
- Três status, teoria e revisões (7/15/30/60 dias), data de conclusão, questões e acertos.
- Check da matéria com confirmação; atualizações imediatas da interface.
- Reimportação opcional do XLSX original ou de CSV exportado da aba "Edital Verticalizado".

## Persistência e privacidade
O checklist é salvo imediatamente em localStorage por ID do usuário autenticado. Para sincronizar entre dispositivos, execute a migração SQL em `supabase/migrations/20261118000000_edital_caixa_bb.sql` no SQL Editor do projeto Supabase. A migração cria `edital_materias`, `edital_assuntos` e `edital_progresso_usuario`. RLS restringe o progresso ao próprio usuário.

**Importante:** subir o arquivo SQL ao GitHub não executa automaticamente a migração no banco de dados. Só após executá-la haverá sincronização cloud. Até lá o app exibe "Salvo neste navegador". Não compartilhe a service role key no frontend.

## Catálogo no banco de dados (opcional)
Os 10 registros e 182 assuntos já estão embutidos no código para leitura por todos. Caso também deseje persistir as tabelas de catálogo, importe via Supabase Table Editor dois CSVs com colunas compatíveis com o schema:
- Materias: `numero,secao_ordem,titulo_central,nomenclatura_caixa,nomenclatura_bb,ciclo,escopo`
- Assuntos: `id,materia_numero,ciclo,escopo,bloco_ordem,topico_central,nomenclatura_caixa,nomenclatura_bb,ordem_exibicao`

Não há permissões públicas de escrita nos catálogos; faça a importação como administrador. O progresso dos alunos fica na tabela específica.

## Teste
1. Faça login, abra o painel e confira total de 182 assuntos.
2. Expanda a primeira matéria, altere o status e marque Teoria.
3. Atualize a página: os indicadores, revisões e questões devem persistir.
4. Com a migração aplicada, faça login com a mesma conta em outro dispositivo e confira sincronização.
5. Com contas diferentes, os progressos não devem ser compartilhados.
