import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function PigForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    name: "",
    breed: "",
    weight: "",
    age: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ name: "", breed: "", weight: "", age: "" });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <h3>Add Pig</h3>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          name="name"
          placeholder="Pig name"
          value={form.name}
          onChange={handleChange}
          required
          style={{
            padding: 8,
            marginRight: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
          }}
        />
        <input
          type="text"
          name="breed"
          placeholder="Breed"
          value={form.breed}
          onChange={handleChange}
          style={{
            padding: 8,
            marginRight: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
          }}
        />
        <input
          type="number"
          name="weight"
          placeholder="Weight (kg)"
          value={form.weight}
          onChange={handleChange}
          style={{
            padding: 8,
            marginRight: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
          }}
        />
        <input
          type="number"
          name="age"
          placeholder="Age (months)"
          value={form.age}
          onChange={handleChange}
          style={{
            padding: 8,
            marginRight: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "8px 16px",
          background: "#2b8aef",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {loading ? "Adding..." : "Add Pig"}
      </button>
    </form>
  );
}

export default function Database() {
  const queryClient = useQueryClient();

  const {
    data: tables,
    isLoading: tablesLoading,
    error: tablesError,
  } = useQuery(
    ["db-tables"],
    () => fetch("/api/db/tables").then((r) => r.json()),
    { staleTime: 10000 },
  );

  const addPigMutation = useMutation(
    (pigData) =>
      fetch("/api/pigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pigData),
      }).then((r) => r.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["db-tables"]);
      },
    },
  );

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Database Management</h2>

      <PigForm
        onSubmit={(data) => addPigMutation.mutate(data)}
        loading={addPigMutation.isLoading}
      />

      <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 6 }}>
        <h3>Available Tables</h3>
        {tablesLoading && <div>Loading tables...</div>}
        {tablesError && (
          <div style={{ color: "red" }}>
            Error loading tables: {tablesError.message}
          </div>
        )}
        {tables && tables.tables && tables.tables.length > 0 ? (
          <ul>
            {tables.tables.map((t, i) => (
              <li key={i}>{Object.values(t)[0]}</li>
            ))}
          </ul>
        ) : (
          <p>No tables found or MySQL not connected.</p>
        )}
      </div>
    </section>
  );
}
