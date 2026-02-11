
-- Update admin email to new format
UPDATE auth.users SET email = 'admin@sgq.local' WHERE email = 'admin@hospital.com';

-- Set username on admin profile
UPDATE public.profiles SET username = 'admin' WHERE user_id = 'bfad5fd8-b3a7-47c3-b79a-12ec4bf04b3b';
