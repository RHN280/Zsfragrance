import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db.js';
import { sendWhatsApp, sendOrderEmail, sendConfirmationEmail } from '../notifications.js';

const router = Router();

// ─── Validation schema ────────────────────────────────────
const OrderSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName:  z.string().min(1),
    email:     z.string().email(),
    phone:     z.string().min(6),
  }),
  delivery: z.object({
    mode:    z.enum(['pickup', 'switzerland', 'france', 'europe']),
    address: z.object({
      street:  z.string(),
      zip:     z.string(),
      city:    z.string(),
      country: z.string(),
    }).nullable(),
  }),
  payment: z.object({
    method: z.enum(['stripe', 'twint', 'bank_transfer']),
  }),
  items: z.array(z.object({
    productId: z.string(),
    name:      z.string(),
    brand:     z.string(),
    volume:    z.string(),
    price:     z.number(),
    quantity:  z.number().int().min(1),
  })).min(1),
  subtotal:     z.number(),
  shippingCost: z.number(),
  total:        z.number(),
});

// ─── POST /orders — créer une commande ───────────────────
router.post('/', async (req, res) => {
  const parsed = OrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Données invalides', details: parsed.error.flatten() });
  }

  const data = parsed.data;

  // Générer un ID lisible
  const orderId = `ZSF-${Date.now().toString(36).toUpperCase()}`;

  // Décrémenter le stock pour chaque produit
  for (const item of data.items) {
    const { data: product, error } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.productId)
      .single();

    if (error || !product) continue;

    const newStock = Math.max(0, product.stock - item.quantity);
    await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.productId);
  }

  // Sauvegarder la commande
  const { data: savedOrder, error: saveError } = await supabase
    .from('orders')
    .insert({
      id:            orderId,
      customer:      data.customer,
      delivery:      data.delivery,
      payment:       data.payment,
      items:         data.items,
      subtotal:      data.subtotal,
      shipping_cost: data.shippingCost,
      total:         data.total,
      status:        'pending',
    })
    .select()
    .single();

  if (saveError) {
    console.error('[Orders] save error:', saveError);
    return res.status(500).json({ error: 'Erreur serveur' });
  }

  const order = { ...data, id: orderId };

  // Envoyer les notifications en parallèle
  await Promise.allSettled([
    sendWhatsApp(order),
    sendOrderEmail(order),
    sendConfirmationEmail(order),
  ]);

  // Réponse selon le mode de paiement
  if (data.payment.method === 'stripe') {
    return res.json({ success: true, orderId, clientSecret: null });
  }

  if (data.payment.method === 'twint') {
    return res.json({ success: true, orderId, redirectUrl: `${process.env.FRONTEND_URL}/confirmation?order=${orderId}` });
  }

  return res.json({ success: true, orderId });
});

// ─── GET /orders — liste toutes les commandes (admin) ────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── GET /orders/:id — détail d'une commande ─────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(data);
});

// ─── PATCH /orders/:id — mettre à jour le statut ─────────
router.patch('/:id', async (req, res) => {
  const { status, trackingNumber } = req.body;
  const allowed = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  const updates = {};
  if (status) updates.status = status;
  if (trackingNumber) updates.tracking_number = trackingNumber;

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
