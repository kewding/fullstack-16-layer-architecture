import React from 'react';
import { ReactLogo } from '@/shared/assets';
import { Link } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  return (
    //adapts to device screen
    <div className="w-screen h-screen bg-neutral-900 flex ">
      {/* gives max space according to screen, padding (p-3) is for mobile ux*/}

      {/* content */}

      {/* jjust disable comment for checking borders */}
      {/* <main className="flex flex-col h-full w-full p-10 gap-8 items-center justify-stretch overflow-y-auto border-4 border-green-700"> */}
      <main className="flex flex-col h-full w-full pt-12 pb-6 gap-8 items-center justify-between overflow-y-auto">
        <header className="flex flex-col gap-1 items-center">
          <img src={ReactLogo} alt="Vite Logo" className="w-7 h-7" />
          <h1 className="font-bold text-white text-center">Register Page</h1>
        </header>

        {/* login section */}

        {/* just disable comment for checking borders */}
        {/* <section className="w-full max-w-[340px] flex flex-col gap-4 items-center font-medium text-white border-4 border-red-700"> */}
        <section className="w-full max-w-[330px] flex flex-col gap-5 items-center font-medium text-white">
          {/* register form */}
          <form action="post" className="flex flex-col w-full gap-4">
            {/* institutional id */}
            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="institutionalID" className="text-sm">
                Institutional ID
              </label>
              <input
                id="institutionalID"
                type="text"
                className="h-12 bg-neutral-900 border border-neutral-500 rounded p-3 focus:border-white focus:outline-none"
              />
            </div>

            {/* email */}
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

            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="contactNumber" className="text-sm">
                Contact Number
              </label>
              <input
                id="contactNumber"
                type="text"
                className="h-12 bg-neutral-900 border border-neutral-500 rounded p-3 focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="firstName" className="text-sm">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                className="h-12 bg-neutral-900 border border-neutral-500 rounded p-3 focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="middleName" className="text-sm">
                Middle Name
              </label>
              <input
                id="middleName"
                type="text"
                className="h-12 bg-neutral-900 border border-neutral-500 rounded p-3 focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="lastName" className="text-sm">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                className="h-12 bg-neutral-900 border border-neutral-500 rounded p-3 focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col w-full gap-1.5">
              <label htmlFor="birthDate" className="text-sm">
                Birth Date
              </label>
              <input
                id="birthDate"
                type="text"
                className="h-12 bg-neutral-900 border border-neutral-500 rounded p-3 focus:border-white focus:outline-none"
              />
            </div>

            <button type="submit" className="bg-green-500 rounded-full text-black font-bold h-13">
              Continue
            </button>
          </form>
        </section>

        {/* register section */}

        {/* just disable comment for checking borders
        <section className="w-full max-w-[340px] flex flex-col gap-4 items-center border-4 border-red-700"> */}

        <section className="w-full max-w-[330px] flex flex-col my-3 gap-4 items-center">
          <div className="flex flex-col gap-1 w-full items-center">
            <p className="text-neutral-300">Already have an account?</p>
            <Link to="/login" className="w-full">
              <button className="w-full bg-neutral-900 rounded-full font-bold h-13 focus:ring-0">
                Login
              </button>
            </Link>
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
