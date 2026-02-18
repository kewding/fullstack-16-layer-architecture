import { ReactLogo } from '@/shared/assets';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { RegisterSectionContact } from '../components/ContactSection';
import { RegisterSectionID } from '../components/IDSection';
import { RegisterSectionPersonal } from '../components/PersonalInfoSection';
import { REGISTER_STEPS } from '../constants/registerSteps';
import { useRegisterStep } from '../hooks/useRegisterStep';
import { registerSchema, type RegisterInput } from '../schemas/register.schema';


export const RegisterPage: React.FC = () => {
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      institutionalID: '',
      email: '',
      contactNumber: '',
      firstName: '',
      middleName: '',
      lastName: '',
      birthDate: undefined,
    },
  });

  const { currentStepIndex, nextStep, previousStep, isFirstStep, isLastStep } = useRegisterStep(
    form,
    REGISTER_STEPS,
  );

  const renderStep = () => {
    switch (currentStepIndex) {
      case 0:
        return <RegisterSectionID form={form} />;
      case 1:
        return <RegisterSectionContact form={form} />;
      case 2:
        return <RegisterSectionPersonal form={form} />;
      default:
        return null;
    }
  };

  const currentStepFields = (() => {
    switch (currentStepIndex) {
      case 0:
        return ['institutionalID'] as const;
      case 1:
        return ['email', 'contactNumber'] as const;
      case 2:
        return ['firstName', 'middleName', 'lastName', 'birthDate'] as const;
      default:
        return [];
    }
  })();

  const isStepValid = currentStepFields.every(
    (field) => !form.formState.errors[field] && form.getValues(field),
  );

  const handleContinue = async () => {
    const valid = await nextStep();
    if (valid && isLastStep) {
      // final submission
      form.handleSubmit((data) => {
        console.log('Final Register Data:', data);
        // call your register.service.ts here to send data to backend
      })();
    }
  };

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
          <form className="flex flex-col w-full gap-4">
            {/* Render current step section */}
            {renderStep()}

            {/* Navigation buttons */}
            <div className="flex flex-col gap-3">
              {!isFirstStep && (
                <button
                  type="button"
                  className="bg-neutral-700 rounded-full text-white font-bold h-12"
                  onClick={previousStep}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className={`rounded-full h-12 font-bold transition-colors
                ${
                  isStepValid
                    ? 'bg-green-500 text-black cursor-pointer'
                    : 'bg-neutral-700 text-white cursor-not-allowed'
                }`}
                onClick={handleContinue}
                disabled={!isStepValid}
              >
                {isLastStep ? 'Submit' : 'Continue'}
              </button>
            </div>
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
