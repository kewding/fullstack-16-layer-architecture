import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { adminRoutes } from "@/features/admin/routes"
// import { authRoutes } from "@/features/auth/routes"
// import { userRoutes } from "@/features/user/routes"

test("renders Vite + React text", () => {
  const router = createMemoryRouter(
    [
      { path: "/", element: <div>Vite + React</div> }, // placeholder element for test
      ...adminRoutes
      // ...authRoutes,
      // ...userRoutes
    ],
    { initialEntries: ["/"] } // start test at "/"
  )

  render(<RouterProvider router={router} />)

  expect(screen.getByText(/vite \+ react/i)).toBeInTheDocument()
})
