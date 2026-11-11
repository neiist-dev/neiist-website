-- Entry point. Running this file alone fully bootstraps the DB.
-- Files are loaded in dependency order: a file may only reference objects
-- from lower-numbered files (function bodies excepted).
SET check_function_bodies = off;

\ir schema/00_core.sql
\ir schema/10_users.sql
\ir schema/20_activities.sql
\ir schema/30_voting.sql
\ir schema/40_shop.sql
\ir schema/45_activity_sign_ups.sql
\ir schema/50_game.sql
\ir schema/99_grants.sql
