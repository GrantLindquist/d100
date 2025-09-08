'use server';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_TIMEOUT_SECONDS } from '@/utils/globals';

const key = new TextEncoder().encode('annihilation_cannon');

async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TIMEOUT_SECONDS}s`)
    .sign(key);
}

async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export const setCookie = async (cookieName: string, obj: any) => {
  const cookie = await encrypt({ obj });
  (await cookies()).set({
    name: cookieName,
    value: cookie,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
};

export const getCookie = async (cookieName: string) => {
  const cookie = (await cookies()).get(cookieName)?.value;
  if (!cookie) return null;
  return await decrypt(cookie);
};

export const clearCookie = async (cookieName: string) => {
  (await cookies()).delete(cookieName);
};
