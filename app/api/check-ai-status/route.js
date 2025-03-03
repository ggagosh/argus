export async function GET() {
  try {
    // Check if ANTHROPIC_API_KEY is configured
    const hasAIKey = !!process.env.ANTHROPIC_API_KEY;

    return new Response(
      JSON.stringify({ enabled: hasAIKey }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error checking AI status:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to check AI status',
        cause: 'An internal error occurred while checking AI availability.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 