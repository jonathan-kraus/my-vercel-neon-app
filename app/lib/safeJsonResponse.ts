// lib/safeJsonResponse.ts
/**
 * Safely serialize data containing BigInt values into JSON.
 * Converts BigInt → string before sending.
 */
export function safeJsonResponse(
  data: unknown,
  init: ResponseInit = { headers: { 'Content-Type': 'application/json' } }
): Response {
  const safeJson = JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );

  return new Response(safeJson, init);
}
