const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ==================
// ITEMS (COLECCIÓN)
// ==================

// GET todos los items del usuario
app.get('/api/items', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('GET /api/items error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET items filtrados por categoría
app.get('/api/items/category/:category', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .eq('category', req.params.category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST agregar nuevo item
app.post('/api/items', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { 
      name, category, theme, artist_name, artist_instagram, 
      country_origin, price_usd, purchase_url, notes, image_url 
    } = req.body;

    if (!name || !category || !price_usd) {
      return res.status(400).json({ error: 'faltan campos requeridos' });
    }

    const { data, error } = await supabase
      .from('items')
      .insert([{
        user_id: userId,
        name,
        category,
        theme,
        artist_name,
        artist_instagram,
        country_origin,
        price_usd: parseFloat(price_usd),
        purchase_url,
        notes,
        image_url,
        purchase_date: new Date().toISOString().split('T')[0]
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('POST /api/items error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT actualizar item
app.put('/api/items/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { data, error } = await supabase
      .from('items')
      .update({ ...req.body, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'item no encontrado' });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true, message: 'item eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
// WISHLIST
// ==================

// GET wishlist completa
app.get('/api/wishlist', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('deadline_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET wishlist con alertas de deadline
app.get('/api/wishlist/alerts', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    const alerts = {
      urgent: data.filter(item => 
        item.deadline_date && new Date(item.deadline_date) <= weekFromNow
      ),
      soon: data.filter(item => 
        item.deadline_date && 
        new Date(item.deadline_date) > weekFromNow && 
        new Date(item.deadline_date) <= monthFromNow
      ),
      ok: data.filter(item => 
        !item.deadline_date || new Date(item.deadline_date) > monthFromNow
      )
    };

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST agregar a wishlist
app.post('/api/wishlist', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { 
      name, category, price_usd, deadline_date, 
      image_url, artist_name, country_origin 
    } = req.body;

    if (!name || !category || !price_usd) {
      return res.status(400).json({ error: 'faltan campos requeridos' });
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert([{
        user_id: userId,
        name,
        category,
        price_usd: parseFloat(price_usd),
        deadline_date,
        image_url,
        artist_name,
        country_origin,
        status: 'pending'
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('POST /api/wishlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT marcar como comprado
app.put('/api/wishlist/:id/purchase', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { data, error } = await supabase
      .from('wishlist')
      .update({ status: 'purchased' })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'item no encontrado' });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE de wishlist
app.delete('/api/wishlist/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true, message: 'item removido de wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
// GASTOS
// ==================

// GET resumen de gastos este mes
app.get('/api/expenses/summary', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('expenses')
      .select('amount_usd, category')
      .eq('user_id', userId)
      .gte('purchase_date', monthStart);

    if (error) throw error;

    const total = data.reduce((sum, e) => sum + (parseFloat(e.amount_usd) || 0), 0);
    const byCategory = {};
    data.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount_usd || 0);
    });

    res.json({ 
      total: Math.round(total * 100) / 100, 
      byCategory, 
      items: data 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET gastos por rango de fechas
app.get('/api/expenses', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { startDate, endDate } = req.query;

    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId);

    if (startDate) query = query.gte('purchase_date', startDate);
    if (endDate) query = query.lte('purchase_date', endDate);

    const { data, error } = await query.order('purchase_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST registrar gasto
app.post('/api/expenses', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { amount_usd, category, purchase_date, item_id, payment_method } = req.body;

    if (!amount_usd || !category || !purchase_date) {
      return res.status(400).json({ error: 'faltan campos requeridos' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: userId,
        amount_usd: parseFloat(amount_usd),
        category,
        purchase_date,
        item_id,
        payment_method
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
// USUARIOS
// ==================

// GET datos del usuario
app.get('/api/users/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Si el usuario no existe aún, crearla
      if (error.code === 'PGRST116') {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            username: 'usuario_' + userId.slice(0, 8),
            email: req.headers['x-user-email'] || 'unknown@collectio.app',
            dragon_name: 'Hoard'
          }])
          .select()
          .single();
        if (insertError) throw insertError;
        return res.json(newUser);
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT actualizar perfil
app.put('/api/users/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { dragon_name, budget_monthly, theme_bg, currency_primary } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ 
        dragon_name, 
        budget_monthly: parseFloat(budget_monthly) || null,
        theme_bg, 
        currency_primary,
        updated_at: new Date() 
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
// ARTISTAS FAVORITOS
// ==================

// GET artistas favoritos
app.get('/api/artists', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { data, error } = await supabase
      .from('favorite_artists')
      .select('*')
      .eq('user_id', userId)
      .order('followed_since', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST agregar artista favorito
app.post('/api/artists', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    const { artist_name, instagram_handle, website_url, country, notes } = req.body;

    if (!artist_name) {
      return res.status(400).json({ error: 'nombre de artista requerido' });
    }

    const { data, error } = await supabase
      .from('favorite_artists')
      .insert([{
        user_id: userId,
        artist_name,
        instagram_handle,
        website_url,
        country,
        notes
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
// ESTADÍSTICAS
// ==================

// GET estadísticas generales
app.get('/api/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'user_id requerido' });

    // Total items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, category, price_usd')
      .eq('user_id', userId);

    // Total gastos
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount_usd')
      .eq('user_id', userId);

    // Wishlist pendiente
    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlist')
      .select('id, price_usd')
      .eq('user_id', userId)
      .eq('status', 'pending');

    // Artistas únicos
    const { data: artists, error: artistsError } = await supabase
      .from('favorite_artists')
      .select('id')
      .eq('user_id', userId);

    if (itemsError || expensesError || wishlistError || artistsError) {
      throw itemsError || expensesError || wishlistError || artistsError;
    }

    const stats = {
      total_items: items.length,
      categories: {},
      total_spent: expenses.reduce((sum, e) => sum + parseFloat(e.amount_usd || 0), 0),
      wishlist_count: wishlist.length,
      wishlist_total: wishlist.reduce((sum, w) => sum + parseFloat(w.price_usd || 0), 0),
      favorite_artists_count: artists.length
    };

    // Contar por categoría
    items.forEach(item => {
      stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
// HEALTH CHECK
// ==================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    supabase: process.env.SUPABASE_URL 
  });
});

// ==================
// ERROR HANDLING
// ==================

app.use((req, res) => {
  res.status(404).json({ error: 'ruta no encontrada' });
});

// ==================
// SERVIDOR
// ==================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🐉 Collectio backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 Conectado a Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
