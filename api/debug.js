export const config = { runtime: 'nodejs' };

export default async function handler(_req, res) {
  try {
    res.status(200).json({
      ok: true,
      envSeen: {
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        GOOGLE_CREDENTIALS_JSON: !!process.env.GOOGLE_CREDENTIALS_JSON,
        GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
        GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      },
      tip: 'Only booleans shown for safety',
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}

