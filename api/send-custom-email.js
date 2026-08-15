export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API Key is not configured' });
  }

  const { to, subject, body, replyToMessageId, conversationId } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields (to, subject, body)' });
  }

  const payload = {
    from: 'easyodtah.cz <info@easyodtah.cz>', // Verified domain sender
    to: to,
    subject: subject,
    text: body,
    html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1f2937; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p>${body.replace(/\n/g, '<br />')}</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      ${conversationId ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; text-align: center; margin: 15px 0;">
          <p style="margin: 0 0 10px 0; font-size: 0.9rem; color: #475569;">Odpovězte na zprávu online / Answer this message online:</p>
          <a href="https://easyodtah.cz/chat/${conversationId}" style="display: inline-block; background: #06b6d4; color: #ffffff; padding: 8px 18px; border-radius: 6px; text-decoration: none; font-size: 0.9rem; font-weight: bold;">Otevřít konverzaci / Open Chat</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      ` : ''}
      <p style="font-size: 0.85rem; color: #9ca3af;">Odesláno z administrace easyodtah.cz / Sent from easyodtah.cz admin.</p>
    </div>`
  };

  if (replyToMessageId) {
    payload.headers = {
      'In-Reply-To': replyToMessageId,
      'References': replyToMessageId
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error sending custom email:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
