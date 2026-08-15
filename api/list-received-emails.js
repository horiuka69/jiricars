export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API Key is not configured' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails/receiving', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error listing received emails:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
