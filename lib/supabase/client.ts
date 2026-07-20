// Este módulo foi descontinuado em favor da integração com MySQL em lib/db.ts e lib/auth.ts
export function createClient() {
  throw new Error('Supabase client descontinuado. Use a API REST nativa do projeto (/api/*) ou lib/db.ts.')
}
