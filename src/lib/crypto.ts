// Cryptographically-random alphanumeric code — used anywhere a guessable
// code would let someone join a class or link an account they shouldn't
// (class join codes, classroom join codes). Passwords are handled entirely
// by Supabase Auth, not by this app — see supabase-auth.ts.
export function generateCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = "";
  for (let i = 0; i < bytes.length; i++) result += chars[bytes[i] % chars.length];
  return result;
}
