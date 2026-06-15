import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const BUGS_PER_PAGE = 10;

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#f5f6fa',
  card:        '#ffffff',
  border:      '#e2e6ea',
  textMain:    '#1a1d23',
  textSub:     '#6b7280',
  textMuted:   '#9ca3af',
  primary:     '#3b82f6',
  primaryHvr:  '#2563eb',
  errorBg:     '#fef2f2',
  errorBorder: '#fecaca',
  errorText:   '#dc2626',
  // Status badge colours
  openBg:      '#fef2f2', openText:   '#dc2626', openBorder:   '#fecaca',
  inProgBg:    '#fffbeb', inProgText: '#d97706', inProgBorder: '#fde68a',
  closedBg:    '#f0fdf4', closedText: '#16a34a', closedBorder: '#bbf7d0',
};

const STATUS_STYLE = {
  open:        { background: C.openBg,   color: C.openText,   border: `1px solid ${C.openBorder}`   },
  in_progress: { background: C.inProgBg, color: C.inProgText, border: `1px solid ${C.inProgBorder}` },
  closed:      { background: C.closedBg, color: C.closedText, border: `1px solid ${C.closedBorder}` },
};

const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', closed: 'Closed' };

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: C.bg,
    display: 'flex',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  main: { width: '100%', maxWidth: '660px', padding: '40px 16px 40px' },
  header:   { textAlign: 'center', marginBottom: '32px' },
  title:    { fontSize: '24px', fontWeight: '700', color: C.textMain, margin: '0 0 4px', letterSpacing: '-0.4px' },
  subtitle: { fontSize: '13px', color: C.textSub, margin: 0 },
  inputRow: { display: 'flex', gap: '8px', marginBottom: '16px' },
  input: {
    flex: 1, padding: '10px 14px', fontSize: '14px',
    border: `1px solid ${C.border}`, borderRadius: '8px',
    background: C.card, color: C.textMain, outline: 'none',
  },
  btnPrimary: {
    padding: '10px 20px', fontSize: '14px', fontWeight: '600',
    color: '#fff', background: C.primary, border: 'none',
    borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', background: C.errorBg,
    border: `1px solid ${C.errorBorder}`, borderRadius: '8px',
    marginBottom: '14px', fontSize: '13px', color: C.errorText,
  },
  meta: { fontSize: '12px', color: C.textSub, marginBottom: '10px' },
  list: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', background: C.card,
    border: `1px solid ${C.border}`, borderRadius: '8px',
  },
  badge: {
    fontSize: '11px', fontWeight: '600', padding: '3px 8px',
    borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0,
    textTransform: 'uppercase', letterSpacing: '0.3px',
  },
  bugTitle:       { flex: 1, fontSize: '14px', color: C.textMain, lineHeight: '1.4' },
  bugTitleClosed: { textDecoration: 'line-through', color: C.textMuted },
  actions: { display: 'flex', gap: '6px', flexShrink: 0 },
  btnSmall: {
    padding: '5px 10px', fontSize: '12px', fontWeight: '500',
    border: `1px solid ${C.border}`, borderRadius: '6px',
    background: 'transparent', cursor: 'pointer', color: C.textSub,
  },
  emptyState: { textAlign: 'center', padding: '48px 0', color: C.textSub, fontSize: '14px' },
  emptyIcon:  { fontSize: '32px', marginBottom: '8px' },
  // Pagination
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '4px', marginTop: '16px',
  },
  btnPage: {
    minWidth: '32px', height: '32px', padding: '0 8px',
    fontSize: '13px', fontWeight: '500',
    border: `1px solid ${C.border}`, borderRadius: '6px',
    background: C.card, color: C.textSub, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnPageActive:   { background: C.primary, color: '#fff', border: `1px solid ${C.primary}`, fontWeight: '600' },
  btnPageDisabled: { opacity: 0.35, cursor: 'default' },
  pageInfo: { fontSize: '12px', color: C.textMuted, margin: '0 6px' },
};

