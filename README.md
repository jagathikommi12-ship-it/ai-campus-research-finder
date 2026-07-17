# AI Campus Research Finder

Finding research labs as an undergrad is weirdly hard. You either cold-browse department websites for hours, ask around hoping someone knows someone, or just give up and assume research is for grad students. This tool fixes that.

Pick what you're interested in — ML, NLP, HCI, computational bio, whatever — and it finds UMass Amherst professors whose work actually matches. Then it helps you reach out: personalized cold email, meeting prep, and a full breakdown of what the lab does and what you'd actually be doing as an undergrad.

---

## What it does

**Find professors** — select research topics from a list and filter by department. Claude cross-references its knowledge of UMass faculty and returns relevant professors with plain-English summaries of their work.

**Cold email generator** — drafts a personalized email to each professor. Upload your resume (PDF or text) and it references your actual experience and projects instead of using a generic template.

**Meeting prep** — before you meet with a professor, get a brief with key concepts to know, questions to ask, things to avoid saying, and a natural opening line.

**Research deep dive** — click "Learn more" on any professor card to get a full breakdown: what the research actually involves, the tech stack their lab uses, what an undergrad would do day-to-day, and who else is in the lab.

**Outreach tracker** — track every professor you've emailed with a status dropdown (emailed → responded → meeting scheduled) so nothing falls through the cracks.

---

## Tech stack

- **Frontend:** React, CSS3 (custom design system), localforage
- **Backend:** Node.js, Express.js, Axios, Cheerio
- **AI:** Claude API (Haiku) — professor matching, cold email generation, meeting prep, research deep dives, PDF resume parsing
- **Other:** dotenv, CORS, REST API, ES Modules

---

## How to run

You need an Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com).

**1. Clone the repo**
```bash
git clone https://github.com/jagathikommi12-ship-it/ai-campus-research-finder.git
cd ai-campus-research-finder
```

**2. Set up the backend**
```bash
cd backend
npm install
cp .env.example .env
# Add your API key to .env
node server.js
```

**3. Set up the frontend** (in a new terminal tab)
```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000`. Keep both terminals running while you use the app.

---

## File structure

```
ai-campus-research-finder/
├── backend/
│   ├── server.js          # Express API — /professors, /email, /prep, /details
│   ├── .env.example       # API key template
│   └── package.json
└── frontend/
    └── src/
        ├── App.js                      # Main component, state, routing
        ├── App.css                     # Full design system
        ├── index.css                   # CSS variables, base styles
        └── components/
            ├── SearchPage.js           # Topic chips, dept filter, resume upload
            ├── ProfessorCard.js        # Professor card with expand/actions
            ├── EmailModal.js           # Cold email generation
            ├── PrepModal.js            # Meeting prep modal
            └── TrackerPage.js          # Outreach tracker
```

---

## Notes

- This is UMass Amherst-focused. Professor data comes from Claude's training knowledge, supplemented by live faculty page scraping. Some details (emails, lab members) are best-effort.
- Always verify a professor's email and profile before reaching out.
- Not deployed — run it locally with your own API key.

---

Part of my [10-week summer build series](https://github.com/jagathikommi12-ship-it).
