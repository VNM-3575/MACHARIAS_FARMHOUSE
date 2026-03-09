import React, { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello — ask me for analytics (e.g. 'average weight') or say 'export csv' for Tableau.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTableau, setShowTableau] = useState(false);

  const tableauUrl = import.meta.env.VITE_TABLEAU_URL || "";

  const send = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((m) => [...m, { from: "user", text: userText }]);
    setInput("");
    setLoading(true);

    // Send message to server chat endpoint (server will proxy to LLM if configured)
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const j = await r.json();
      const reply = j.reply || j.error || "No reply";
      setMessages((m) => [...m, { from: "bot", text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        width: 320,
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ background: "#2b8aef", color: "#fff", padding: 10 }}>
          Admin Chatbot
        </div>
        <div style={{ maxHeight: 240, overflowY: "auto", padding: 10 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: 8,
                textAlign: m.from === "bot" ? "left" : "right",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: m.from === "bot" ? "#f1f5f9" : "#2b8aef",
                  color: m.from === "bot" ? "#111" : "#fff",
                  padding: "8px 10px",
                  borderRadius: 6,
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 10,
            borderTop: "1px solid #eee",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask analytics or 'export csv'"
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ddd",
            }}
          />
          <button
            onClick={send}
            disabled={loading}
            style={{
              padding: "8px 12px",
              background: "#2b8aef",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            {loading ? "..." : "Send"}
          </button>
          <button
            onClick={() => tableauUrl && setShowTableau(true)}
            title={tableauUrl ? "Open Tableau analysis" : "Set VITE_TABLEAU_URL to enable"}
            disabled={!tableauUrl}
            style={{
              padding: "8px 12px",
              background: tableauUrl ? "#0b6e4f" : "#ddd",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            Open Tableau
          </button>
        </div>
      </div>
    </div>

      {showTableau && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowTableau(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              height: "80%",
              background: "#fff",
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 8, background: "#111", color: "#fff" }}>
              <button
                onClick={() => setShowTableau(false)}
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <iframe
              title="Tableau Dashboard"
              src={tableauUrl}
              style={{ flex: 1, border: 0 }}
            />
          </div>
        </div>
      )}
  );
}
