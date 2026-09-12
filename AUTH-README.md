# JFS AI Laundry — Authentication Foundation

Production authentication is now separated from the existing localStorage demo.

- `supabase-config.js`: public Supabase URL + publishable key.
- `auth.js`: shared session, role, tenant resolution and guard helpers.
- `login.html`: email/password login.

Demo behavior remains available for `id=demo-asosiasi`; this is not a production security boundary. Production authorization must rely on Supabase Auth + `tenant_users` + RLS.

Next step: attach guards to production pages, verify existing Auth users/memberships, test RLS, then merge to `main`.
