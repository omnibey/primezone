import { Hono } from 'hono';
import { Env, Variables } from '../index';
import { hashPassword } from '../auth';

export const adminsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all admins
adminsRoutes.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, email, name, permissions, created_at FROM admins ORDER BY created_at DESC'
    ).all();

    // Parse JSON permissions string
    const mapped = results.map((r: any) => ({
      ...r,
      permissions: JSON.parse(r.permissions || '[]')
    }));

    return c.json({ success: true, data: { admins: mapped } });
  } catch (err) {
    console.error('Failed to fetch admins:', err);
    return c.json({ success: false, message: 'Server Error' }, 500);
  }
});

// Add new admin
adminsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, permissions } = body;

    if (!email || !password || !name) {
      return c.json({ success: false, message: 'Email, password, and name are required' }, 400);
    }

    const permsString = JSON.stringify(permissions || []);
    const hashed = await hashPassword(password);

    const result = await c.env.DB.prepare(
      'INSERT INTO admins (email, password_hash, name, permissions) VALUES (?, ?, ?, ?)'
    ).bind(email.toLowerCase().trim(), hashed, name, permsString).run();

    return c.json({ success: true, message: 'Admin added successfully' });
  } catch (err: any) {
    console.error('Failed to add admin:', err);
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Email already exists' }, 400);
    }
    return c.json({ success: false, message: 'Server Error' }, 500);
  }
});

// Update admin (roles/name/password)
adminsRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Prevent stripping super_admin from the primary owner (id = 1)
    if (Number(id) === 1) {
      if (!body.permissions || !body.permissions.includes('super_admin')) {
        return c.json({ success: false, message: 'The primary owner account must retain super_admin permissions.' }, 400);
      }
    }
    
    let query = 'UPDATE admins SET name = ?, permissions = ?';
    let bindings: any[] = [body.name, JSON.stringify(body.permissions || [])];

    if (body.password && body.password.trim().length > 0) {
      query += ', password_hash = ?';
      bindings.push(await hashPassword(body.password));
    }

    query += ' WHERE id = ?';
    bindings.push(id);

    await c.env.DB.prepare(query).bind(...bindings).run();

    return c.json({ success: true, message: 'Admin updated successfully' });
  } catch (err) {
    console.error('Failed to update admin:', err);
    return c.json({ success: false, message: 'Server Error' }, 500);
  }
});

// Delete admin
adminsRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const adminId = c.get('adminId');

    if (Number(id) === 1) {
      return c.json({ success: false, message: 'The primary owner account cannot be deleted.' }, 400);
    }

    if (Number(id) === Number(adminId)) {
      return c.json({ success: false, message: 'You cannot delete your own account' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Failed to delete admin:', err);
    return c.json({ success: false, message: 'Server Error' }, 500);
  }
});
