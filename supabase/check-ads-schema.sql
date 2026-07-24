SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ads';

SELECT conname, pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint 
WHERE conrelid = 'public.ads'::regclass;
