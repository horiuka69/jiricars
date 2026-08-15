// API Route: Send Email via Resend
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formType, name, email, phone, subject, message, conversationId } = req.body;

  // Validate required inputs
  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.DESTINATION_EMAIL || 'info@easyodtah.cz';

  if (!resendApiKey) {
    console.error('Missing RESEND_API_KEY environment variable');
    return res.status(500).json({ error: 'Mail server configuration error' });
  }

  // Construct Email Content
  let emailSubject = `[easyodtah.cz] New Form Submission: ${formType || 'General'}`;
  if (subject) {
    emailSubject += ` - ${subject}`;
  }

  let htmlBody = `
    <h2>New Form Submission from easyodtah.cz</h2>
    <hr />
    <p><strong>Form Type:</strong> ${formType ? formType.toUpperCase() : 'General'}</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
    ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
    <br />
    <p><strong>Message / Details:</strong></p>
    <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; border: 1px solid #e4e4e7; white-space: pre-wrap;">${message || 'No message content provided.'}</div>
    <hr />
    ${conversationId ? `
      <div style="margin: 20px 0; padding: 15px; border-radius: 8px; border: 1px solid #06b6d4; background: #ecfeff; text-align: center;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #0891b2;">Spravovat konverzaci v administraci / Manage Chat:</p>
        <a href="https://easyodtah.cz/admin-inbox?thread=${conversationId}" style="display: inline-block; padding: 10px 20px; color: #fff; background: #06b6d4; border-radius: 6px; text-decoration: none; font-weight: bold;">Otevřít chatovací vlákno / Open Chat Thread</a>
      </div>
      <hr />
    ` : ''}
    <p style="font-size: 0.8rem; color: #71717a;">This is an automated notification from your website easyodtah.cz.</p>
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

    return res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Server error sending email:', error);
    return res.status(500).json({ error: 'Internal server error sending email' });
  }
}
