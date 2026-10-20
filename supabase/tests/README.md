# Database tests

Runs the migration + seed on a plain PostgreSQL 15/16 with a small stand-in for
Supabase's `auth`, `storage` and roles, then checks RLS and the order/repair functions.

```bash
createdb shop_test
psql -d shop_test -f supabase/tests/supabase_stub.sql
psql -d shop_test -f supabase/migrations/20261019000000_init.sql
psql -d shop_test -f supabase/seed.sql
psql -d shop_test -f supabase/tests/tests.sql   # every line should say PASS
dropdb shop_test
```
Run on a fresh database each time (the fixtures insert fixed IDs).
