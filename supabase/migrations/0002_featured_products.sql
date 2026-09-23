-- =========================================================
-- B&R Recreación e Inflables — destacados y categoría de producto
-- =========================================================

-- Productos que se muestran como preview en la home (máx. 3
-- recomendado, sin límite forzado a nivel DB).
alter table products add column if not exists is_featured boolean not null default false;

-- Categoría libre (texto, sin tabla aparte): el admin elige de un
-- select con opciones fijas para evitar duplicados por typo, pero
-- a nivel de esquema no hay constraint — sumar una categoría nueva
-- el día de mañana es editar el select, no una migración.
alter table products add column if not exists category text;
