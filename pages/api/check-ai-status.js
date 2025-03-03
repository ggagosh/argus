export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if OPENAI_API_KEY is configured
  const hasAIKey = !!process.env.ANTHROPIC_API_KEY;

  return res.status(200).json({ enabled: hasAIKey });
} 