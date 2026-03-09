import React from "react";
import { RootRoute, Route, Router } from "@tanstack/react-router";
import Dashboard from "./routes/Dashboard";
import Database from "./routes/Database";
import Analytics from "./routes/Analytics";
import Chatbot from "./components/Chatbot";

// Root layout
function RootLayout() {
  return (
    <div style={{ fontFamily: "Arial,Helvetica,sans-serif", padding: 24 }}>
      <header
        style={{
          borderBottom: "2px solid #2b8aef",
          paddingBottom: 16,
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: "0 0 10px 0" }}>MACHARIA'S FARMHOUSE — Admin</h1>
        <nav style={{ display: "flex", gap: 16 }}>
          <a
            href="/"
            style={{
              color: "#2b8aef",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Dashboard
          </a>
          <a
            href="/database"
            style={{
              color: "#2b8aef",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Database
          </a>
          <a
            href="/analytics"
            style={{
              color: "#2b8aef",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Analytics
          </a>
          <a
            href="/admin/logout"
            style={{
              marginLeft: "auto",
              color: "#999",
              textDecoration: "none",
            }}
          >
            Logout
          </a>
        </nav>
      </header>
      <main>
        <RootRoute.Outlet />
        <Chatbot />
      </main>
    </div>
  );
}

// Define routes
const rootRoute = new RootRoute({ component: RootLayout });
const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const databaseRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/database",
  component: Database,
});
const analyticsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: Analytics,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  databaseRoute,
  analyticsRoute,
]);

const router = new Router({ routeTree });

export default function App() {
  return (
    <router.Provider>
      <Routes router={router} />
    </router.Provider>
  );
}

function Routes({ router }) {
  const match = router.getRouteMatch(window.location.pathname);
  const route = match?.route;
  return route?.component && <route.component />;
}
