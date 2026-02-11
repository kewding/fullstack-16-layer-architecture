import React from "react";
import { useLocation } from "react-router-dom";
import { z } from "zod";
import { useState } from "react";


// --- VALIDATION SCHEMAS ---
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const LoginPage: React.FC = () => {
    const location = useLocation();
    const from = location.state?.from;

    {
      from && (
        <p style = {{color: "red"}}>
          You need to have the necessary role to access <strong>{from}</strong>
        </p>
      )
    }

    //
    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  // --- LOGIN HANDLER ---
    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
      setLoginErrors(fieldErrors);
      return;
    }
    console.log("Login Data:", result.data);
    setLoginErrors({});
  };

  // --- REGISTRATION HANDLER ---
    const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const result = registerSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
      setRegisterErrors(fieldErrors);
      return;
    }
    console.log("Register Data:", result.data);
    setRegisterErrors({});
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-center mb-10 text-gray-800 underline decoration-blue-500">
        Auth Testing Dashboard
      </h1>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ==============================
            LOGIN SECTION
           ============================== */}
        <section className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-6 text-blue-700">Login Form</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input 
                name="email" 
                type="email" 
                className="w-full mt-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none" 
              />
              {loginErrors.email && <p className="text-red-500 text-xs mt-1">{loginErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <input 
                name="password" 
                type="password" 
                className="w-full mt-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none" 
              />
              {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password}</p>}
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
              Test Login
            </button>
          </form>
        </section>

        {/* ==============================
            REGISTRATION SECTION
           ============================== */}
        <section className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500">
          <h2 className="text-xl font-semibold mb-6 text-green-700">Register Form</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input 
                name="email" 
                type="email" 
                className="w-full mt-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-400 outline-none" 
              />
              {registerErrors.email && <p className="text-red-500 text-xs mt-1">{registerErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <input 
                name="password" 
                type="password" 
                className="w-full mt-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-400 outline-none" 
              />
              {registerErrors.password && <p className="text-red-500 text-xs mt-1">{registerErrors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Confirm Password</label>
              <input 
                name="confirmPassword" 
                type="password" 
                className="w-full mt-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-400 outline-none" 
              />
              {registerErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{registerErrors.confirmPassword}</p>}
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition">
              Test Register
            </button>
          </form>
        </section>

      </div>
    </div>
    )
}