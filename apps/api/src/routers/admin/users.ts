import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

export const adminUsersRouter = new Hono();

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

// GET /api/admin/users — list all Supabase users with roles
adminUsersRouter.get('/', async (c) => {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) return c.json({ error: error.message }, 500);

    const users = data.users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.app_metadata?.role || 'member',
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
      confirmed: !!u.email_confirmed_at,
    }));
    return c.json({ users, total: data.total });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/admin/users/:id/role — update user role
adminUsersRouter.put('/:id/role', async (c) => {
  try {
    const id = c.req.param('id');
    const { role } = await c.req.json();
    const allowedRoles = ['member', 'author', 'editor', 'admin', 'system_admin', 'super_admin'];
    if (!allowedRoles.includes(role)) return c.json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` }, 400);

    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      app_metadata: { role },
    });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, user: { id: data.user.id, email: data.user.email, role } });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
