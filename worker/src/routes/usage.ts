import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const usageRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

usageRoutes.get('/', async (c) => {
  const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = c.env.CLOUDFLARE_API_TOKEN;
  const dbId = c.env.CLOUDFLARE_D1_DATABASE_ID;
  const r2Bucket = c.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accountId || !apiToken || !dbId || !r2Bucket) {
    return c.json({ success: false, message: 'Cloudflare usage credentials not configured in environment variables.' }, 500);
  }

  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch D1 Database Size
    let d1SizeInBytes = 0;
    try {
      const d1Response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}`, { headers });
      const d1Data: any = await d1Response.json();
      if (d1Data.success && d1Data.result) {
        d1SizeInBytes = d1Data.result.file_size || 0;
      }
    } catch (e) {
      console.error("Failed to fetch D1 usage:", e);
    }

    // 2. Fetch R2 Storage Size
    let r2SizeInBytes = 0;
    let r2ObjectCount = 0;
    try {
      const r2Response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${r2Bucket}/usage`, { headers });
      const r2Data: any = await r2Response.json();
      if (r2Data.success && r2Data.result) {
        r2SizeInBytes = parseInt(r2Data.result.payloadSize) || 0;
        r2ObjectCount = parseInt(r2Data.result.objectCount) || 0;
      }
    } catch (e) {
      console.error("Failed to fetch R2 usage:", e);
    }

    // Daily Requests via GraphQL (Simplified using GraphQL endpoint)
    let todayRequests = 0;
    try {
      const today = new Date();
      today.setUTCHours(0,0,0,0);
      const query = `
        query {
          viewer {
            accounts(filter: { accountTag: "${accountId}" }) {
              workersInvocationsAdaptive(limit: 1, filter: { datetime_geq: "${today.toISOString()}" }) {
                sum { requests }
              }
            }
          }
        }
      `;
      const gqlResponse = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });
      const gqlData: any = await gqlResponse.json();
      if (gqlData.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive?.[0]?.sum?.requests) {
        todayRequests = gqlData.data.viewer.accounts[0].workersInvocationsAdaptive[0].sum.requests;
      }
    } catch (e) {
      console.error("Failed to fetch Workers usage:", e);
    }

    return c.json({
      success: true,
      data: {
        d1: {
          usedBytes: d1SizeInBytes,
          limitBytes: 500 * 1024 * 1024, // 500 MB
        },
        r2: {
          usedBytes: r2SizeInBytes,
          objectCount: r2ObjectCount,
          limitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
        },
        workers: {
          dailyRequests: todayRequests,
          limitRequests: 100000 // 100K free tier
        }
      }
    });

  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});
