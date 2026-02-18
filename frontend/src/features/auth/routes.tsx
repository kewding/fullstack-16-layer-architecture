import { LoginPage } from './login/pages/LoginPage';
import { RegisterPage } from './register/pages/RegisterPage';

export const authRoutes = [
  { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
];
