import { useState } from 'react';
import ProfessorCard from './ProfessorCard';

const TOPICS = [
  // AI & Computing
  'Machine Learning & AI', 'Natural Language Processing', 'Computer Vision',
  'Robotics & Autonomous Systems', 'Human-Computer Interaction',
  'Cybersecurity & Privacy', 'Systems & Networking', 'Computer Architecture',
  'Software Engineering', 'Programming Languages & Compilers',
  'Theory & Algorithms', 'Database Systems', 'Graphics & Visualization',
  'Quantum Computing', 'Data Science & Analytics',
  // Interdisciplinary
  'Computational Biology & Bioinformatics', 'Neuroscience & Brain-Computer Interfaces',
  'Linguistics & Language Technology', 'Social Computing & AI Ethics',
  'Ecology & Environmental Science', 'Cognitive Science',
];

export default function SearchPage({
  departments, view, loading, professors, searchMeta, searchError,
  isTracked, onSearch, onTrack, onNewSearch, onResumeChange, resumeData, API
}) {
  const [selectedTopics, setSelectedTopics]   = useState([]);
  const [selectedDepts, setSelectedDepts]     = useState([]);
  const [resumeLabel, setResumeLabel]         = useState('');

  const toggleTopic = (t) =>
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const toggleDept = (d) =>
    setSelectedDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeLabel(file.name);
    const reader = new FileReader();
    if (file.type === 'application/pdf') {
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        onResumeChange({ content: base64, type: 'pdf' });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => onResumeChange({ content: reader.result, type: 'text' });
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTopics.length) return;
    const depts = selectedDepts.length > 0 ? selectedDepts : departments;
    onSearch({ topic: selectedTopics.join(', '), selectedDepts: depts });
  };

  if (view === 'results') {
    return (
      <div className="page">
        {loading ? (
          <div className="loading-wrap">
            <div className="loading-spinner" />
            <p>Finding professors across UMass departments...</p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <h2>Results for "{searchMeta?.topic}"</h2>
              <p>
                {professors.length} professor{professors.length !== 1 ? 's' : ''} found
                {' · '}
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                  onClick={onNewSearch}
                >
                  Search again
                </button>
              </p>
            </div>
            {searchError ? (
              <p style={{ color: 'var(--red)', fontSize: '14px', background: 'var(--red-bg)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--red)' }}>
                ⚠️ {searchError}
              </p>
            ) : professors.length === 0 ? (
              <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>
                No professors found. Try selecting different topics or departments.
              </p>
            ) : (
              professors.map((prof, i) => (
                <ProfessorCard
                  key={i}
                  prof={prof}
                  topic={searchMeta?.topic}
                  resumeData={resumeData}
                  isTracked={isTracked(prof)}
                  onTrack={() => onTrack(prof)}
                  API={API}
                />
              ))
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="search-hero">
        <h1>Find your next <span>research lab</span></h1>
        <p>Pick your interests — Claude will match you with relevant UMass professors.</p>
      </div>

      <form className="search-box" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <label className="search-label" style={{ margin: 0 }}>What are you interested in? (select all that apply)</label>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            onClick={() => setSelectedTopics(selectedTopics.length === TOPICS.length ? [] : [...TOPICS])}
          >
            {selectedTopics.length === TOPICS.length ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div className="dept-grid">
          {TOPICS.map(t => (
            <button
              key={t}
              type="button"
              className={`dept-chip ${selectedTopics.includes(t) ? 'selected' : ''}`}
              onClick={() => toggleTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '24px' }}>
          <label className="search-label">Filter by department (optional — defaults to all)</label>
          <div className="dept-grid">
            {departments.map(d => (
              <button
                key={d}
                type="button"
                className={`dept-chip ${selectedDepts.includes(d) ? 'selected' : ''}`}
                onClick={() => toggleDept(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="background-field" style={{ marginTop: '24px' }}>
          <label className="search-label">Upload your resume (optional — for personalized emails)</label>
          <label className="resume-upload-label">
            <input
              type="file"
              accept=".pdf,.txt"
              style={{ display: 'none' }}
              onChange={handleResume}
            />
            <span className="resume-upload-btn">
              {resumeLabel ? `✓ ${resumeLabel}` : '+ Upload resume (.pdf or .txt)'}
            </span>
          </label>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            className="btn-search"
            type="submit"
            disabled={selectedTopics.length === 0}
            style={{ width: '100%' }}
          >
            {selectedTopics.length === 0 ? 'Select at least one topic' : `Find professors →`}
          </button>
        </div>
      </form>
    </div>
  );
}
