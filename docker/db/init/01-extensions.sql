-- Extensiones exigidas por el documento de arquitectura (seccion 4.4.1):
-- btree_gist habilita la restriccion de exclusion que impide que los tramos
-- de un mismo usuario se solapen. pgcrypto entrega gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET TIME ZONE 'UTC';
