import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── WhatsApp via CallMeBot (gratuit) ─────────────────────
export async function sendWhatsApp(order) {
  const items = order.items
    .map(i => `• ${i.brand} ${i.name} ${i.volume} x${i.quantity} = ${i.price * i.quantity} CHF`)
    .join('\n');

  const delivery =
    order.delivery.mode === 'pickup'
      ? 'Retrait Genève'
      : `Livraison ${order.delivery.mode} — ${order.delivery.address?.city}`;

  const msg = encodeURIComponent(
    `🛍 NOUVELLE COMMANDE ZS FRAGRANCE\n\n` +
    `#${order.id}\n` +
    `Client : ${order.customer.firstName} ${order.customer.lastName}\n` +
    `Tél : ${order.customer.phone}\n\n` +
    `${items}\n\n` +
    `Livraison : ${delivery}\n` +
    `Paiement : ${order.payment.method}\n` +
    `Total : ${order.total} CHF`
  );

  const url = `https://api.callmebot.com/whatsapp.php?phone=${process.env.WHATSAPP_PHONE}&text=${msg}&apikey=${process.env.WHATSAPP_APIKEY}`;

  try {
    const res = await fetch(url);
    console.log('[WhatsApp] sent:', res.status);
  } catch (err) {
    console.error('[WhatsApp] error:', err.message);
  }
}

// ─── Email via Resend ─────────────────────────────────────
export async function sendOrderEmail(order) {
  const itemsHtml = order.items
    .map(i => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4e0">
          <span style="font-size:11px;color:#9e9a95;text-transform:uppercase;letter-spacing:0.1em">${i.brand}</span><br>
          <strong style="font-size:15px">${i.name}</strong> — ${i.volume}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4e0;text-align:right;white-space:nowrap">
          x${i.quantity} &nbsp; <strong>${i.price * i.quantity} CHF</strong>
        </td>
      </tr>`)
    .join('');

  const deliveryLabel = {
    pickup: 'Retrait à Genève',
    switzerland: 'Livraison Suisse',
    france: 'Livraison France',
    europe: 'Livraison Europe',
  }[order.delivery.mode] || order.delivery.mode;

  const addressBlock = order.delivery.address
    ? `${order.delivery.address.street}, ${order.delivery.address.zip} ${order.delivery.address.city}, ${order.delivery.address.country}`
    : 'Retrait en main propre — Rue de Rive, Genève';

  const html = `
    <div style="font-family:'DM Sans',Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#faf9f7;padding:40px 32px">
      <h1 style="font-family:Georgia,serif;font-weight:300;font-size:28px;color:#1a1a1a;margin:0 0 4px">
        ZS Fragrance
      </h1>
      <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9e9a95;margin:0 0 32px">
        Genève · Suisse
      </p>

      <div style="border-top:2px solid #1a1a1a;padding-top:24px;margin-bottom:24px">
        <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9e9a95;margin:0 0 4px">
          Nouvelle commande
        </p>
        <h2 style="font-family:Georgia,serif;font-weight:300;font-size:22px;color:#1a1a1a;margin:0">
          #${order.id}
        </h2>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="width:50%;padding-right:16px;vertical-align:top">
            <p style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#9e9a95;margin:0 0 6px">Client</p>
            <p style="font-size:14px;color:#1a1a1a;margin:0">
              ${order.customer.firstName} ${order.customer.lastName}<br>
              <a href="mailto:${order.customer.email}" style="color:#1a1a1a">${order.customer.email}</a><br>
              ${order.customer.phone}
            </p>
          </td>
          <td style="width:50%;padding-left:16px;vertical-align:top;border-left:1px solid #e8e4e0">
            <p style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#9e9a95;margin:0 0 6px">Livraison</p>
            <p style="font-size:14px;color:#1a1a1a;margin:0">
              ${deliveryLabel}<br>
              <span style="color:#9e9a95;font-size:12px">${addressBlock}</span>
            </p>
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        ${itemsHtml}
      </table>

      <div style="border-top:1px solid #e8e4e0;padding-top:16px;display:flex;justify-content:space-between">
        <div>
          <p style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#9e9a95;margin:0 0 4px">Paiement</p>
          <p style="font-size:14px;color:#1a1a1a;margin:0;text-transform:capitalize">${order.payment.method.replace('_', ' ')}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#9e9a95;margin:0 0 4px">Total</p>
          <p style="font-family:Georgia,serif;font-size:28px;font-weight:300;color:#1a1a1a;margin:0">${order.total} CHF</p>
        </div>
      </div>

      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e4e0;text-align:center">
        <a href="${process.env.FRONTEND_URL}/admin" style="display:inline-block;padding:12px 32px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:10px;letter-spacing:0.2em;text-transform:uppercase">
          Voir le dashboard
        </a>
      </div>
    </div>`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `[ZS Fragrance] Commande #${order.id} — ${order.total} CHF`,
      html,
    });
    console.log('[Email] sent to', process.env.EMAIL_TO);
  } catch (err) {
    console.error('[Email] error:', err.message);
  }
}

