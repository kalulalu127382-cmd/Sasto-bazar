import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminLogin = pathname === '/admin/login'

  // Guard: if Supabase env vars aren't configured, just pass through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // For storefront and public routes, do NOT call Supabase Auth in edge middleware!
  // Storefront visitors do not have Supabase staff auth sessions.
  // Calling getUser() on edge for every public request adds latency and causes 504 timeouts when Supabase is slow.
  if (!isAdminRoute || isAdminLogin) {
    return supabaseResponse
  }

  // Fast check for admin: does the request even have any Supabase auth cookies?
  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') || c.name.includes('auth-token')
  )

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Strictly timeout after 2 seconds to prevent Vercel 504 MIDDLEWARE_INVOCATION_TIMEOUT
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Auth check timeout')), 2000)
    )

    const {
      data: { user },
    } = (await Promise.race([authPromise, timeoutPromise])) as {
      data: { user: any }
      error?: any
    }

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  } catch {
    // If auth check fails or times out, safely redirect to login rather than hanging
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
