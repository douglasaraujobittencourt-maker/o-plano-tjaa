-- Edital verticalizado Caixa TBN / BB Agente Comercial
-- Execute no SQL Editor do Supabase antes de habilitar sincronização entre dispositivos.
create table if not exists public.edital_materias (
  numero integer primary key check (numero between 1 and 10),
  secao_ordem text not null,
  titulo_central text not null,
  nomenclatura_caixa text not null default '',
  nomenclatura_bb text not null default '',
  ciclo text not null check (ciclo in ('Ciclo 1','Ciclo 2')),
  escopo text not null check (escopo in ('Comum (Caixa + BB)','Só Caixa','Só BB')),
  status_materia text not null default '⬜ Pendente' check (status_materia in ('⬜ Pendente','🔄 Em estudo','✅ Concluído'))
);
create table if not exists public.edital_assuntos (
  id integer primary key,
  materia_numero integer not null references public.edital_materias(numero) on delete cascade,
  ciclo text not null check (ciclo in ('Ciclo 1','Ciclo 2')),
  escopo text not null check (escopo in ('Comum (Caixa + BB)','Só Caixa','Só BB')),
  bloco_ordem text not null default '',
  topico_central text not null,
  nomenclatura_caixa text not null default '',
  nomenclatura_bb text not null default '',
  ordem_exibicao integer not null
);
create table if not exists public.edital_progresso_usuario (
  user_id uuid not null references auth.users(id) on delete cascade,
  assunto_id integer not null check (assunto_id between 1 and 182),
  status text not null default '⬜ Pendente' check (status in ('⬜ Pendente','🔄 Em estudo','✅ Concluído')),
  teoria_concluida boolean not null default false,
  data_conclusao_teoria date,
  revisao_7d boolean not null default false,
  revisao_15d boolean not null default false,
  revisao_30d boolean not null default false,
  revisao_60d boolean not null default false,
  questoes_resolvidas integer not null default 0 check (questoes_resolvidas >= 0),
  acertos integer not null default 0 check (acertos >= 0 and acertos <= questoes_resolvidas),
  updated_at timestamptz not null default now(),
  primary key (user_id, assunto_id)
);
create index if not exists edital_assuntos_materia_idx on public.edital_assuntos (materia_numero, ordem_exibicao);
create index if not exists edital_progresso_usuario_user_idx on public.edital_progresso_usuario (user_id);
alter table public.edital_materias enable row level security;
alter table public.edital_assuntos enable row level security;
alter table public.edital_progresso_usuario enable row level security;
drop policy if exists "edital_materias_leitura" on public.edital_materias;
create policy "edital_materias_leitura" on public.edital_materias for select to authenticated using (true);
drop policy if exists "edital_assuntos_leitura" on public.edital_assuntos;
create policy "edital_assuntos_leitura" on public.edital_assuntos for select to authenticated using (true);
drop policy if exists "edital_progresso_proprio_select" on public.edital_progresso_usuario;
create policy "edital_progresso_proprio_select" on public.edital_progresso_usuario for select to authenticated using (auth.uid() = user_id);
drop policy if exists "edital_progresso_proprio_insert" on public.edital_progresso_usuario;
create policy "edital_progresso_proprio_insert" on public.edital_progresso_usuario for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "edital_progresso_proprio_update" on public.edital_progresso_usuario;
create policy "edital_progresso_proprio_update" on public.edital_progresso_usuario for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "edital_progresso_proprio_delete" on public.edital_progresso_usuario;
create policy "edital_progresso_proprio_delete" on public.edital_progresso_usuario for delete to authenticated using (auth.uid() = user_id);
-- Importação do catálogo é administrativa: o app não permite inserções públicas de matérias/assuntos.
-- Importe o conteúdo da planilha via SQL Editor ou Supabase Table Editor com credenciais administrativas.