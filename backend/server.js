require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const axios    = require('axios');
const cheerio  = require('cheerio');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // larger limit for resume base64

// ── Department faculty page URLs ─────────────────────────────────────────────
const DEPARTMENTS = {
  'Computer Science':  'https://www.cics.umass.edu/faculty/directory',
  'Electrical & Computer Engineering': 'https://www.ece.umass.edu/faculty',
  'Linguistics':       'https://www.umass.edu/linguistics/linguistics-faculty',
  'Biology':           'https://www.bio.umass.edu/biology/faculty',
  'Neuroscience':      'https://www.umass.edu/nsp/people/faculty',
};

// ── Helper: call Claude API ──────────────────────────────────────────────────
async function callClaude(messages, maxTokens = 1000, extraHeaders = {}) {
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, messages },
    {
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
        ...extraHeaders
      }
    }
  );
  return res.data.content[0].text;
}

// ── Helper: try to scrape a URL, return '' on failure ────────────────────────
async function tryFetchText(url) {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-finder/1.0)' },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    $('script, style, nav, footer, header').remove();
    return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);
  } catch {
    return '';
  }
}

// ── GET /api/departments ─────────────────────────────────────────────────────
app.get('/api/departments', (req, res) => {
  res.json(Object.keys(DEPARTMENTS));
});

// ── POST /api/professors ─────────────────────────────────────────────────────
app.post('/api/professors', async (req, res) => {
  const { topic, departments = Object.keys(DEPARTMENTS) } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  try {
    // Try to scrape pages — best-effort, failures are ok
    const scrapeResults = await Promise.allSettled(
      departments.map(async dept => {
        const text = await tryFetchText(DEPARTMENTS[dept]);
        return { dept, text };
      })
    );

    const scrapedText = scrapeResults
      .filter(r => r.status === 'fulfilled' && r.value.text.length > 100)
      .map(r => `=== ${r.value.dept} ===\n${r.value.text}`)
      .join('\n\n');

    const prompt = `You are helping an undergraduate student at UMass Amherst find research opportunities.

The student is interested in: "${topic}"
Departments to focus on: ${departments.join(', ')}

IMPORTANT: Use your training knowledge about UMass Amherst faculty members, their labs, and research areas. The scraped text below supplements your knowledge but may be incomplete due to JavaScript-rendered pages.

${scrapedText ? `Supplemental scraped text from faculty pages:\n${scrapedText}` : 'No scraped text available — rely on your training knowledge of UMass faculty.'}

Return ONLY a JSON array (no other text) of 6-12 professors relevant to the student's topic:
[
  {
    "name": "Professor Full Name",
    "department": "Department Name",
    "title": "e.g. Associate Professor",
    "researchAreas": "their actual research areas in 1-2 sentences",
    "simplified": "explain their research like the student is a freshman, 2-3 sentences max",
    "whyRelevant": "one sentence on why this matches the student's interest",
    "email": "their public UMass email if you know it (e.g. netid@cs.umass.edu or netid@umass.edu), otherwise empty string",
    "collaborators": ["Name (PhD student, brief topic)", "Name (postdoc, brief topic)"]
  }
]

Only include professors you are confident exist at UMass Amherst. Do not fabricate people. For email, only include if you are reasonably confident. For collaborators, list PhD students or postdocs you know are in their lab — include at least 1-2 if you know them, otherwise empty array.`;

    const raw   = await callClaude([{ role: 'user', content: prompt }], 2500);
    console.log('Claude raw response (first 500 chars):', raw.slice(0, 500));
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return res.status(500).json({ error: `Could not parse professor data. Claude said: ${raw.slice(0, 200)}` });

    res.json({ professors: JSON.parse(match[0]), topic });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/email ──────────────────────────────────────────────────────────
app.post('/api/email', async (req, res) => {
  const { professor, topic, resumeData } = req.body;
  if (!professor || !topic) return res.status(400).json({ error: 'Missing fields' });

  try {
    let messages;

    if (resumeData?.type === 'pdf' && resumeData?.content) {
      // Use Claude's PDF document API to read the resume
      messages = [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: resumeData.content }
          },
          {
            type: 'text',
            text: `The above is the student's resume. Use it to write a personalized cold email to Professor ${professor.name} in the ${professor.department} department at UMass Amherst.

Professor's research: ${professor.researchAreas}
Student's topic of interest: ${topic}

Requirements:
- Reference 1-2 specific things from the student's resume that are relevant to this professor's work
- Specific to the professor's actual research, not generic
- Under 200 words
- Ask for a 15-minute meeting or research opportunity
- Sound like a real student wrote it, not AI
- Include a subject line at the top
- Sign off with name and UMass email only — do NOT include a phone number

Return ONLY the email with subject line. No commentary.`
          }
        ]
      }];

      const email = await callClaude(messages, 600, { 'anthropic-beta': 'pdfs-2024-09-25' });
      return res.json({ email });

    } else {
      const resumeSection = resumeData?.content
        ? `Student's resume:\n${resumeData.content}\n\nReference relevant parts of the resume in the email.`
        : 'Student is a sophomore CS student at UMass Amherst interested in research.';

      const prompt = `Write a cold email from an undergraduate student at UMass Amherst to Professor ${professor.name} in the ${professor.department} department.

Professor's research: ${professor.researchAreas}
Student's topic of interest: ${topic}
${resumeSection}

Requirements:
- Specific to the professor's actual research, not generic
- Under 200 words
- Ask for a 15-minute meeting or research opportunity
- Sound like a real student wrote it, not AI
- Include a subject line
- Sign off with name and UMass email only — do NOT include a phone number

Return ONLY the email with subject line. No commentary.`;

      const email = await callClaude([{ role: 'user', content: prompt }], 600);
      return res.json({ email });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prep ───────────────────────────────────────────────────────────
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

    const raw   = await callClaude([{ role: 'user', content: prompt }], 600);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Could not parse prep data' });

    res.json(JSON.parse(match[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/details ───────────────────────────────────────────────────────
app.post('/api/details', async (req, res) => {
  const { professor, topic } = req.body;
  if (!professor) return res.status(400).json({ error: 'Missing professor' });

  try {
    const prompt = `An undergraduate student at UMass Amherst is exploring research opportunities with Professor ${professor.name} in ${professor.department}.

Professor's research: ${professor.researchAreas}
Student's interest: ${topic}

Give a detailed research breakdown. Return JSON only:
{
  "fullDescription": "3-4 sentence deep dive on what this professor's research actually involves — the problems they're solving, the approach, and why it matters",
  "techStack": ["tool or language 1", "tool or language 2", "tool or language 3"],
  "whatYoullDo": "2-3 sentences on what an undergrad research assistant in this lab would typically work on day-to-day",
  "recentFocus": "1-2 sentences on what they are actively working on in recent years",
  "goodFitIf": ["you enjoy X", "you have experience with Y", "you're interested in Z"],
  "labMembers": ["PhD Student Name — research focus", "PhD Student Name — research focus"]
}

For labMembers: list PhD students, postdocs, or close collaborators you know are associated with this professor's lab or have co-authored papers with them. Aim for 2-5. If you truly don't know any, return an empty array.`;

    const raw   = await callClaude([{ role: 'user', content: prompt }], 800);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Could not parse details' });
    res.json(JSON.parse(match[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
