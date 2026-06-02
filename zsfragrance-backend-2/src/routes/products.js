import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// ─── GET /products — catalogue complet avec stock ────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('brand', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── PATCH /products/:id/stock — mettre à jour le stock ─
router.patch('/:id/stock', async (req, res) => {
  const { stock } = req.body;

  if (typeof stock !== 'number' || stock < 0) {
    return res.status(400).json({ error: 'Stock invalide' });
  }

  const { data, error } = await supabase
    .from('products')
    .update({ stock })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── PUT /products/:id — modifier un produit ─────────────
router.put('/:id', async (req, res) => {
  const { name, price, volume, flags, isNew, stock, active } = req.body;

  const updates = {};
  if (name !== undefined)   updates.name   = name;
  if (price !== undefined)  updates.price  = price;
  if (volume !== undefined) updates.volume = volume;
  if (flags !== undefined)  updates.flags  = flags;
  if (isNew !== undefined)  updates.is_new = isNew;
  if (stock !== undefined)  updates.stock  = stock;
  if (active !== undefined) updates.active = active;

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
