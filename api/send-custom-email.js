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

  const htmlBody = `<div style="font-family: sans-serif; line-height: 1.6; color: #1f2937; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
    <p>${body.replace(/\n/g, '<br />')}</p>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p style="font-size: 0.85rem; color: #9ca3af;">Odesláno z administrace easyodtah.cz / Sent from easyodtah.cz admin.</p>
  </div>`;

  const payload = {
    from: 'easyodtah.cz <info@easyodtah.cz>', // Verified domain sender
    to: to,
    subject: subject,
    text: body,
    html: htmlBody
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

    if (!response.ok) {
      console.error('Resend API Error:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to send email' });
    }

    // Save copy to Firestore using Google REST API
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'easyodtah';
    const firestorePayload = {
      fields: {
        messageId: { stringValue: data.id || '' },
        inReplyTo: { stringValue: replyToMessageId || '' },
        references: { stringValue: replyToMessageId || '' },
        from: { stringValue: 'easyodtah.cz <info@easyodtah.cz>' },
        to: { arrayValue: { values: [{ stringValue: to }] } },
        replyTo: { stringValue: 'info@easyodtah.cz' },
        subject: { stringValue: subject },
        text: { stringValue: body },
        html: { stringValue: htmlBody },
        createdAt: { stringValue: new Date().toISOString() },
        type: { stringValue: 'sent' },
        resendType: { stringValue: 'sent' }
      }
    };

    try {
      await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestorePayload)
      });
    } catch (dbErr) {
      console.error('Failed to log outbound email in Firestore:', dbErr);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error sending custom email:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
