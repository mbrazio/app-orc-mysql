// Este módulo foi descontinuado em favor da integração com MySQL em lib/db.ts e lib/auth.ts
export async function createClient() {
  throw new Error('Supabase server client descontinuado. Use getSessionUser() de lib/auth.ts ou lib/db.ts.')
}
