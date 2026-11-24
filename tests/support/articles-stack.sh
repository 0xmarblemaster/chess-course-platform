#!/usr/bin/env bash
# Local stack for the articles tests: Postgres 16 (+ the articles migration), PostgREST and the
# Supabase stub, then `next dev` on :3917 pointed at them. Nothing touches the real database.
#   bash tests/support/articles-stack.sh start   # env for the tests → /tmp/articles-stack/env
#   bash tests/support/articles-stack.sh stop
# Needs: /usr/lib/postgresql/16/bin, a postgrest binary ($POSTGREST or on PATH).
set -euo pipefail
cd "$(dirname "$0")/../.."
DIR=/tmp/articles-stack
PG=/usr/lib/postgresql/16/bin
PGPORT=55433
PGRST=${POSTGREST:-$(command -v postgrest || echo /tmp/aa-tools/postgrest)}
APP_PORT=${APP_PORT:-3917}
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }

stop() {
  for p in next pgrst stub; do [ -f $DIR/$p.pid ] && kill "$(cat $DIR/$p.pid)" 2>/dev/null || true; rm -f $DIR/$p.pid; done
  fuser -k "$APP_PORT/tcp" 54390/tcp 54391/tcp >/dev/null 2>&1 || true
  [ -d $DIR/pg ] && as_pg "$PG/pg_ctl -D $DIR/pg -m fast stop" >/dev/null 2>&1 || true
}

wait_for() { for _ in $(seq 1 "${2:-60}"); do curl -s -o /dev/null "$1" && return 0; sleep 1; done; echo "timeout waiting for $1"; exit 1; }

start() {
  stop
  rm -rf $DIR && mkdir -p $DIR/storage && chmod 777 $DIR
  as_pg "$PG/initdb -D $DIR/pg -A trust -U postgres" >$DIR/initdb.log
  as_pg "$PG/pg_ctl -D $DIR/pg -o '-p $PGPORT -k $DIR' -l $DIR/pg.log -w start" >/dev/null
  local psql="psql -q -v ON_ERROR_STOP=1 -h 127.0.0.1 -p $PGPORT -U postgres -d postgres"
  $psql -f tests/support/articles-bootstrap.sql
  $psql -f supabase/migrations/20261124_articles.sql
  $psql -c "insert into public.users (id, email, role, can_manage_articles) values
    ('00000000-0000-4000-8000-00000000a001', 'admin@articles.test', 'admin', false),
    ('00000000-0000-4000-8000-00000000a002', 'student@articles.test', 'student', false),
    ('00000000-0000-4000-8000-00000000a003', 'legacy-admin@articles.test', 'admin', false),
    ('00000000-0000-4000-8000-00000000a004', 'coach@articles.test', 'coach', true),
    ('00000000-0000-4000-8000-00000000a005', 'noflag-admin@articles.test', 'student', false)"
  # Chess Empire DB's permission check (src/lib/articles/auth.ts, dashboard migration 106).
  $psql -c "create table public.user_roles (user_id uuid not null, role text not null,
      can_manage_articles boolean not null default false, created_at timestamptz default now());
    insert into public.user_roles (user_id, role, can_manage_articles) values
      ('00000000-0000-4000-8000-00000000a001', 'admin', true),
      ('00000000-0000-4000-8000-00000000a004', 'coach', true),
      ('00000000-0000-4000-8000-00000000a005', 'admin', false)"

  node tests/support/supabase-stub.mjs --env > $DIR/env
  set -a; . $DIR/env; set +a
  cat > $DIR/pgrst.conf <<EOF
db-uri = "postgres://authenticator@127.0.0.1:$PGPORT/postgres"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$PGRST_JWT_SECRET"
server-port = 54391
EOF
  setsid nohup "$PGRST" $DIR/pgrst.conf >$DIR/pgrst.log 2>&1 & echo $! > $DIR/pgrst.pid
  STUB_STORAGE_DIR=$DIR/storage setsid nohup node tests/support/supabase-stub.mjs >$DIR/stub.log 2>&1 & echo $! > $DIR/stub.pid
  wait_for http://127.0.0.1:54391/ 30
  wait_for http://127.0.0.1:54390/ 30
  setsid nohup npx next dev -p "$APP_PORT" >$DIR/next.log 2>&1 & echo $! > $DIR/next.pid
  wait_for "http://127.0.0.1:$APP_PORT/api/articles?limit=1" 120
  echo "ARTICLES_BASE=http://127.0.0.1:$APP_PORT" >> $DIR/env
  echo "ARTICLES_STACK_PG=postgres://postgres@127.0.0.1:$PGPORT/postgres" >> $DIR/env
  echo "stack up: app http://127.0.0.1:$APP_PORT, env in $DIR/env"
}

"${1:-start}"
