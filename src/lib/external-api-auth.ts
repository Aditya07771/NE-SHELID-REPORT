import { NextRequest } from 'next/server';
import { env } from './env';

export function validateExternalApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) return false;
  return apiKey === env.EXTERNAL_API_KEY;
}
