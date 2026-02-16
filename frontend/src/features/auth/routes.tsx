import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const authRoutes = [
  { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
];
