import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authRouter } from "../modules/auth/index.js";
import { b2bLeadsRouter } from "../modules/b2b-leads/index.js";
import { b2gOpportunitiesRouter } from "../modules/b2g-opportunities/index.js";
import { eventsRouter } from "../modules/events/index.js";
import { eventInviteRouter } from "../modules/events-invite/index.js";
import { submissionsRouter } from "../modules/submissions/index.js";
import { submissionCategoriesRouter } from "../modules/submission-categories/index.js";
import { publicityContactsRouter } from "../modules/publicity-contacts/index.js";
import { dashboardRouter } from "../modules/dashboard/index.js";
import { auditRouter } from "../modules/audit/index.js";
import { metaRouter } from "../modules/meta/index.js";
import { usersRouter } from "../modules/users/index.js";
import { companiesRouter } from "../modules/companies/index.js";
import { companySocialRouter } from "../modules/social/index.js";
import { companyCompetitorsRouter } from "../modules/company-competitors/index.js";
import {
  leadStatusesRouter,
  captureStagesRouter,
} from "../modules/pipeline-stages/index.js";
import { contactsRouter } from "../modules/contacts/index.js";
import { contactLifecycleStagesRouter } from "../modules/contact-lifecycle-stages/index.js";
import { activitiesRouter } from "../modules/activities/index.js";
import { tasksRouter } from "../modules/tasks/index.js";
import { customFieldDefsRouter } from "../modules/custom-field-defs/index.js";
import {
  teamingRouter,
  stakeholdersRouter,
  gatesRouter,
} from "../modules/b2g-capture/index.js";

/**
 * Versioned API surface (REQ-016). Every CRM module hangs off `/api/v1`.
 * A future `/api/v2` router can be mounted alongside without touching v1,
 * satisfying the "adding a new version does not break existing consumers" AC.
 *
 * All routes require an authenticated session; RBAC guards are applied within
 * individual routers/handlers where an Admin role is required.
 */
export const v1Router = Router();

// Auth endpoints are public (login/callback/logout); /me guards itself.
v1Router.use("/auth", authRouter);

// Every other /api/v1 route requires an authenticated session (REQ-002/003).
v1Router.use(authenticate);

v1Router.use("/b2b-leads", b2bLeadsRouter);
v1Router.use("/b2g-opportunities", b2gOpportunitiesRouter);
// Invite sub-route mounted first so /events/:id/invite resolves before CRUD :id.
v1Router.use("/events", eventInviteRouter);
v1Router.use("/events", eventsRouter);
v1Router.use("/submissions", submissionsRouter);
v1Router.use("/submission-categories", submissionCategoriesRouter);
v1Router.use("/publicity-contacts", publicityContactsRouter);
v1Router.use("/dashboard", dashboardRouter);
v1Router.use("/audit", auditRouter);
v1Router.use("/meta", metaRouter);
v1Router.use("/users", usersRouter);

// Design-expansion modules (REQ-019–024)
// Social feed sub-route is mounted first so /companies/:id/social-feed resolves
// before the generic CRUD :id handler (REQ-026).
v1Router.use("/companies", companySocialRouter);
v1Router.use("/companies", companiesRouter);
v1Router.use("/company-competitors", companyCompetitorsRouter);
v1Router.use("/lead-statuses", leadStatusesRouter);
v1Router.use("/b2g-capture-stages", captureStagesRouter);
v1Router.use("/contacts", contactsRouter);
v1Router.use("/contact-lifecycle-stages", contactLifecycleStagesRouter);
v1Router.use("/activities", activitiesRouter);
v1Router.use("/tasks", tasksRouter);
v1Router.use("/custom-field-defs", customFieldDefsRouter);
v1Router.use("/b2g-teaming-partners", teamingRouter);
v1Router.use("/b2g-stakeholders", stakeholdersRouter);
v1Router.use("/b2g-compliance-gates", gatesRouter);
