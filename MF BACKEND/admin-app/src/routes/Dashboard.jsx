import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data, isLoading, error } = useQuery(
    ["admin-info"],
    () => fetch("/api/admin").then((r) => r.json()),
    { staleTime: 5000 },
  );

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Dashboard</h2>
      {isLoading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>Error loading admin API</div>}
      {data && (
        <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 6 }}>
          <p>
            <strong>Message:</strong> {data.message}
          </p>
          <p>
            <strong>Environment:</strong> {data.env}
          </p>
          <p>
            <strong>Server Uptime (seconds):</strong> {Math.round(data.uptime)}
          </p>
        </div>
      )}
    </section>
  );
}
