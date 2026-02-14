import React from 'react';
import { useLocation } from 'react-router-dom';
import { ViteLogo } from '@/shared/assets';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const from = location.state?.from;

  {
    from && (
      <p style={{ color: 'red' }}>
        You need to have the necessary role to access <strong>{from}</strong>
      </p>
    );
  }

  return (
    //adapts to device screen
    <div className="w-screen h-screen bg-neutral-900 flex ">
      {/* gives max space according to screen, padding (p-3) is for mobile ux*/}

      {/* content */}

      {/* jjust disable comment for checking borders
      <main className="flex flex-col h-full w-full p-10 gap-8 items-center justify-stretch overflow-y-auto border-4 border-green-700">*/}

      <main className="flex flex-col h-full w-full pt-12 pb-6 gap-8 items-center justify-stretch overflow-y-auto">
        <header className="flex flex-col gap-1 items-center">
          <img src={ViteLogo} alt="Vite Logo" className="w-7 h-7" />
          <h1 className="font-bold text-white">Login Page</h1>
        </header>

        {/* login section */}

        {/* just disable comment for checking borders
        <section className="w-full max-w-[340px] flex flex-col gap-4 items-center font-medium text-white border-4 border-red-700"> */}

        <section className="w-full max-w-[330px] flex flex-col gap-5 items-center font-medium text-white">
          {/* login form */}
          <form action="post" className="flex flex-col w-full gap-4">
            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="email" className="text-sm">
                Email
              </label>
              <input
                id="email"
                type="text"
                className="h-12 bg-neutral-900 border border-neutral-500 rounded p-3 focus:border-white focus:outline-none"
              />
            </div>

            <button type="submit" className="bg-green-500 rounded-full text-black font-bold h-13">
              Continue
            </button>
          </form>

          <p className="font-normal">or</p>

          {/* login using other things section */}
          <div className="flex flex-col gap-2 w-full">
            <button className="border border-neutral-500 rounded-full h-13">Google</button>
            <button className="border border-neutral-500 rounded-full h-13">Facebook</button>
          </div>
        </section>

        {/* register section */}

        {/* just disable comment for checking borders
        <section className="w-full max-w-[340px] flex flex-col gap-4 items-center border-4 border-red-700"> */}

        <section className="w-full max-w-[330px] flex flex-col my-3 gap-4 items-center">
          <div className="flex flex-col gap-1 w-full items-center">
            <p className="text-neutral-300">Don't have account?</p>
            <button className="w-full bg-neutral-900 rounded-full font-bold h-13 focus:ring-0">
              Register
            </button>
          </div>
        </section>

        {/* eula things */}
        <footer className="w-full max-w-[330px] text-xs text-center">
          This site is protected by your MOM and our self imposed
          <a href=""> EULA </a>
          and
          <a href=""> Terms of Service </a>
          apply
        </footer>
      </main>
    </div>
  );
};
