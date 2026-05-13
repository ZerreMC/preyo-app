-- Create missing profiles for any existing users in auth.users (Backfill)
INSERT INTO public.profiles (id, display_name, locale, timezone)
SELECT u.id,
       COALESCE(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
       COALESCE(
               CASE
                   WHEN (u.raw_user_meta_data ->> 'locale') ~ '^[a-z]{2}(-[A-Z]{2})?$'
                       THEN u.raw_user_meta_data ->> 'locale'
                   ELSE NULL
                   END,
               'es'
       ),
       COALESCE(
               NULLIF(btrim(COALESCE(u.raw_user_meta_data ->> 'timezone', '')), ''),
               'Europe/Madrid'
       )
FROM auth.users u
WHERE NOT EXISTS (SELECT 1
                  FROM public.profiles p
                  WHERE p.id = u.id);

-- Add direct foreign key constraint to profiles to satisfy PostgREST embed relation
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_constraint
                       WHERE conname = 'shopping_list_collaborators_user_profile_fk') THEN
            ALTER TABLE public.shopping_list_collaborators
                ADD CONSTRAINT shopping_list_collaborators_user_profile_fk
                    FOREIGN KEY (user_id)
                        REFERENCES public.profiles (id)
                        ON DELETE CASCADE;
        END IF;
    END
$$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
