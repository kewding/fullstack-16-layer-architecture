// app/router.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom"
// import { authRoutes } from "@/features/auth/routes"
// import { userRoutes } from "@/features/user/routes"
import { adminRoutes } from "@/features/admin/routes"

const allRoutes = [/*...authRoutes, ...userRoutes,*/ ...adminRoutes]

const router = createBrowserRouter(allRoutes)

export function Router() {
  return <RouterProvider router={router} />
}
