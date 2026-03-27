import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/drizzle/schema';

/**
 * Get a Drizzle ORM instance backed by Cloudflare D1.
 * Must be called inside a request handler (API route, server component, etc.)
 */
export function getDb() {
  const ctx = getCloudflareContext();
  const db = (ctx as any).env?.DB;
  if (!db) {
    throw new Error(
      `D1 binding "DB" not found. Context keys: ${JSON.stringify(Object.keys((ctx as any).env || {}))}. Full ctx keys: ${JSON.stringify(Object.keys(ctx || {}))}`
    );
  }
  return drizzle(db, { schema });
}
