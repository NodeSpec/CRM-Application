import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { b2bLeadsRouter } from "../modules/b2b-leads/index.js";
import { b2gOpportunitiesRouter } from "../modules/b2g-opportunities/index.js";
import { eventsRouter } from "../modules/events/index.js";
import { submissionsRouter } from "../modules/submissions/index.js";
import { submissionCategoriesRouter } from "../modules/submission-categories/index.js";
import { publicityContactsRouter } from "../modules/publicity-contacts/index.js";
import { dashboardRouter } from "../modules/dashboard/index.js";
import { auditRouter } from "../modules/audit/index.js";

/**
 * Versioned API surface (REQ-016). Every CRM module hangs off `/api/v1`.
 * A future `/api/v2` router can be mounted alongside without touching v1,
 * satisfying the "adding a new version does not break existing consumers" AC.
 *
 * All routes require an authenticated session; RBAC guards are applied within
 * individual routers/handlers where an Admin role is required.
 */
export const v1Router = Router();

// Every /api/v1 route is authenticated (REQ-002/REQ-003).
v1Router.use(authenticate);

v1Router.use("/b2b-leads", b2bLeadsRouter);
v1Router.use("/b2g-opportunities", b2gOpportunitiesRouter);
v1Router.use("/events", eventsRouter);
v1Router.use("/submissions", submissionsRouter);
v1Router.use("/submission-categories", submissionCategoriesRouter);
v1Router.use("/publicity-contacts", publicityContactsRouter);
v1Router.use("/dashboard", dashboardRouter);
v1Router.use("/audit", auditRouter);
