-- =============================================================
-- Choreo – nowy status "Czeka na zatwierdzenie"
-- Osobny plik, bo nowa wartość typu enum musi zostać zatwierdzona (commit),
-- zanim kolejna migracja zacznie jej używać.
-- =============================================================
alter type public.task_status add value if not exists 'pending' before 'done';
