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

export const setUserSession = async (user: any) => {
  const expires = new Date(Date.now() + SESSION_TIMEOUT);
  const session = await encrypt({ user, expires });
  (await cookies()).set({
    name: 'session',
    value: session,
    expires: expires,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
};

export const getUserFromSession = async () => {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
};

export const clearSession = async () => {
  (await cookies()).delete('session');
};
