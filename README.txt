HomeSolve AI connection starter

This project adds a secure Netlify Function for OpenAI text and image questions.

IMPORTANT:
- Keep OPENAI_API_KEY only in Netlify environment variables. Never put it in index.html.
- The current 10-use counter is still browser-local and can be reset/bypassed. Do not treat it as a secure quota.
- Stripe subscriptions, user accounts, database-backed quotas, privacy/terms pages, and production abuse controls are not implemented yet.

Deployment needs a Netlify deploy method that builds/deploys the `netlify/functions` folder (typically connect a Git repository or use Netlify CLI). Uploading just index.html with Netlify Drop will NOT deploy the function.
