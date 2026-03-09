import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function Analytics() {
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery(
    ["analytics-summary"],
    () => fetch("/analytics/summary").then((r) => r.json()),
    { staleTime: 30000 },
  );

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Analytics & Data Export</h2>

      <div
        style={{
          background: "#f9f9f9",
          padding: 16,
          borderRadius: 6,
          marginBottom: 16,
        }}
      >
        <h3>Summary Stats</h3>
        {summaryLoading && <div>Loading...</div>}
        {summaryError && (
          <div style={{ color: "red" }}>
            Error loading analytics: {summaryError.message}
          </div>
        )}
        {summary && (
          <div>
            {summary.message === "no data" ? (
              <p>No pig data found in database.</p>
            ) : (
              <div>
                <p>
                  <strong>Total Rows:</strong> {summary.rows}
                </p>
                {summary.weight_mean && (
                  <p>
                    <strong>Average Weight:</strong>{" "}
                    {summary.weight_mean.toFixed(2)} kg
                  </p>
                )}
                {summary.age_mean && (
                  <p>
                    <strong>Average Age:</strong> {summary.age_mean.toFixed(2)}{" "}
                    months
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 6,
          border: "1px solid #ddd",
        }}
      >
        <h3>Export for Tableau</h3>
        <p>
          Download your pig data as CSV for analysis in Tableau or other BI
          tools.
        </p>
        <a
          href="/analytics/csv"
          download="pigs.csv"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#2b8aef",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 4,
          }}
        >
          Download CSV
        </a>
      </div>
    </section>
  );
}
