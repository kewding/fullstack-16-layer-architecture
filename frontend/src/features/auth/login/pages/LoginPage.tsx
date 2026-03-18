import { useAuth } from '@/app/providers/AuthProvider';
import { ViteLogo } from '@/shared/assets';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '../schemas/login.schema';
import { loginService } from '../services/login.service';

export const LoginPage: React.FC = () => {
  const auth = useAuth();
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const [serverError, setServerError] = useState<string | null>(null);
  const [showAccessWarning, setShowAccessWarning] = useState(false);

  useEffect(() => {
    // skip warning entirely if navigated here via logout
    if (location.state?.loggedOut) return;

    const timer = setTimeout(() => {
      if (location.state?.from && location.state.from !== '/') {
        setShowAccessWarning(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.state]);

  // initialize form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // redirect already-authenticated users away from login
  if (!loading && isAuthenticated) {
    const rolePaths: Record<number, string> = {
      1: '/admin/dashboard',
      2: '/user/dashboard',
      4: '/cashier/rfid-tagging',
    };
    return <Navigate to={rolePaths[user?.roleId ?? 0] || '/'} replace />;
  }

  // handle standard API response
  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const response = await loginService.login(data);

    if (response.success && response.data) {
      auth.login({
        id: response.data.id,
        email: response.data.email,
        roleId: response.data.roleId,
        firstName: '',
      });

      const rolePaths: Record<number, string> = {
        1: '/admin',
        2: '/user/dashboard',
        4: '/cashier',
      };

      // If they were redirected from a protected route, send them back there.
      // Otherwise use their role's default path.
      const targetPath = from !== '/' ? from : rolePaths[response.data.roleId] || '/login';

      navigate(targetPath, { replace: true });
    } else {
      setServerError(response.error?.message || 'Login failed');
    }
  };

  return (
    <div className="w-screen h-screen bg-neutral-900 flex">
      <main className="flex flex-col h-full w-full pt-12 pb-6 gap-8 items-center justify-between overflow-y-auto">
        <header className="flex flex-col gap-1 items-center">
          <img src={ViteLogo} alt="Vite Logo" className="w-7 h-7" />
          <h1 className="font-bold text-white text-center">Login Page</h1>
          {showAccessWarning && (
            <p className="text-red-500 text-sm mt-2 text-center px-4">
              You need to have the necessary role to access <strong>{from}</strong>
            </p>
          )}
        </header>

        <section className="w-full max-w-[330px] flex flex-col gap-5 items-center font-medium text-white">
          {/* form binding using RHF handleSubmit */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col w-full gap-4">
            {/* server-side Error Display */}
            {serverError && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">
                {serverError}
              </div>
            )}

            {/* email field*/}
            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="email" className="text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`h-12 bg-neutral-900 border rounded p-3 focus:outline-none ${
                  errors.email ? 'border-red-500' : 'border-neutral-500 focus:border-white'
                }`}
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            </div>

            {/* password field */}
            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="password" className="text-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className={`h-12 bg-neutral-900 border rounded p-3 focus:outline-none ${
                  errors.password ? 'border-red-500' : 'border-neutral-500 focus:border-white'
                }`}
              />
              {errors.password && (
                <span className="text-red-500 text-xs">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-green-500 rounded-full text-black font-bold h-13 transition-opacity ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400'
              }`}
            >
              {isSubmitting ? 'Checking...' : 'Continue'}
            </button>
          </form>

          <p className="font-normal">or</p>

          <div className="flex flex-col gap-2 w-full">
            <button className="border border-neutral-500 rounded-full h-13 hover:bg-white/5 transition-colors">
              Google
            </button>
            <button className="border border-neutral-500 rounded-full h-13 hover:bg-white/5 transition-colors">
              Facebook
            </button>
          </div>
        </section>

        <section className="w-full max-w-[330px] flex flex-col my-3 gap-4 items-center">
          <div className="flex flex-col gap-1 w-full items-center">
            <p className="text-neutral-300">Don't have account?</p>
            <Link to="/register" className="w-full">
              <button className="w-full bg-neutral-900 border border-neutral-500 rounded-full font-bold h-13 hover:bg-white/5 transition-colors">
                Register
              </button>
            </Link>
          </div>
        </section>

        <footer className="w-full max-w-[330px] text-xs text-center text-neutral-400">
          This site is protected by your MOM and our self imposed{' '}
          <a href="#" className="underline">
            EULA
          </a>{' '}
          and{' '}
          <a href="#" className="underline">
            Terms of Service
          </a>{' '}
          apply
        </footer>
      </main>
    </div>
  );
};
