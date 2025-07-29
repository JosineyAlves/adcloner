import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/campaigns/:path*',
    '/templates/:path*',
    '/settings/:path*',
    '/accounts/:path*'
  ]
} 