import { type NextRequest, NextResponse } from 'next/server'

// Este módulo foi descontinuado em favor da validação JWT em proxy.ts
export async function updateSession(_request: NextRequest) {
  return NextResponse.next()
}
