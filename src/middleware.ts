import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
    const response = await updateSession(request)

    // Protected routes check
    const protectedPaths = ['/dashboard', '/competitors', '/alerts', '/settings']
    const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    if (isProtected) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
            return Response.redirect(loginUrl)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
