export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API Key is not configured' });
  }

  const { to, subject, body, replyToMessageId } = req.body;
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