// ─── Email de confirmation au client ─────────────────────
export async function sendConfirmationEmail(order) {
  const itemsHtml = order.items
    .map(i => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4e0;font-size:13px;color:#1a1a1a">
          <span style="font-size:10px;color:#9e9a95;text-transform:uppercase">${i.brand}</span><br>
          ${i.name} — ${i.volume} x${i.quantity}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4e0;text-align:right;font-size:13px;color:#1a1a1a">
          ${i.price * i.quantity} CHF
        </td>
      </tr>`)
    .join('');

  const deliveryMsg = order.delivery.mode === 'pickup'
    ? 'Nous vous contacterons pour fixer le rendez-vous de retrait à Genève.'
    : `Votre commande sera expédiée sous 2-3 jours ouvrés. Vous recevrez un email de suivi dès l'envoi.`;

  const html = `
    <div style="font-family:'DM Sans',Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#faf9f7;padding:40px 32px">
      <h1 style="font-family:Georgia,serif;font-weight:300;font-size:28px;color:#1a1a1a;margin:0 0 4px">ZS Fragrance</h1>
      <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9e9a95;margin:0 0 32px">Genève · Suisse</p>

      <h2 style="font-family:Georgia,serif;font-weight:300;font-size:22px;color:#1a1a1a;margin:0 0 8px">
        Commande confirmée.
      </h2>
      <p style="font-size:13px;color:#9e9a95;margin:0 0 24px">Référence : <strong style="color:#1a1a1a">#${order.id}</strong></p>

      <p style="font-size:13px;color:#1a1a1a;line-height:1.7;margin:0 0 24px">
        Bonjour ${order.customer.firstName},<br>
        Nous avons bien reçu votre commande. ${deliveryMsg}
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        ${itemsHtml}
        <tr>
          <td style="padding:16px 0 0;font-size:13px;color:#9e9a95;text-transform:uppercase;letter-spacing:0.1em">Total</td>
          <td style="padding:16px 0 0;text-align:right;font-family:Georgia,serif;font-size:24px;font-weight:300;color:#1a1a1a">${order.total} CHF</td>
        </tr>
      </table>

      <p style="font-size:11px;color:#9e9a95;border-top:1px solid #e8e4e0;padding-top:24px;line-height:1.8">
        Pour toute question : <a href="mailto:${process.env.EMAIL_FROM}" style="color:#1a1a1a">${process.env.EMAIL_FROM}</a><br>
        ZS Fragrance · Genève, Suisse
      </p>
    </div>`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: order.customer.email,
      subject: `Votre commande ZS Fragrance #${order.id}`,
      html,
    });
    console.log('[Email confirmation] sent to', order.customer.email);
  } catch (err) {
    console.error('[Email confirmation] error:', err.message);
  }
}
