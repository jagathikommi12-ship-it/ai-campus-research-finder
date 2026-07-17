import { useState, useEffect } from 'react';
import './App.css';
import SearchPage from './components/SearchPage';
import TrackerPage from './components/TrackerPage';
import localforage from 'localforage';

const API = 'http://localhost:3001';

export default function App() {
  const [view, setView]               = useState('search');
  const [page, setPage]               = useState('finder');
  const [loading, setLoading]         = useState(false);
  const [professors, setProfessors]   = useState([]);
  const [searchMeta, setSearchMeta]   = useState(null);
  const [tracked, setTracked]         = useState([]);
  const [departments, setDepartments] = useState([]);
  const [resumeData, setResumeData]   = useState(null);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/departments`)
      .then(r => r.json())
      .then(setDepartments)
      .catch(() => {});
  }, []);

  useEffect(() => {
    localforage.getItem('research-tracker').then(val => {
      if (val) setTracked(val);
    });
  }, []);

  const saveTracked = (list) => {
    setTracked(list);
    localforage.setItem('research-tracker', list);
  };

  const handleSearch = async ({ topic, selectedDepts }) => {
    setLoading(true);
    setView('results');
    setSearchError('');
    try {
      const res = await fetch(`${API}/api/professors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, departments: selectedDepts })
      });
      const data = await res.json();
      if (data.error) { setSearchError(data.error); setProfessors([]); }
      else { setProfessors(data.professors || []); }
      setSearchMeta({ topic });
    } catch (err) {
      setSearchError(`Could not reach the backend. Is it running? (${err.message})`);
      setProfessors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (prof) => {
    if (tracked.find(t => t.prof.name === prof.name && t.prof.department === prof.department)) return;
    saveTracked([...tracked, { prof, status: 'emailed', addedAt: new Date().toISOString() }]);
  };

  const handleUpdateStatus = (idx, status) => {
    const updated = [...tracked];
    updated[idx] = { ...updated[idx], status };
    saveTracked(updated);
  };

  const handleDeleteTracked = (idx) => saveTracked(tracked.filter((_, i) => i !== idx));

  const isTracked = (prof) => tracked.some(t => t.prof.name === prof.name && t.prof.department === prof.department);

  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-logo">research<span>finder</span></span>
        <button className={`nav-btn ${page === 'finder' ? 'active' : ''}`} onClick={() => setPage('finder')}>
          Find Professors
        </button>
        <button className={`nav-btn ${page === 'tracker' ? 'active' : ''}`} onClick={() => setPage('tracker')}>
          My Outreach {tracked.length > 0 && `(${tracked.length})`}
        </button>
      </nav>

      {page === 'finder' && (
        <SearchPage
          departments={departments}
          view={view}
          loading={loading}
          professors={professors}
          searchMeta={searchMeta}
          isTracked={isTracked}
          onSearch={handleSearch}
          onTrack={handleTrack}
          onNewSearch={() => setView('search')}
          searchError={searchError}
          onResumeChange={setResumeData}
          resumeData={resumeData}
          API={API}
        />
      )}

      {page === 'tracker' && (
        <TrackerPage
          tracked={tracked}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteTracked}
        />
      )}
    </div>
  );
}
