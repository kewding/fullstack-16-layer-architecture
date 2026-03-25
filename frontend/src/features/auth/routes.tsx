import { LoginPage } from './login/pages/LoginPage';
import { RegisterPage } from './register/pages/RegisterPage';
import { VendorRegisterPage } from './vendor-register';

export const authRoutes = [
  { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
  { path: 'vendor-register', element: <VendorRegisterPage/>}
];
