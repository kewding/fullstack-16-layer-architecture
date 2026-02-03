import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AppLayout } from "./layout"

import { authRoutes } from "@/features/auth/routes"
import { userRoutes } from "@/features/user/routes"
import { adminRoutes } from "@/features/admin/routes"

const allRoutes = [
  {
    path:"/", 
    element: <AppLayout />, 
    children: [...authRoutes, ...userRoutes, ...adminRoutes],
  }
]

const router = createBrowserRouter(allRoutes)

export function Router() {
  return <RouterProvider router={router} />
}
