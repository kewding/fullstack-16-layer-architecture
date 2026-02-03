import { AdminDashboardPage } from "./pages/AdminDashboardPage"
import { AdminProfilePage } from "./pages/AdminProfilePage"
import { AdminSettingsPage } from "./pages/AdminSettingsPage"
import { UserRecordPage } from "./pages/UserRecordPage"

export const adminRoutes = [
    {path: "admin/dashboard", element: <AdminDashboardPage />},
    {path: "admin/profile", element: <AdminProfilePage/>},
    {path: "admin/settings", element: <AdminSettingsPage />},
    {path: "admin/user_record", element: <UserRecordPage />}
]