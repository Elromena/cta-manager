import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/drizzle/schema';

/**
 * Get a Drizzle ORM instance backed by Cloudflare D1.
 * Must be called inside a request handler (API route, server component, etc.)
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DATABASE, { schema });
}
