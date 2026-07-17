require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const axios    = require('axios');
const cheerio  = require('cheerio');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Department faculty page URLs ─────────────────────────────────────────────
const DEPARTMENTS = {
  'Computer Science':  'https://www.cics.umass.edu/faculty/directory',
  'Electrical & Computer Engineering': 'https://www.ece.umass.edu/faculty',
  'Linguistics':       'https://www.umass.edu/linguistics/linguistics-faculty',
  'Biology':           'https://www.bio.umass.edu/biology/faculty',
  'Neuroscience':      'https://www.umass.edu/nsp/people/faculty',
};

// ── Helper: call Claude API ──────────────────────────────────────────────────
async function callClaude(prompt, maxTokens = 1000) {
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'x-api-key':          process.env.ANTHROPIC_API_KEY,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json'
      }
    }
  );
  return res.data.content[0].text;
}

// ── Helper: fetch a URL and return HTML ──────────────────────────────────────
async function fetchHTML(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-finder/1.0)' },
    timeout: 10000
  });
  return res.data;
}

// ── GET /api/departments ─────────────────────────────────────────────────────
app.get('/api/departments', (req, res) => {
  res.json(Object.keys(DEPARTMENTS));
});

// ── POST /api/professors ─────────────────────────────────────────────────────
// Body: { topic: "machine learning", departments: ["Computer Science"] }
app.post('/api/professors', async (req, res) => {
  const { topic, departments = Object.keys(DEPARTMENTS) } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  try {
    // Fetch all selected department pages in parallel
    const results = await Promise.allSettled(
      departments.map(async dept => {
        const url  = DEPARTMENTS[dept];
        const html = await fetchHTML(url);
        const $    = cheerio.load(html);
        $('script, style, nav, footer, header').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);
        return { dept, text };
      })
    );

    const pagesText = results
      .filter(r => r.status === 'fulfilled')
      .map(r => `=== ${r.value.dept} ===\n${r.value.text}`)
      .join('\n\n');

    if (!pagesText) return res.status(500).json({ error: 'Could not fetch any department pages' });

    const extractPrompt = `You are helping an undergraduate student at UMass Amherst find research opportunities.

The student is interested in: "${topic}"

Below is raw text scraped from UMass faculty directory pages. Extract professors whose research is relevant to the student's topic.

Return ONLY a JSON array, no other text:
[
  {
    "name": "Professor Full Name",
    "department": "Department Name",
    "title": "e.g. Associate Professor",
    "researchAreas": "their actual research areas in 1-2 sentences",
    "simplified": "explain their research like the student is a freshman, 2-3 sentences max",
    "whyRelevant": "one sentence on why this matches the topic"
  }
]

Return 5-12 relevant professors only. Faculty pages:
${pagesText}`;

    const raw   = await callClaude(extractPrompt, 2000);
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return res.status(500).json({ error: 'Could not parse professor data' });

    res.json({ professors: JSON.parse(match[0]), topic });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/email ──────────────────────────────────────────────────────────
// Body: { professor, topic, studentBackground }
app.post('/api/email', async (req, res) => {
  const { professor, topic, studentBackground } = req.body;
  if (!professor || !topic) return res.status(400).json({ error: 'Missing fields' });

  try {
    const prompt = `Write a cold email from an undergraduate student at UMass Amherst to Professor ${professor.name} in the ${professor.department} department.

Professor's research: ${professor.researchAreas}
Student's topic of interest: ${topic}
Student's background: ${studentBackground || 'a sophomore CS student interested in research'}

Requirements:
- Specific to their actual research, not generic
- Under 200 words
- Ask for a 15-minute meeting or research opportunity
- Sound like a real student wrote it
- Include a subject line

Return ONLY the email with subject line. No commentary.`;

    const email = await callClaude(prompt, 500);
    res.json({ email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prep ───────────────────────────────────────────────────────────
// Body: { professor }
app.post('/api/prep', async (req, res) => {
  const { professor } = req.body;
  if (!professor) return res.status(400).json({ error: 'Missing professor' });

  try {
    const prompt = `An undergraduate student has a meeting with Professor ${professor.name} from UMass ${professor.department}.

Professor's research: ${professor.researchAreas}
Plain English summary: ${professor.simplified}

Give the student a meeting prep brief. Return JSON only:
{
  "keyConceptsToKnow": ["concept 1", "concept 2", "concept 3"],
  "questionsToAsk": ["question 1", "question 2", "question 3", "question 4"],
  "doNotSay": ["thing to avoid 1", "thing to avoid 2"],
  "openingLine": "a natural way to open the conversation"
}`;

    const raw   = await callClaude(prompt, 600);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Could not parse prep data' });

    res.json(JSON.parse(match[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
