import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// Switch between local and production
const API = "https://num-data.vercel.app/api";

export default function App() {
  const [inputValue, setInputValue] = useState("");
  const [numbers, setNumbers] = useState([]); // [{ id, value }]
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

  useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
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
        setSuccess(`✓ Number ${data.number} saved! (${data.total} total)`);
        setInputValue("");
        fetchNumbers();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Cannot reach server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      const res = await fetch(`${API}/numbers?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) setNumbers(data.numbers);
      else setError(data.message || "Delete failed.");
    } catch {
      setError("Delete failed.");
    }
  };

const filtered = (() => {
  const q = search.trim();
  if (!q) return numbers;

  const terms = q.split(",").map((t) => t.trim()).filter(Boolean);

  // Single term: exact match + next 8
  if (terms.length === 1) {
    const searchNum = parseFloat(terms[0]);
    const exactIndex = numbers.findIndex((n) => parseFloat(n.value) === searchNum);
    if (exactIndex === -1) return [];
    return numbers.slice(exactIndex, exactIndex + 9);
  }

  // Multiple terms: find exact consecutive sequence in stored list
  for (let i = 0; i <= numbers.length - terms.length; i++) {
    const match = terms.every((term, j) => {
      const searchNum = parseFloat(term);
      const storedNum = parseFloat(numbers[i + j].value);
      return !isNaN(searchNum) && !isNaN(storedNum) && searchNum === storedNum;
    });

    if (match) {
      // Sequence found — return matched sequence + next 8
      return numbers.slice(i, i + terms.length + 8);
    }
  }

  return []; // sequence not found
})();

  return (
    <div className="app">
      <div className="bg-grid" />

      <header className="header">
        <div className="logo">
          <span className="logo-bracket">[</span>
          <span className="logo-text">NUM</span>
          <span className="logo-bracket">]</span>
        </div>
        <p className="header-sub">Number Store — save &amp; search your values</p>
      </header>

      <main className="main">
        {/* INPUT FORM */}
        <section className="card form-card">
          <h2 className="card-title">Enter a Number</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="input-row">
              <input
                type="number"
                step="any"
                placeholder="e.g.  42  or  3.14"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                className="num-input"
                disabled={submitting}
              />
              <button type="submit" className="btn-save" disabled={submitting}>
                {submitting ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <span className="btn-icon">+</span> Save
                  </>
                )}
              </button>
            </div>
            {error && <p className="msg msg-error">{error}</p>}
            {success && <p className="msg msg-success">{success}</p>}
          </form>
        </section>

        {/* LIST */}
        <section className="card list-card">
          <div className="list-header">
            <h2 className="card-title">
              Stored Numbers{" "}
              <span className="badge">{numbers.length}</span>
            </h2>
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="e.g. 5 → shows 5 to 15"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button className="clear-search" onClick={() => setSearch("")}>
                  ×
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="state-msg">
              <span className="spinner lg" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="state-msg empty">
              {numbers.length === 0
                ? "No numbers saved yet."
                : `No results for "${search}"`}
            </div>
          ) : (
            <ul className="num-list">
              {filtered.map(({ id, value }, i) => (
                <li
                  key={id}
                  className="num-item"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className="num-index">#{i + 1}</span>
                  <span className="num-value">{value}</span>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
