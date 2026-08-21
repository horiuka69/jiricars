// API Route: Send Email via Resend and save to Firestore
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formType, name, email, phone, subject, message } = req.body;

  // Validate required inputs
  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.DESTINATION_EMAIL || 'info@easyodtah.cz'; // fallback or env

  if (!resendApiKey) {
    console.error('Missing RESEND_API_KEY environment variable');
    return res.status(500).json({ error: 'Mail server configuration error' });
  }

  // Construct Email Content (Full details sent to inbox & saved to database)
  let emailSubject = `[easyodtah.cz] New Form Submission: ${formType || 'General'}`;
  if (subject) {
    emailSubject += ` - ${subject}`;
  }

  let htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #06b6d4; margin-top: 0;">Nová poptávka z easyodtah.cz / New Form Submission</h2>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
        <p style="margin: 6px 0;"><strong>Typ formuláře / Form Type:</strong> ${formType ? formType.toUpperCase() : 'General'}</p>
        <p style="margin: 6px 0;"><strong>Jméno / Name:</strong> ${name}</p>
        <p style="margin: 6px 0;"><strong>E-mail zákazníka / Email:</strong> ${email}</p>
        ${phone ? `<p style="margin: 6px 0;"><strong>Telefon / Phone:</strong> ${phone}</p>` : ''}
        ${subject ? `<p style="margin: 6px 0;"><strong>Předmět / Subject:</strong> ${subject}</p>` : ''}
      </div>

      <p style="font-weight: bold; margin-bottom: 8px;">Zpráva od zákazníka / Message Details:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap; font-size: 0.95rem; margin-bottom: 25px;">${message || 'Bez textu zprávy / No message content.'}</div>

      <!-- Gmail Copy & Reply Instructions -->
      <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7; color: #b45309; margin-bottom: 25px; font-size: 0.95rem;">
        <p style="margin: 0 0 8px 0; font-weight: bold;">Jak odpovědět zákazníkovi / How to reply to the customer:</p>
        <p style="margin: 0 0 8px 0;">Pro odpověď <strong>zkopírujte e-mailovou adresu zákazníka (${email})</strong> a napište novou zprávu přímo ve svém Gmailu.</p>
        <p style="margin: 0; font-style: italic; font-size: 0.85rem; color: #78350f;">To reply, copy the customer's email address (${email}) and compose a new email yourself directly in Gmail.</p>
      </div>

      <p style="text-align: center; margin: 25px 0;">
        <a href="https://easyodtah.cz/admin-inbox" style="display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px rgba(6, 182, 212, 0.2);">
          Zobrazit statistiky v administraci / View Stats Dashboard
        </a>
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
      <p style="font-size: 0.8rem; color: #9ca3af; text-align: center;">Toto je automatické upozornění z vašeho webu easyodtah.cz.</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'easyodtah.cz <noreply@easyodtah.cz>',
        to: toEmail,
        reply_to: email, // Set customer's email as the Reply-To address
        subject: emailSubject,
        html: htmlBody
      })
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
        from: { stringValue: 'easyodtah.cz <noreply@easyodtah.cz>' },
        to: { arrayValue: { values: [{ stringValue: toEmail }] } },
        replyTo: { stringValue: email },
        subject: { stringValue: emailSubject },
        text: { stringValue: `Form Type: ${formType || 'General'}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || ''}\nMessage: ${message || ''}` },
        html: { stringValue: htmlBody },
        createdAt: { stringValue: new Date().toISOString() },
        type: { stringValue: 'received' },
        resendType: { stringValue: 'sent' },
        formType: { stringValue: formType || 'General' }
      }
    };

    try {
      await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestorePayload)
      });
    } catch (dbErr) {
      console.error('Failed to log form email in Firestore:', dbErr);
    }

    return res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Server error sending email:', error);
    return res.status(500).json({ error: 'Internal server error sending email' });
  }
}