// ── Component ─────────────────────────────────────────────────────────────────
function App() {
  const [bugs, setBugs]        = useState([]);
  const [newBug, setNewBug]    = useState('');
  const [error, setError]      = useState('');
  const [currentPage, setPage] = useState(1);

  useEffect(() => { fetchBugs(); }, []);

  const fetchBugs = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/bugs`);
      const data = await res.json();
      setBugs(data);
      setPage(1);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const reportBug = async () => {
    if (!newBug.trim()) return;
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/bugs`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: newBug }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to report bug');
        return;
      }
      setNewBug('');
      fetchBugs();
    } catch (err) {
      setError('Failed to report bug');
    }
  };

  // STUDENT TODO: implement deleteBug
  // Call DELETE /api/bugs/:id, then call fetchBugs() to refresh the list.
  const deleteBug = async (id) => {
    // TODO: your code here
  };

  // STUDENT TODO: implement updateBug
  // Call PUT /api/bugs/:id with the updated status, then call fetchBugs().
  // Toggle between 'open' and 'closed', or cycle open → in_progress → closed → open.
  const updateBug = async (bug) => {
    // TODO: your code here
  };

  // OPTIONAL CHALLENGE: implement cycleStatus (full 3-state cycle)
  // const STATUS_CYCLE = { open: 'in_progress', in_progress: 'closed', closed: 'open' };
  // const cycleStatus = async (bug) => {
  //   const nextStatus = STATUS_CYCLE[bug.status];
  //   await fetch(`${API_URL}/api/bugs/${bug.id}`, {
  //     method: 'PUT',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ title: bug.title, status: nextStatus }),
  //   });
  //   fetchBugs();
  // };

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(bugs.length / BUGS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const start      = (safePage - 1) * BUGS_PER_PAGE;
  const pageBugs   = bugs.slice(start, start + BUGS_PER_PAGE);
  const openCount  = bugs.filter(b => b.status === 'open').length;

  const pageNumbers = () => {
    const pages = [];
    const delta = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) {
        pages.push(i);
      }
    }
    const result = [];
    let prev = 0;
    for (const p of pages) {
      if (p - prev > 1) result.push('…');
      result.push(p);
      prev = p;
    }
    return result;
  };

  return (
    <div style={S.page}>
      <div style={S.main}>

        {/* Header */}
        <div style={S.header}>
          <h1 style={S.title}>Bug Tracker System</h1>
          <p style={S.subtitle}>DevOps Project — Greenwich Vietnam</p>
        </div>

        {/* Input row */}
        <div style={S.inputRow}>
          <input
            style={S.input}
            value={newBug}
            onChange={(e) => { setNewBug(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && reportBug()}
            placeholder="Describe the bug..."
          />
          <button
            style={S.btnPrimary}
            onClick={reportBug}
            onMouseEnter={e => e.currentTarget.style.background = C.primaryHvr}
            onMouseLeave={e => e.currentTarget.style.background = C.primary}
          >
            Report
          </button>
        </div>

        {/* Error */}
        {error && <div style={S.errorBox}>⚠ {error}</div>}

        {/* Meta count */}
        {bugs.length > 0 && (
          <p style={S.meta}>
            {openCount} open · {bugs.length} total
            {totalPages > 1 && ` · page ${safePage} of ${totalPages}`}
          </p>
        )}

        {/* Bug list */}
        {bugs.length > 0 ? (
          <>
            <ul style={S.list}>
              {pageBugs.map(bug => (
                <li key={bug.id} style={S.item}>

                  {/* Status badge */}
                  <span style={{ ...S.badge, ...STATUS_STYLE[bug.status] }}>
                    {STATUS_LABEL[bug.status] || bug.status}
                  </span>

                  {/* Title */}
                  <span style={{
                    ...S.bugTitle,
                    ...(bug.status === 'closed' ? S.bugTitleClosed : {}),
                  }}>
                    {bug.title}
                  </span>

                  {/* Actions */}
                  <div style={S.actions}>
                    {/* STUDENT TODO: Replace this placeholder with a real Update button */}
                    {/* that calls updateBug(bug) to change the status */}
                    <span style={{ fontSize: '18px' }}>
                      {bug.status === 'closed' ? '✅' : bug.status === 'in_progress' ? '🔄' : '🔴'}
                    </span>

                    {/* STUDENT TODO: Add a Delete button that calls deleteBug(bug.id) */}

                    {/* OPTIONAL CHALLENGE: replace the span above with a cycleStatus button */}
                  </div>

                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={S.pagination}>
                <button
                  style={{ ...S.btnPage, ...(safePage === 1 ? S.btnPageDisabled : {}) }}
                  onClick={() => safePage > 1 && setPage(safePage - 1)}
                  disabled={safePage === 1}
                >
                  ‹
                </button>

                {pageNumbers().map((p, i) =>
                  p === '…'
                    ? <span key={`e${i}`} style={S.pageInfo}>…</span>
                    : <button
                        key={p}
                        style={{ ...S.btnPage, ...(p === safePage ? S.btnPageActive : {}) }}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                )}

                <button
                  style={{ ...S.btnPage, ...(safePage === totalPages ? S.btnPageDisabled : {}) }}
                  onClick={() => safePage < totalPages && setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                >
                  ›
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>🐛</div>
            <div>No bugs reported. Add one above!</div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
