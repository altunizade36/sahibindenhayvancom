/**
 * Vercel API handler
 * This file is the entry point for all API requests on Vercel.
 * It re-exports the Express app from server/vercel-entry.ts
 */
import handler from "../server/vercel-entry";
export default handler;
