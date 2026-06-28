import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import './UserDashboard.css';
import DocumentViewer from '../Components/DocumentViewer';

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
    console.error("VITE_API_URL is not set — check your .env file.");
  }
  
const AGENTS = [
  { id: 'general',   name: 'General',   desc: 'General assistant' },
  { id: 'legal',     name: 'Legal',     desc: 'Legal document analysis' },
  { id: 'education', name: 'Education', desc: 'Learning & flashcards' },
  { id: 'finance',   name: 'Finance',   desc: 'Portfolio & investments' },
];
const DEMO_MODE = import.meta?.env?.VITE_DEMO_MODE === 'true';

// ── Icon helpers ──────────────────────────────────────────────────────────────
const Svg = ({ children, size = 18, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" className={className} {...rest}>
    {children}
  </svg>
);
const SendIcon   = () => <Svg strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>;
const PlusIcon   = () => <Svg><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;
const BotIcon    = () => <Svg size={16}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/></Svg>;
const UserIcon   = () => <Svg size={20}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;
const MenuIcon   = () => <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Svg>;
const ClipIcon   = () => <Svg><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.42-1.42l8.49-8.48"/></Svg>;
const XIcon      = () => <Svg size={13}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;
const FileIcon   = () => <Svg size={14}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></Svg>;
const LogoutIcon = () => <Svg size={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>;
const ChatIcon   = () => <Svg size={14}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
const PencilIcon = () => <Svg size={13}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
const TrashIcon  = () => <Svg size={13}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>;
const CheckIcon  = () => <Svg size={13}><polyline points="20 6 9 17 4 12"/></Svg>;
const ChevronLeftIcon = () => <Svg><polyline points="15 18 9 12 15 6"/></Svg>;
const FileTextIcon    = () => <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><path d="M10 9 9 9 8 9"/></Svg>;
const SearchIcon      = () => <Svg size={14}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>;
// New: flashcard icon for the link button
const FlashcardIcon   = () => <Svg size={15}><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="12" x2="22" y2="12"/></Svg>;

const fmtBytes = (b) => !b ? '' : b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;
const fmtDate  = (d) => {
  if (!d) return '';
  const dt = new Date(d), now = new Date();
  if (dt.toDateString() === now.toDateString())
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
const sessionLabel = (s) => {
  if (s?.title) return s.title;
  const m = s?.lastMessage?.message;
  if (m) return m.length > 32 ? m.slice(0, 32) + '…' : m;
  return `Chat ${(s?.sessionId || '').slice(0, 8)}`;
};
const Dots = () => <span className="dots"><span/><span/><span/></span>;

const FileChip = ({ file, progress, onRemove }) => (
  <div className="chip">
    <FileIcon/>
    <span className="chip-name">{file.name}</span>
    {file.size !== undefined && <span className="chip-sz">{fmtBytes(file.size)}</span>}
    {progress !== undefined && progress < 100 && (
      <div className="chip-progress">
        <div className="chip-progress-bar" style={{ width: `${progress}%` }}/>
      </div>
    )}
    {onRemove && <button className="chip-x" onClick={onRemove}><XIcon/></button>}
  </div>
);

const BotMsg = ({ text }) => {
  if (!text) return null;
  return (
    <div className="bot-markdown">
      <Markdown components={{
        p: ({node, ...props}) => <p style={{margin: 0, marginBottom: '8px'}} {...props}/>,
        br: () => <br/>,
      }}>
        {text}
      </Markdown>
    </div>
  );
};

// ── Flashcard extraction ──────────────────────────────────────────────────────

const sanitiseJsonString = (str) => {
  // Replace curly/smart quotes with straight quotes
  str = str.replace(/[\u201c\u201d\u2018\u2019]/g, (c) =>
    (c === '\u201c' || c === '\u201d') ? '"' : "'"
  );
  // Walk char-by-char: escape any " that appears inside a string value
  // (i.e. not the structural open/close quote)
  let out = '', inString = false, escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escaped)    { out += c; escaped = false; continue; }
    if (c === '\\') { out += c; escaped = true;  continue; }
    if (c === '"') {
      if (!inString) {
        inString = true; out += c;
      } else {
        // A structural closing quote is followed (ignoring whitespace) by : , } ]
        const rest = str.slice(i + 1).trimStart();
        if (/^[:\,\}\]]/.test(rest)) { inString = false; out += c; }
        else { out += '\\"'; } // internal quote — escape it
      }
      continue;
    }
    out += c;
  }
  return out;
};

