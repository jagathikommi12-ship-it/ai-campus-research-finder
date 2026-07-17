import { useState } from 'react';
import ProfessorCard from './ProfessorCard';

export default function SearchPage({
  departments, view, loading, professors, searchMeta,
  isTracked, onSearch, onTrack, onNewSearch, API
}) {
  const [topic, setTopic]                   = useState('');
  const [selectedDepts, setSelectedDepts]   = useState([]);
  const [studentBackground, setBackground]  = useState('');

  const toggleDept = (dept) => {
    setSelectedDepts(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const depts = selectedDepts.length > 0 ? selectedDepts : departments;
    onSearch({ topic: topic.trim(), selectedDepts: depts, studentBackground });
  };

  if (view === 'results') {
    return (
      <div className="page">
        {loading ? (
          <div className="loading-wrap">
            <div className="loading-spinner" />
            <p>Searching faculty pages across departments...</p>
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
            {professors.length === 0 ? (
              <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>
                No professors found. Try a broader topic or different departments.
              </p>
            ) : (
              professors.map((prof, i) => (
                <ProfessorCard
                  key={i}
                  prof={prof}
                  topic={searchMeta?.topic}
                  studentBackground={searchMeta?.studentBackground}
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
        <p>Search by topic — Claude will scan UMass faculty pages and match you with relevant professors.</p>
      </div>

      <form className="search-box" onSubmit={handleSubmit}>
        <label className="search-label">What are you interested in researching?</label>
        <div className="search-input-row">
          <input
            className="search-input"
            type="text"
            placeholder="e.g. machine learning, computational linguistics, genomics..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
          <button className="btn-search" type="submit" disabled={!topic.trim()}>
            Find professors
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label className="search-label">Filter by department (optional — defaults to all)</label>
          <div className="dept-grid">
            {departments.map(dept => (
              <button
                key={dept}
                type="button"
                className={`dept-chip ${selectedDepts.includes(dept) ? 'selected' : ''}`}
                onClick={() => toggleDept(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        <div className="background-field">
          <label className="search-label">Your background (helps personalize emails)</label>
          <textarea
            className="background-input"
            rows={2}
            placeholder="e.g. CS sophomore, took Intro ML, done a small NLP project, interested in summer research..."
            value={studentBackground}
            onChange={e => setBackground(e.target.value)}
          />
        </div>
      </form>
    </div>
  );
}
