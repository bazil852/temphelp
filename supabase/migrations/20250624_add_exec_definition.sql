-- supabase/migrations/20250624_add_exec_definition.sql
alter table workflows
  add column if not exists board_data jsonb default '{}',
  add column if not exists exec_definition jsonb,
  add column if not exists version integer default 1;

comment on column workflows.board_data is
  'React-Flow board data (moved from workflow_data table)';

comment on column workflows.exec_definition is
  'Ready-to-run workflow json (see boardToExec())';

comment on column workflows.version is
  'autoincrementing on every save'; 