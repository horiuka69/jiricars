export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const email = req.body;
    if (!email || !email.from) {
      return res.status(400).json({ error: 'Invalid inbound email payload' });
    }

    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'easyodtah';

    // Parse SMTP headers for threading support
    const messageId = email.headers?.['message-id'] || email.message_id || '';
    const inReplyTo = email.headers?.['in-reply-to'] || '';
    const references = email.headers?.['references'] || '';
    
    // Construct Firestore fields structure (using Google Firestore REST format)
    const payload = {
      fields: {
        messageId: { stringValue: messageId },
        inReplyTo: { stringValue: inReplyTo },
        references: { stringValue: references },
        from: { stringValue: email.from || '' },
        to: { arrayValue: { values: (email.to || []).map(r => ({ stringValue: r })) } },
        subject: { stringValue: email.subject || '' },
        text: { stringValue: email.text || '' },
        html: { stringValue: email.html || '' },
        createdAt: { stringValue: email.created_at || new Date().toISOString() },
        type: { stringValue: 'received' },
        replyTo: { stringValue: email.from || '' }
      }
    };

    // Post new incoming email details directly to Firestore
    const firestoreRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!firestoreRes.ok) {
      const errorText = await firestoreRes.text();
      console.error('Firestore inbound log failed:', errorText);
      return res.status(500).json({ error: 'Failed to write inbound email to database' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Inbound webhook execution error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
