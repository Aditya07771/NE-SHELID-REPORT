import crypto from 'crypto';
import { env } from '@/lib/env';

export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export function getImageKitAuthParams(): ImageKitAuthResponse {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 2400; // valid for 40 minutes

  const privateKey = env.IMAGEKIT_PRIVATE_KEY;
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return {
    token,
    expire,
    signature,
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  };
}
