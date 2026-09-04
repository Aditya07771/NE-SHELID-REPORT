import { v4 as uuidv4 } from 'uuid';

export interface DemoSession {
  id: string;
  phone: string;
  loginAt: number;
}

const SESSION_KEY = 'ne_shield_demo_session';

export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveDemoSession(phone: string): DemoSession {
  const session: DemoSession = {
    id: uuidv4(),
    phone: phone.trim(),
    loginAt: Date.now(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function clearDemoSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
