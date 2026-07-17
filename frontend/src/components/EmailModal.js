import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function EmailModal({ prof, topic, resumeData, API, onClose }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    fetch(`${API}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professor: prof, topic, resumeData })
    })
      .then(r => r.json())
      .then(data => setEmail(data.email || 'Could not generate email.'))
      .catch(() => setEmail('Error generating email. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Cold email → {prof.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p className="generating">Writing your email{resumeData ? ' using your resume' : ''}...</p>
          ) : (
            <div className="email-text">{email}</div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {!loading && <button className="btn-copy" onClick={handleCopy}>{copied ? '✓ Copied!' : 'Copy email'}</button>}
        </div>
      </div>
    </div>,
    document.body
  );
}
