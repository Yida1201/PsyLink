import { emergencyCountry } from '@/lib/psylink/emergency';
export async function GET(request: Request) {
  const country = emergencyCountry(request.headers, process.env.VERCEL === '1');
  return Response.json({country}, {headers:{'Cache-Control':'private, no-store','Vary':'x-vercel-ip-country','X-Content-Type-Options':'nosniff'}});
}
