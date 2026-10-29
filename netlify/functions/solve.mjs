export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST to ask a question.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'The AI key is not configured in Netlify yet.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const body = await request.json();
    const question = String(body.question || '').trim();
    const imageData = typeof body.imageData === 'string' ? body.imageData : null;
    if (!question && !imageData) {
      return new Response(JSON.stringify({ error: 'Type a question or attach a photo first.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (question.length > 8000) {
      return new Response(JSON.stringify({ error: 'Please keep your question under 8,000 characters.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (imageData && (!imageData.startsWith('data:image/') || imageData.length > 5_500_000)) {
      return new Response(JSON.stringify({ error: 'Please upload a smaller image (under about 4 MB).' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const instructions = `You are HomeSolve, a friendly tutor. Help the student learn rather than merely copying an answer. Explain in clear, age-appropriate steps and check the reasoning. If an image is attached, read the visible homework problem carefully; if it is unclear, say what you cannot read and ask for a clearer photo. Do not claim certainty when unsure. Do not help with cheating during a live exam. Use the requested answer language and explanation style.\nStudent context: country/curriculum=${String(body.country || 'unspecified')}; level=${String(body.level || 'unspecified')}; year=${String(body.year || 'unspecified')}; subject=${String(body.subject || 'unspecified')}; language=${String(body.language || 'English')}; style=${String(body.answerStyle || 'Step by step')}.`;
    const content = [];
    if (question) content.push({ type: 'input_text', text: question });
    if (imageData) content.push({ type: 'input_image', image_url: imageData, detail: 'high' });
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4.1-mini', instructions, input: [{ role: 'user', content }], max_output_tokens: 1400 })
    });
    const result = await upstream.json();
    if (!upstream.ok) {
      const msg = result?.error?.message || 'The AI provider returned an error.';
      return new Response(JSON.stringify({ error: `AI service error: ${msg}` }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
    const answer = (result.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n').trim();
    if (!answer) throw new Error('The AI returned an empty answer. Please try again.');
    return new Response(JSON.stringify({ answer }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unexpected server error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
