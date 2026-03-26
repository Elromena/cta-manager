import { NextResponse } from 'next/server';

/**
 * GET /api/debug-env
 * Temporary endpoint to debug env var issues on Webflow Cloud.
 * DELETE THIS AFTER DEBUGGING.
 */
export async function GET() {
  const password = process.env.CTA_ADMIN_PASSWORD;
  
  return NextResponse.json({
    envVarExists: password !== undefined,
    envVarType: typeof password,
    envVarLength: password ? password.length : 0,
    fallbackUsed: !password,
    // Show first and last char only (safe enough for debugging)
    hint: password ? `${password[0]}..${password[password.length - 1]}` : 'NO_VALUE',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('CTA')),
  });
}
