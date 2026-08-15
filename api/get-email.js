export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, type } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing required query parameter: id' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API Key is not configured' });
  }

  const url = type === 'received' 
    ? `https://api.resend.com/emails/receiving/${id}`
    : `https://api.resend.com/emails/${id}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error fetching email details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
