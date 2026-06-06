import React, { useState, useEffect, useCallback } from "react";

const API = "https://num-data.vercel.app/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("store");
  const [inputValue, setInputValue] = useState("");
  const [numbers, setNumbers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchNumbers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/numbers`);
      const data = await res.json();
      if (data.success) setNumbers(data.numbers);
      else setError(data.message || "Failed to load numbers.");
    } catch {
      setError("Cannot reach server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNumbers(); }, [fetchNumbers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (inputValue === "") return setError("Please enter a number.");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: inputValue }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Number ${data.number} saved — ${data.total} total`);
        setInputValue("");
        fetchNumbers();
      } else setError(data.message);
    } catch { setError("Cannot reach server."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      const res = await fetch(`${API}/numbers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) setNumbers(data.numbers);
      else setError(data.message || "Delete failed.");
    } catch { setError("Delete failed."); }
  };

  const filtered = (() => {
    const q = search.trim();
    if (!q) return numbers;
    const terms = q.split(",").map(t => t.trim()).filter(Boolean);
    if (terms.length === 1) {
      const searchNum = parseFloat(terms[0]);
      const exactIndex = numbers.findIndex(n => parseFloat(n.value) === searchNum);
      if (exactIndex === -1) return [];
      return numbers.slice(exactIndex, exactIndex + 9);
    }
    for (let i = 0; i <= numbers.length - terms.length; i++) {
      const match = terms.every((term, j) => {
        const sn = parseFloat(term), st = parseFloat(numbers[i + j].value);
        return !isNaN(sn) && !isNaN(st) && sn === st;
      });
      if (match) return numbers.slice(i, i + terms.length + 8);
    }
    return [];
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Mono', monospace;
          background: #0a0a08;
          color: #e8e4d9;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          background: #0a0a08;
          position: relative;
          overflow-x: hidden;
        }

        .noise {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
        }

        .accent-line {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f0a500, #f0a500 60%, transparent);
          z-index: 10;
        }

        .container {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 24px 60px;
          position: relative;
          z-index: 1;
        }

        /* HEADER */
        .header {
          padding: 52px 0 40px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          border-bottom: 1px solid #1e1e1a;
          margin-bottom: 40px;
        }

        .header-left {}

        .wordmark {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 2rem;
          letter-spacing: -0.02em;
          color: #f0f0e8;
          line-height: 1;
          margin-bottom: 6px;
        }

        .wordmark span {
          color: #f0a500;
        }

        .tagline {
          font-size: 11px;
          color: #555550;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .header-stat {
          text-align: right;
        }

        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: #f0a500;
          line-height: 1;
        }

        .stat-label {
          font-size: 10px;
          color: #555550;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        /* TABS */
        .tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 32px;
          background: #111110;
          border: 1px solid #1e1e1a;
          border-radius: 6px;
          padding: 3px;
        }

        .tab {
          flex: 1;
          padding: 10px 20px;
          background: transparent;
          border: none;
          color: #555550;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .tab:hover { color: #999990; background: #181816; }

        .tab.active {
          background: #1a1a16;
          color: #f0f0e8;
          border: 1px solid #2a2a24;
        }

        .tab-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #333330;
        }

        .tab.active .tab-dot { background: #f0a500; }

        /* FORM SECTION */
        .section-label {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #444440;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #1a1a16;
        }

        .input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .num-input {
          flex: 1;
          background: #111110;
          border: 1px solid #222220;
          border-radius: 6px;
          padding: 14px 18px;
          color: #f0f0e8;
          font-family: 'DM Mono', monospace;
          font-size: 1.1rem;
          outline: none;
          transition: border-color 0.15s;
          -moz-appearance: textfield;
        }

        .num-input::-webkit-inner-spin-button,
        .num-input::-webkit-outer-spin-button { -webkit-appearance: none; }

        .num-input::placeholder { color: #333330; }
        .num-input:focus { border-color: #f0a500; }

        .btn-save {
          padding: 14px 28px;
          background: #f0a500;
          border: none;
          border-radius: 6px;
          color: #0a0a08;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-save:hover { background: #e09800; transform: translateY(-1px); }
        .btn-save:active { transform: translateY(0); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .msg {
          font-size: 12px;
          padding: 10px 14px;
          border-radius: 4px;
          margin-top: 8px;
          letter-spacing: 0.02em;
        }

        .msg-error { background: #1a0e0e; color: #e05a5a; border-left: 2px solid #e05a5a; }
        .msg-success { background: #0e1a0e; color: #5abf5a; border-left: 2px solid #5abf5a; }

        /* TABLE */
        .table-wrap {
          border: 1px solid #1a1a16;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 8px;
        }

        .num-table {
          width: 100%;
          border-collapse: collapse;
        }

        .num-table thead tr {
          background: #111110;
          border-bottom: 1px solid #1a1a16;
        }

        .num-table th {
          padding: 10px 16px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #444440;
          text-align: left;
          font-weight: 400;
        }

        .num-table th:last-child { text-align: right; }

        .num-table tbody tr {
          border-bottom: 1px solid #131312;
          transition: background 0.1s;
          animation: rowIn 0.25s ease both;
        }

        .num-table tbody tr:last-child { border-bottom: none; }
        .num-table tbody tr:hover { background: #111110; }

        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .num-table td {
          padding: 12px 16px;
          font-size: 13px;
        }

        .td-idx {
          color: #333330;
          font-size: 11px;
          width: 48px;
        }

        .td-val {
          color: #e8e4d9;
          font-size: 15px;
          font-weight: 500;
        }

        .td-del { text-align: right; width: 48px; }

        .btn-del {
          width: 28px; height: 28px;
          background: transparent;
          border: 1px solid #222220;
          border-radius: 4px;
          color: #444440;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .btn-del:hover { border-color: #e05a5a; color: #e05a5a; background: #1a0e0e; }

        /* SEARCH */
        .search-box {
          position: relative;
          margin-bottom: 24px;
        }

        .search-icon-wrap {
          position: absolute;
          left: 16px; top: 50%;
          transform: translateY(-50%);
          color: #444440;
          font-size: 16px;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          background: #111110;
          border: 1px solid #222220;
          border-radius: 6px;
          padding: 14px 44px 14px 44px;
          color: #f0f0e8;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
          letter-spacing: 0.04em;
        }

        .search-input::placeholder { color: #333330; }
        .search-input:focus { border-color: #f0a500; }

        .search-clear {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: #1e1e1a;
          border: none;
          color: #666660;
          width: 24px; height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .search-clear:hover { color: #e8e4d9; background: #2a2a24; }

        /* STATES */
        .state-empty {
          text-align: center;
          padding: 48px 24px;
          color: #333330;
          font-size: 13px;
          letter-spacing: 0.04em;
        }

        .state-empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
          opacity: 0.3;
        }

        .loading-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 32px;
          color: #444440;
          font-size: 12px;
          letter-spacing: 0.08em;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid #222220;
          border-top-color: #f0a500;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* RESULTS META */
        .results-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .results-count {
          font-size: 11px;
          color: #444440;
          letter-spacing: 0.06em;
        }

        .results-count span {
          color: #f0a500;
          font-weight: 500;
        }

        .highlight-row td { background: #141208 !important; }
        .highlight-row .td-val { color: #f0a500; }

        /* SEARCH HINT */
        .search-hint {
          font-size: 11px;
          color: #2e2e2a;
          letter-spacing: 0.04em;
          margin-top: 8px;
          padding-left: 2px;
        }
      `}</style>

      <div className="app">
        <div className="noise" />
        <div className="accent-line" />

        <div className="container">
          {/* HEADER */}
          <header className="header">
            <div className="header-left">
              <div className="wordmark">num<span>.</span>store</div>
              <div className="tagline">numeric data persistence</div>
            </div>
            <div className="header-stat">
              <div className="stat-num">{numbers.length}</div>
              <div className="stat-label">stored</div>
            </div>
          </header>

          {/* TABS */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === "store" ? "active" : ""}`}
              onClick={() => { setActiveTab("store"); setError(""); setSuccess(""); }}
            >
              <span className="tab-dot" />
              Store
            </button>
            <button
              className={`tab ${activeTab === "search" ? "active" : ""}`}
              onClick={() => { setActiveTab("search"); setError(""); setSuccess(""); }}
            >
              <span className="tab-dot" />
              Search
            </button>
          </div>

          {/* ── TAB 1: STORE ─────────────────────────────── */}
          {activeTab === "store" && (
            <>
              <div className="section-label">input</div>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={inputValue}
                    onChange={e => { setInputValue(e.target.value); setError(""); setSuccess(""); }}
                    className="num-input"
                    disabled={submitting}
                    autoFocus
                  />
                  <button type="submit" className="btn-save" disabled={submitting}>
                    {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <>+ Save</>}
                  </button>
                </div>
                {error && <div className="msg msg-error">{error}</div>}
                {success && <div className="msg msg-success">✓ {success}</div>}
              </form>

              <div className="section-label" style={{ marginTop: 40 }}>records</div>

              {loading ? (
                <div className="loading-row"><span className="spinner" /> loading...</div>
              ) : numbers.length === 0 ? (
                <div className="state-empty">
                  <div className="state-empty-icon">∅</div>
                  no records yet
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="num-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>value</th>
                        <th style={{ textAlign: "right" }}>del</th>
                      </tr>
                    </thead>
                    <tbody>
                      {numbers.map(({ id, value }, i) => (
                        <tr key={id} style={{ animationDelay: `${i * 0.025}s` }}>
                          <td className="td-idx">{i + 1}</td>
                          <td className="td-val">{value}</td>
                          <td className="td-del">
                            <button className="btn-del" onClick={() => handleDelete(id)} title="Delete">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── TAB 2: SEARCH ────────────────────────────── */}
          {activeTab === "search" && (
            <>
              <div className="section-label">query</div>

              <div className="search-box">
                <span className="search-icon-wrap">⌕</span>
                <input
                  type="text"
                  placeholder="1, 1.2, 1.5  or  42"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                  autoFocus
                />
                {search && (
                  <button className="search-clear" onClick={() => setSearch("")}>×</button>
                )}
              </div>

              <div className="search-hint">
                comma-separated sequence → exact consecutive match + next 8 records
              </div>

              {loading ? (
                <div className="loading-row"><span className="spinner" /> loading...</div>
              ) : !search.trim() ? (
                <div className="state-empty" style={{ marginTop: 32 }}>
                  <div className="state-empty-icon">◎</div>
                  enter a value or sequence
                </div>
              ) : filtered.length === 0 ? (
                <div className="state-empty" style={{ marginTop: 32 }}>
                  <div className="state-empty-icon">∅</div>
                  no match for "{search}"
                </div>
              ) : (
                <>
                  <div className="results-meta" style={{ marginTop: 20 }}>
                    <div className="results-count">
                      <span>{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table className="num-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const terms = search.trim().split(",").map(t => parseFloat(t.trim())).filter(t => !isNaN(t));
                          return filtered.map(({ id, value }, i) => {
                            const isMatch = terms.includes(parseFloat(value));
                            return (
                              <tr key={id} className={isMatch ? "highlight-row" : ""} style={{ animationDelay: `${i * 0.025}s` }}>
                                <td className="td-idx">{i + 1}</td>
                                <td className="td-val">{value}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}