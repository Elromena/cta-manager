import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/drizzle/schema';
import { cache } from 'react';

/**
 * Get a Drizzle ORM instance backed by Cloudflare D1.
 * Wrapped in React cache() to scope one client per request.
 */
export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
});
