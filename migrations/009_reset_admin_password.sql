-- One-shot: user forgot the admin password and asked for a reset. Clearing the stored
-- hash (and the session signing key, so any old session cookie is invalidated too) makes
-- the server treat the next login attempt as first-time setup — it hashes whatever
-- password is typed and stores that as the new one. This file is removed from the
-- migration list again right after the reset ships, so it only ever runs once.
DELETE FROM site_config WHERE `key` IN ('admin_password_scrypt', 'admin_session_secret');
