import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const secretKey = process.env.JWT_SECRET || 'yillik_foto_gizli_anahtar';
const key = new TextEncoder().encode(secretKey);
const COOKIE_NAME = 'yillik_foto_session';

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: string;
  expires: string | number | Date;
  [key: string]: string | number | Date | undefined;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as unknown as SessionPayload;
}

export async function setSession(userId: string, username: string, name: string, role: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, username, name, role, expires });

  (await cookies()).set(COOKIE_NAME, session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get(COOKIE_NAME)?.value;
  if (!session) return;

  try {
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = new Response();
    res.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${await encrypt(parsed)}; Expires=${parsed.expires instanceof Date ? parsed.expires.toUTCString() : parsed.expires}; HttpOnly; Path=/`
    );
    return res;
  } catch {
    return;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const session = (await cookies()).get(COOKIE_NAME)?.value;
  if (!session) return null;
  
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}