const extractFlashcardData = (text) => {
  if (!text) return null;
  if (text.includes('[REDACTED]')) {
    console.warn('[Flashcard] JSON corrupted by redaction');
  }

  // Strip markdown ```json ... ``` fence if present
  let working = text;
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    working = fenceMatch[1].trim();
    console.log('[Flashcard] stripped fence, working:', working.slice(0, 200));
  }

  // Find the first '[' that is NOT the start of '[REDACTED]'
  let start = -1;
  for (let i = working.indexOf('['); i !== -1; i = working.indexOf('[', i + 1)) {
    if (working.slice(i, i + 11) === '[REDACTED]') continue;
    start = i;
    break;
  }
  if (start === -1) {
    console.log('[Flashcard] no [ found — not a flashcard response');
    return null;
  }

  if (text.trim() === '[REDACTED]') {
    return null;
  }
  // Find matching closing ] with bracket counter
  let depth = 0, end = -1;
  for (let i = start; i < working.length; i++) {
    if (working[i] === '[') depth++;
    else if (working[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) {
    console.log('[Flashcard] [ found but no matching ] — still streaming');
    return null;
  }

  // Try parsing raw, then sanitised
  const raw = working.slice(start, end + 1);
  console.log('[Flashcard] JSON slice (first 200):', raw.slice(0, 200));

  let parsed;
  try {
    parsed = JSON.parse(raw);
    console.log('[Flashcard] raw parse OK');
  } catch (e1) {
    console.log('[Flashcard] raw parse failed:', e1.message, '— trying sanitise');
    try {
      parsed = JSON.parse(sanitiseJsonString(raw));
      console.log('[Flashcard] sanitised parse OK');
    } catch (e2) {
      console.warn('[Flashcard] both parses failed:', e2.message);
      return null;
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.log('[Flashcard] parsed but not a non-empty array:', parsed);
    return null;
  }

  // Normalise key names: question/answer, front/back, term/definition, q/a
  const cards = parsed.map(card => {
    const q = card.question ?? card.front ?? card.term  ?? card.q ?? null;
    const a = card.answer   ?? card.back  ?? card.definition ?? card.a ?? null;
    if (!q || !a) {
      console.log('[Flashcard] card missing keys:', Object.keys(card));
      return null;
    }
    return { question: String(q), answer: String(a) };
  }).filter(Boolean);

  if (cards.length === 0) {
    console.warn('[Flashcard] zero valid cards after normalisation');
    return null;
  }

  // Summary = prose before the JSON array (or before the fence)
  const markerInOriginal = fenceMatch
    ? text.indexOf('```')
    : (() => {
        const probe = working.slice(start, start + 8);
        const idx = text.indexOf(probe);
        return idx === -1 ? 0 : idx;
      })();
  const summary = text.slice(0, markerInOriginal).trim();

  console.log(`[Flashcard] SUCCESS — ${cards.length} cards, summary length ${summary.length}`);
  return { cards, summary };
};

const extractChartData = (text) => {
  if (!text) return null;
  try {
    // strip markdown fences if present
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const working = fenceMatch ? fenceMatch[1].trim() : text.trim();

    // find first { (object not array)
    const start = working.indexOf('{');
    if (start === -1) return null;

    // find matching closing }
    let depth = 0, end = -1;
    for (let i = start; i < working.length; i++) {
      if (working[i] === '{') depth++;
      else if (working[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) return null;

    const parsed = JSON.parse(working.slice(start, end + 1));

    // validate it has the expected keys
    if (!parsed.severity || !parsed.categories || !parsed.top_risks) return null;

    return parsed;
  } catch {
    return null;
  }
};

// ── FlashcardLink inline component ───────────────────────────────────────────
const FlashcardLink = ({ cards, summary, navigate }) => (
  <div className="pm-flashcard-link-box">
    <FlashcardIcon/>
    <span className="pm-flashcard-link-label">
      {cards.length} flashcard{cards.length !== 1 ? 's' : ''} generated
    </span>
    <button
      className="pm-flashcard-link-btn"
      onClick={() => navigate('/flashcards', { state: { cards, summary } })}
    >
      View Flashcards →
    </button>
  </div>
);

const LegalChartView = ({ data }) => {
  const maxSev = Math.max(...data.severity.map(s => s.count), 1);
  const maxCat = Math.max(...data.categories.map(c => c.count), 1);
  const sevColors = { High: '#e74c3c', Medium: '#f39c12', Low: '#27ae60' };

  return (
    <div className="pm-chart-box">
      <h4 className="pm-chart-title">⚖️ Legal Risk Analysis</h4>

      {/* Severity bars */}
      <p className="pm-chart-section-label">Risk by Severity</p>
      {data.severity.map(s => (
        <div key={s.label} className="pm-chart-row">
          <span className="pm-chart-label">{s.label}</span>
          <div className="pm-chart-bar-bg">
            <div className="pm-chart-bar" style={{
              width: `${(s.count / maxSev) * 100}%`,
              background: sevColors[s.label] || '#888'
            }}/>
          </div>
          <span className="pm-chart-count">{s.count}</span>
        </div>
      ))}

      {/* Category bars */}
      <p className="pm-chart-section-label" style={{ marginTop: 12 }}>Risk by Category</p>
      {data.categories.map(c => (
        <div key={c.label} className="pm-chart-row">
          <span className="pm-chart-label">{c.label}</span>
          <div className="pm-chart-bar-bg">
            <div className="pm-chart-bar" style={{
              width: `${(c.count / maxCat) * 100}%`,
              background: '#3498db'
            }}/>
          </div>
          <span className="pm-chart-count">{c.count}</span>
        </div>
      ))}

      {/* Top risks table */}
      {data.top_risks?.length > 0 && (
        <>
          <p className="pm-chart-section-label" style={{ marginTop: 12 }}>Top Risks</p>
          {data.top_risks.map((r, i) => (
            <div key={i} className="pm-risk-row">
              <span className="pm-risk-badge" style={{ background: sevColors[r.severity] || '#888' }}>
                {r.severity}
              </span>
              <span className="pm-risk-title">{r.title}</span>
              <span className="pm-risk-clause">{r.clause}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
// ── Main component ────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const navigate   = useNavigate();
  const msgEnd     = useRef(null);
  const fileInput  = useRef(null);
  const textarea   = useRef(null);
  const dropZone   = useRef(null);

  const [user,          setUser]          = useState(null);
  const [sessions,      setSessions]      = useState([]);
  const [activeId,      setActiveId]      = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [files,         setFiles]         = useState([]);
  const [fileProgress,  setFileProgress]  = useState({});
  const [agent,         setAgent]         = useState('general');
  const [sending,       setSending]       = useState(false);
  const [streaming,     setStreaming]     = useState(false);
  const [histLoad,      setHistLoad]      = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [docSidebarOpen,setDocSidebarOpen]= useState(false);
  const dragCounter = useRef(0);
  const [dragging,      setDragging]      = useState(false);
  const [renamingId,    setRenamingId]    = useState(null);
  const [renameVal,     setRenameVal]     = useState('');
  const [uploadedDocs,  setUploadedDocs]  = useState([]);
  const [viewingDoc,    setViewingDoc]    = useState(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [authLoading,   setAuthLoading]   = useState(true);
  const [authError,     setAuthError]     = useState(null);

  // ── Auth ────────────────────────────────────────────────────────────────────
useEffect(() => {
  let cancelled = false;
  console.log("API_URL:", API_URL);

  fetch(`${API_URL}/auth/user`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(async (response) => {
      if (cancelled) return;   
      const data = await response.json();

      console.log("Response Data:", data);

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      if (data.user) {
        console.log("Authenticated:", data.user);
        setUser(data.user);
      } else if (DEMO_MODE) {
        setUser({
          email: "demo@example.com",
          firstName: "Demo",
        });

        setSessions([
          {
            sessionId: "demo",
            title: "Demo Session",
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          },
        ]);

        setActiveId("demo");
        setMessages([]);
      } else {
        console.log("No authenticated user.");
        navigate("/login");
      }
    })
    .catch((err) => {
      console.error("Auth Error:", err);

      if (DEMO_MODE) {
        setUser({
          email: "demo@example.com",
          firstName: "Demo",
        });

        setSessions([
          {
            sessionId: "demo",
            title: "Demo Session",
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          },
        ]);

        setActiveId("demo");
        setMessages([]);
      } else {
        navigate("/login");
      }
    })
    .finally(() => {
      setAuthLoading(false);
    });
    return () => { cancelled = true; }
}, [navigate]);

  // ── Sessions ────────────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/sessions`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to load sessions');
      const d = await r.json();
      setSessions(Array.isArray(d?.sessions) ? d.sessions : []);
    } catch { setSessions([]); }
  }, []);

  useEffect(() => { if (user) loadSessions(); }, [user, loadSessions]);

  // ── Load chat history when switching sessions ───────────────────────────────
  useEffect(() => {
    if (!activeId) { setMessages([]); setFiles([]); return; }
    setHistLoad(true);
    setFiles([]);
    const session = sessions.find(s => s.sessionId === activeId);
    if (session?.agent) setAgent(session.agent);
    if (session?.documents) {
      setUploadedDocs(session.documents.map(name => ({ name, size: 0 })));
    }
    fetch(`${API_URL}/api/chat/${activeId}`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed to load chat'); return r.json(); })
      .then(d => setMessages(
        (d.messages || []).flatMap(m => [
          { role: 'user', content: m.message, ts: m.timestamp, files: m.files },
          { role: 'bot',  content: m.answer,  ts: m.timestamp },
        ])
      ))
      .catch(() => setMessages([]))
      .finally(() => setHistLoad(false));
  }, [activeId, sessions]);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [input]);

  // ── Loading / error screens ─────────────────────────────────────────────────
  if (authLoading) return (
    <div className="pm-layout skeleton-loading" style={{ padding: 20, height: '100vh' }}>
      <div className="skeleton-card" style={{ height: 200, width: '60%' }}/>
      <div className="skeleton-text" style={{ width: '40%', height: 14, marginTop: 12 }}/>
      <div className="skeleton-text" style={{ width: '70%', height: 14, marginTop: 8 }}/>
    </div>
  );

  if (authError) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F5F6FF' }}>
      <div style={{ color: '#D63031', fontSize: '18px' }}>Error: {authError}</div>
    </div>
  );

  // ── Drag-and-drop ───────────────────────────────────────────────────────────
  const onDragEnter = (e) => { e.preventDefault(); dragCounter.current += 1; setDragging(true); };
  const onDragOver  = (e) => e.preventDefault();
  const onDragLeave = (e) => { dragCounter.current -= 1; if (!dragCounter.current) setDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => /\.(pdf|doc|docx|txt|png|jpe?g)$/i.test(f.name));
    if (dropped.length) {
      setUploadedDocs(prev => [...prev, ...dropped.map(f => ({ name: f.name, size: f.size, file: f }))]);
      setFiles(prev => [...prev, ...dropped]);
    }
  };

  // ── Progress simulation ─────────────────────────────────────────────────────
  const simulateProgress = (indices) => {
    const tick = (idx, val) => {
      if (val >= 90) return;
      setFileProgress(prev => ({ ...prev, [idx]: val }));
      setTimeout(() => tick(idx, Math.min(val + Math.random() * 15 + 5, 90)), 200);
    };
    indices.forEach(i => tick(i, 0));
  };
  const finalizeProgress = (indices) => {
    setFileProgress(prev => { const n = { ...prev }; indices.forEach(i => { n[i] = 100; }); return n; });
    setTimeout(() => setFileProgress({}), 800);
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  const send = async () => {
    const text = input.trim();
    if ((!text && files.length === 0) || sending || streaming) return;

    const pendingFiles = [...files];
    const fileIndices  = pendingFiles.map((_, i) => i);

    setMessages(prev => [...prev, {
      role: 'user', content: text, ts: new Date().toISOString(),
      files: pendingFiles.map(f => ({ name: f.name, size: f.size })),
    }]);
    setInput('');
    setSending(true);
    simulateProgress(fileIndices);

    let newSessionId = null;
    try {
      const form = new FormData();
      form.append('agent', agent);
      form.append('question', text);
      form.append('stream', 'true');

      // FIX (Task 2): always send the current activeId so the backend reuses
      // the same session instead of minting a new one on every message.
      if (activeId) form.append('sessionId', activeId);

      pendingFiles.forEach(f => {
        form.append('files', f);
        form.append('documents', f.name);
      });

      const sessionDocs = sessions.find(s => s.sessionId === activeId)?.documents || [];
      sessionDocs.forEach(d => form.append('documents', d));

      const r = await fetch(`${API_URL}/api/chat`, {
        method: 'POST', credentials: 'include', body: form,
      });

      finalizeProgress(fileIndices);

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${r.status}`);
      }

      // FIX (Task 2): read X-Session-Id from proxy response so the UI learns
      // the session id even for the first message (header is now forwarded
      // correctly by server.js).
      newSessionId = r.headers.get('x-session-id') || r.headers.get('X-Session-Id');
      if (!activeId && newSessionId) setActiveId(newSessionId);

      const reader = r.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let botIndex  = null;
      setStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const token = line.slice(6);
          if (token === '[DONE]') break;
          setMessages(prev => {
            if (token.includes('[REDACTED]')) {
              console.warn('TOKEN CONTAINS REDACTION:', token);
            }
            if (botIndex === null) {
              botIndex = prev.length;
              // streaming:true defers flashcard extraction until response is complete
              return [...prev, { role: 'bot', content: token, ts: new Date().toISOString(), streaming: true }];
            }
            return prev.map((m, i) => i === botIndex ? { ...m, content: m.content + token } : m);
          });
        }
      }

      // Mark stream as complete so flashcard extraction runs on full content
      if (botIndex !== null) {
        setMessages(prev => prev.map((m, i) =>
          i === botIndex ? { ...m, streaming: false } : m
        ));
      }

      setStreaming(false);
      setSending(false);
      setFiles([]);

      const uploadedFileNames = uploadedDocs.map(d => d.name);
      const currentSessionId  = newSessionId || activeId;

      if (!activeId && newSessionId) {
        // Brand-new session — fetch the full session list from the server so
        // the sidebar shows it immediately with correct metadata.
        await loadSessions();
        if (uploadedFileNames.length > 0) {
          updateSessionMetadata(newSessionId, agent, uploadedFileNames);
        }
      } else if (currentSessionId) {
        // Existing session — update in-place without a round-trip.
        const existingDocs = sessions.find(s => s.sessionId === currentSessionId)?.documents || [];
        const newDocs = uploadedFileNames.length > 0
          ? [...new Set([...existingDocs, ...uploadedFileNames])]
          : undefined;

        setSessions(prev => prev.map(s =>
          s.sessionId === currentSessionId
            ? {
                ...s,
                lastMessage:  { message: text },
                updatedAt:    new Date().toISOString(),
                messageCount: (s.messageCount || 0) + 1,
                documents:    newDocs !== undefined ? newDocs : s.documents,
              }
            : s
        ));

        if (uploadedFileNames.length > 0) {
          updateSessionMetadata(currentSessionId, agent, newDocs);
        }
      }
    } catch (err) {
      finalizeProgress(fileIndices);
      setSending(false);
      setStreaming(false);
      setFiles([]);
      setUploadedDocs([]);
      setMessages(prev => [...prev, {
        role: 'bot', content: `⚠ ${err.message}`, ts: new Date().toISOString(), isError: true,
      }]);
    } finally {
      setTimeout(() => textarea.current?.focus(), 50);
    }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const newChat   = () => { setActiveId(null); setMessages([]); setFiles([]); setUploadedDocs([]); setFileProgress({}); textarea.current?.focus(); };

  const logout = async () => {
    try { await fetch(`${API_URL}/auth/logout`, { credentials: 'include', method: 'GET', mode: 'cors' }); }
    catch (err) { console.error('Logout error:', err); }
    setUser(null); setSessions([]); setMessages([]);
    navigate('/login', { replace: true });
  };

  const startRename  = (e, s) => { e.stopPropagation(); setRenamingId(s.sessionId); setRenameVal(s.title || sessionLabel(s)); };
  const commitRename = async (sessionId) => {
    const title = renameVal.trim();
    if (!title) { setRenamingId(null); return; }
    try {
      await fetch(`${API_URL}/api/chat/${sessionId}/rename`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setSessions(prev => prev.map(s => s.sessionId === sessionId ? { ...s, title } : s));
    } catch { /* silent */ }
    setRenamingId(null);
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    try {
      await fetch(`${API_URL}/api/chat/${sessionId}`, { method: 'DELETE', credentials: 'include' });
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (activeId === sessionId) { setActiveId(null); setMessages([]); }
    } catch { /* silent */ }
  };

  const removeDoc = (index) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateSessionMetadata = async (sessionId, newAgent, newDocs) => {
    if (!sessionId || !user?.email) return;
    try {
      await fetch(`${API_URL}/api/chat/${sessionId}/metadata`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: newDocs }),
      });
      setSessions(prev => prev.map(s =>
        s.sessionId === sessionId
          ? { ...s, agent: newAgent ?? s.agent, documents: newDocs ?? s.documents }
          : s
      ));
    } catch { /* silent */ }
  };

  const openDocViewer    = (doc) => { setViewingDoc(doc); setDocSidebarOpen(true); };
  const handleAskSelection = (selectedText) => {
    setInput(prev => prev ? prev + '\n\n"' + selectedText + '"\n\n' : '"' + selectedText + '"\n\n');
    setViewingDoc(null);
    textarea.current?.focus();
  };

  const activeSession    = sessions.find(s => s.sessionId === activeId);
  const busy             = sending || streaming;
  const filteredSessions = sessions.filter(s =>
    sessionLabel(s).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className={`pm-layout ${dragging ? 'pm-dragging' : ''}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      ref={dropZone}
    >
      {dragging && (
        <div className="pm-drop-overlay">
          <div className="pm-drop-msg"><ClipIcon/> Drop files here</div>
        </div>
      )}

      {/* ── Left sidebar ──────────────────────────────────────────────────── */}
      <aside className={`pm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="pm-sb-user-section">
          <div className="pm-user-icon"><UserIcon/></div>
        </div>

        <div className="pm-sb-new-chat">
          <button className="pm-new-btn" onClick={newChat}><PlusIcon/> New Chat</button>
        </div>

        <div className="pm-sb-search">
          <div className="pm-search-row">
            <SearchIcon/>
            <input
              type="text" className="pm-search-input" placeholder="Search chats..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="pm-search-clear" onClick={() => setSearchQuery('')}><XIcon/></button>
            )}
          </div>
        </div>

        <div className="pm-sessions-container">
          <div className="pm-sessions-rectangle">
            <nav className="pm-session-list">
              {filteredSessions.length === 0 && (
                <p className="pm-empty">
                  {searchQuery ? 'No matching chats found' : 'No chats yet. Start one!'}
                </p>
              )}
              {filteredSessions.map(s => (
                <div
                  key={s.sessionId}
                  className={`pm-session ${activeId === s.sessionId ? 'pm-session--active' : ''}`}
                  onClick={() => renamingId !== s.sessionId && setActiveId(s.sessionId)}
                >
                  <ChatIcon/>
                  {renamingId === s.sessionId ? (
                    <div className="pm-rename-row" onClick={e => e.stopPropagation()}>
                      <input
                        className="pm-rename-input" value={renameVal} autoFocus
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename(s.sessionId);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                      />
                      <button className="pm-action-btn" onClick={() => commitRename(s.sessionId)}><CheckIcon/></button>
                      <button className="pm-action-btn" onClick={() => setRenamingId(null)}><XIcon/></button>
                    </div>
                  ) : (
                    <>
                      <div className="pm-session-info">
                        <span className="pm-session-label">{sessionLabel(s)}</span>
                        <span className="pm-session-meta">
                          {s.agent && <span className="pm-session-domain">{s.agent}</span>}
                          {s.messageCount > 0 && <>{s.messageCount} msg{s.messageCount !== 1 ? 's' : ''} · </>}
                          {fmtDate(s.updatedAt || s.createdAt)}
                        </span>
                      </div>
                      <div className="pm-session-actions">
                        <button className="pm-action-btn" onClick={e => startRename(e, s)} title="Rename"><PencilIcon/></button>
                        <button className="pm-action-btn pm-action-btn--del" onClick={e => deleteSession(e, s.sessionId)} title="Delete"><TrashIcon/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="pm-sb-foot">
          <button className="pm-logout-btn" onClick={logout}>
            <LogoutIcon/><span>Logout</span>
          </button>
        </div>
      </aside>

      {!sidebarOpen && (
        <button className="pm-sidebar-toggle-closed" onClick={() => setSidebarOpen(true)} title="Open sidebar">
          <MenuIcon/>
        </button>
      )}

      {/* ── Main chat ─────────────────────────────────────────────────────── */}
      <div className="pm-chat">
        <header className="pm-topbar">
          {sidebarOpen && (
            <button className="pm-icon-btn" onClick={() => setSidebarOpen(false)}>
              <ChevronLeftIcon/>
            </button>
          )}
          <span className="pm-topbar-title">
            {activeSession ? sessionLabel(activeSession) : 'New conversation'}
          </span>

          <div className="pm-domain-selector">
            <label className="pm-domain-label">Domain:</label>
            <div className="pm-domain-dropdown">
              <select
                className="pm-domain-select"
                value={agent}
                onChange={e => {
                  const a = e.target.value;
                  setAgent(a);
                  if (activeId) updateSessionMetadata(activeId, a);
                }}
                disabled={busy}
              >
                {AGENTS.map(a => (
                  <option key={a.id} value={a.id} className="quicksand">{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="pm-messages">
          {histLoad && <div className="pm-center"><Dots/></div>}

          {!histLoad && messages.length === 0 && (
            <div className="pm-welcome">
              <div className="pm-welcome-glyph">✦</div>
              <h2>What can I help with?</h2>
              <p>Drop a document or ask anything. Drag files anywhere to attach.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`pm-msg pm-msg--${m.role}`}>
              <div className="pm-msg-avatar">
                {m.role === 'user' ? <UserIcon/> : <BotIcon/>}
              </div>
              <div className={`pm-bubble pm-bubble--${m.role}${m.isError ? ' pm-bubble--err' : ''}`}>
                {m.role === 'user' ? (
                  <>
                    {m.content && <p className="pm-user-text">{m.content}</p>}
                    {m.files?.length > 0 && (
                      <div className="pm-msg-files">
                        {m.files.map((f, fi) => <FileChip key={fi} file={f}/>)}
                      </div>
                    )}
                  </>
                ) : (
                  (() => {
                    // Only run extraction after streaming is complete
                    if (!m.streaming && m.content)  {
                      console.log("BOT FINAL:", m.content.slice(0, 200));
                      const fc = extractFlashcardData(m.content);
                      console.log("FLASHCARD RESULT:", fc);
                      if (fc) {
                        return (
                          <>
                            {fc.summary && <BotMsg text={fc.summary}/>}
                            <FlashcardLink
                              cards={fc.cards}
                              summary={fc.summary}
                              navigate={navigate}
                            />
                          </>
                        );
                      }const chart = extractChartData(m.content);
                      if (chart) {
                        return <LegalChartView data={chart}/>;
                      }
                    }
                    return <BotMsg text={m.content}/>;
                  })()
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="pm-msg pm-msg--bot">
              <div className="pm-msg-avatar"><BotIcon/></div>
              <div className="pm-bubble pm-bubble--bot pm-bubble--thinking"><Dots/></div>
            </div>
          )}

          <div ref={msgEnd}/>
        </div>

        <div className="pm-input-area">
          {files.length > 0 && (
            <div className="pm-file-preview">
              {files.map((f, i) => (
                <FileChip key={i} file={f} progress={fileProgress[i]} onRemove={() => removeDoc(i)}/>
              ))}
            </div>
          )}

          <div className="pm-input-row">
            <input
              type="file" ref={fileInput}
              onChange={e => {
                const newFiles = Array.from(e.target.files);
                setFiles(p => [...p, ...newFiles]);
                setUploadedDocs(prev => [...prev, ...newFiles.map(f => ({ name: f.name, size: f.size, file: f }))]);
                e.target.value = '';
              }}
              style={{ display: 'none' }} multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            />
            <button className="pm-icon-btn pm-attach" onClick={() => fileInput.current?.click()} disabled={busy} title="Attach files">
              <ClipIcon/>
            </button>
            <textarea
              ref={textarea} className="pm-textarea" value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask anything… or drop files anywhere" disabled={busy} rows={1} align="center"
            />
            <button
              className={`pm-send ${(!input.trim() && files.length === 0) || busy ? 'pm-send--off' : ''}`}
              onClick={send}
              disabled={busy || (!input.trim() && files.length === 0)}
            >
              {streaming ? <Dots/> : <SendIcon/>}
            </button>
          </div>
          <p className="pm-hint">Enter to send · Shift+Enter for new line · Drag files anywhere</p>
        </div>
      </div>

      {/* ── Document sidebar ──────────────────────────────────────────────── */}
      <aside className={`pm-doc-sidebar ${docSidebarOpen ? 'open' : ''}`}>
        <div className="pm-doc-sb-head">
          <div className="pm-doc-title"><FileTextIcon/><span>Documents</span></div>
          <button className="pm-doc-toggle" onClick={() => setDocSidebarOpen(false)}><XIcon/></button>
        </div>
        <div className="pm-doc-list">
          {uploadedDocs.length === 0 && <p className="pm-doc-empty">No documents uploaded</p>}
          {uploadedDocs.map((doc, idx) => (
            <div key={idx} className="pm-doc-item" onClick={() => openDocViewer(doc)}>
              <FileIcon/>
              <div className="pm-doc-info">
                <span className="pm-doc-name">{doc.name}</span>
                <span className="pm-doc-size">{fmtBytes(doc.size)}</span>
              </div>
              <button className="pm-doc-remove" onClick={e => { e.stopPropagation(); removeDoc(idx); }}>
                <XIcon/>
              </button>
            </div>
          ))}
        </div>
        <div className="pm-doc-actions">
          <button className="pm-doc-clear" onClick={() => { setUploadedDocs([]); setFiles([]); }}>
            Clear All Documents
          </button>
        </div>
      </aside>

      {!docSidebarOpen && (
        <button className="pm-doc-toggle-closed" onClick={() => setDocSidebarOpen(true)}>
          <FileTextIcon/>
        </button>
      )}

      {viewingDoc && (
        <DocumentViewer
          file={viewingDoc.file || viewingDoc}
          onAskSelection={handleAskSelection}
          onClose={() => setViewingDoc(null)}
          open={true}
        />
      )}
    </div>
  );
}