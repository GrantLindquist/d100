'use server';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_TIMEOUT } from '@/utils/globals';

const key = new TextEncoder().encode('annihilation_cannon');

async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Date.now() + SESSION_TIMEOUT)
    .sign(key);
}

async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export const setCookie = async (cookieName: string, obj: any) => {
  const expires = new Date(Date.now() + SESSION_TIMEOUT);
  const cookie = await encrypt({ obj, expires });
  (await cookies()).set({
    name: cookieName,
    value: cookie,
    expires: expires,
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
