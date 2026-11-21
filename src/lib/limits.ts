// Keeps the free-tier AI quota available for judges and real users.
// Per device: a cookie counter (easy to clear, so it's a courtesy limit, not security).
// Per server instance: an in-memory daily cap. Replays never count.

export const DEVICE_COOKIE = "ss_live";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function deviceLimit(): number {
  return Number(process.env.LIVE_SESSIONS_PER_DEVICE || 5);
}

export function globalLimit(): number {
  return Number(process.env.LIVE_SESSIONS_PER_DAY || 40);
}

export function readDeviceCount(cookieHeader: string | null): number {
  const m = (cookieHeader ?? "").match(new RegExp(`${DEVICE_COOKIE}=([0-9-]+):(\\d+)`));
  if (!m || m[1] !== today()) return 0;
  return Number(m[2]);
}

export function deviceCookie(count: number): string {
  return `${DEVICE_COOKIE}=${today()}:${count}; Path=/; Max-Age=172800; SameSite=Lax; HttpOnly`;
}

const globalState = { day: "", count: 0 };

export function tryStartGlobal(): boolean {
  if (globalState.day !== today()) {
    globalState.day = today();
    globalState.count = 0;
  }
  if (globalState.count >= globalLimit()) return false;
  globalState.count += 1;
  return true;
}
