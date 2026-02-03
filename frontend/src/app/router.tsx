import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import { AppLayout } from "./layout"
import { RequireAuth } from "./routes/RequireAuth"

import { authRoutes } from "@/features/auth/routes"
import { userRoutes } from "@/features/user/routes"
import { adminRoutes } from "@/features/admin/routes"

const allRoutes = [
  {
    //defining root layout
    path:"/", 
    element: <AppLayout />, 
    children: [
      {
        //this populates the root layout as initial page
        index: true,
        element: <Navigate to="/login" replace />,
      },

      //public page accessible to anyone
      ...authRoutes, 

      {
        //protected routes, needs authentication through element before proceeding
        element: <RequireAuth />, 
        children: [
          ...userRoutes,
          ...adminRoutes,

        ]
      }
    ]
  }
]

const router = createBrowserRouter(allRoutes)

export function Router() {
  return <RouterProvider router={router} />
}
