// Liveness/readiness endpoint for the Kubernetes probes. It answers from the
// Next.js server itself without calling the backend, so a failing probe means
// this process has stopped serving HTTP (a TCP check passes even then).
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response('ok', {
    status: 200,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' },
  });
}
