import { MedicalInformationPage } from "./pages/MedicalInformationPage";
import { TransactionHistoryPage } from "./pages/TransactionHistoryPage";
import { UserDashboardPage } from "./pages/UserDashboardPage";
import { UserSettingPage } from "./pages/UserSettingPage";

export const userRoutes = [
    {path: "/user/medical_information", element: <MedicalInformationPage/ >},
    {path: "/user/traansactions", element: <TransactionHistoryPage/ >},
    {path: "/user/dashboard", element: <UserDashboardPage/ >},
    {path: "/user/settings", element: <UserSettingPage/ >},
]