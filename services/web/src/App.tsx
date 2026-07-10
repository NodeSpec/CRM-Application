import { Routes, Route } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Dashboard } from "./pages/Dashboard";
import { AdminPage } from "./pages/AdminPage";
import { ResourcePage } from "./pages/ResourcePage";

/**
 * Application shell + routing (REQ-004..013, REQ-016). One route per module
 * plus the dashboard and admin area. Module pages render the generic
 * ResourcePage scaffold configured with the module's columns.
 */
export default function App() {
  return (
    <div className="app">
      <Nav />
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/b2b-leads"
            element={
              <ResourcePage
                title="B2B Leads"
                resource="b2b-leads"
                description="Search, filter, sort and export leads (REQ-006)."
                columns={[
                  "Company Name",
                  "Industry",
                  "Primary POC",
                  "Status",
                  "Next Follow-up",
                ]}
              />
            }
          />
          <Route
            path="/b2g-opportunities"
            element={
              <ResourcePage
                title="B2G Opportunities"
                resource="b2g-opportunities"
                description="Filter by status, agency, focus area, fit score and due date (REQ-008)."
                columns={[
                  "Notice ID",
                  "Agency",
                  "Focus Area",
                  "Fit Score",
                  "Due Date",
                  "Status",
                ]}
              />
            }
          />
          <Route
            path="/events"
            element={
              <ResourcePage
                title="Events"
                resource="events"
                description="List and calendar views; past events are distinguished (REQ-009)."
                columns={["Event Name", "Date", "Location", "Website"]}
              />
            }
          />
          <Route
            path="/submissions"
            element={
              <ResourcePage
                title="Submissions"
                resource="submissions"
                description="Deadline flags and submitted/pending split (REQ-010)."
                columns={["Name", "Category", "Deadline", "Submitted", "Website"]}
              />
            }
          />
          <Route
            path="/publicity-contacts"
            element={
              <ResourcePage
                title="Publicity Contacts"
                resource="publicity-contacts"
                description="Searchable by organization, contact and format (REQ-012)."
                columns={["Organization", "Format", "Contact", "Email"]}
              />
            }
          />
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="*"
            element={<section><h1>Not found</h1></section>}
          />
        </Routes>
      </main>
    </div>
  );
}
