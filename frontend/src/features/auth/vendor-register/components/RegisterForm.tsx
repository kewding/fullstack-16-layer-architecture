import { ReactLogo } from '@/shared/assets';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { VENDOR_REGISTER_STEPS } from '../constants/vendorRegisterSteps';
import { useVendorRegisterStep } from '../hooks/useVendorRegisterStep';
import { vendorRegisterSchema, type VendorRegisterInput } from '../schemas/vendor-register.schema';
import { vendorRegisterService } from '../services/vendor-register.services';
import { VendorBusinessSection } from './BusinessSection';
import { VendorPasswordSection } from './PasswordSection';
import { VendorPersonalSection } from './PersonalInfoSection';

const STEP_MAP: Record<
  string,
  React.FC<{ form: UseFormReturn<VendorRegisterInput>; email: string }>
> = {
  business: ({ form }) => <VendorBusinessSection form={form} />,
  personal: ({ form }) => <VendorPersonalSection form={form} />,
  security: ({ form, email }) => <VendorPasswordSection form={form} email={email} />,
};

interface VendorRegisterFormProps {
  email: string;
  token: string;
}

export const VendorRegisterForm: React.FC<VendorRegisterFormProps> = ({ email, token }) => {
  const navigate = useNavigate();

  const form = useForm<VendorRegisterInput>({
    resolver: zodResolver(vendorRegisterSchema),
    mode: 'all',
    defaultValues: {
      businessName: '',
      firstName: '',
      middleName: '',
      lastName: '',
      birthDate: undefined,
      contactNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { currentStepIndex, nextStep, previousStep, isFirstStep, isLastStep } =
    useVendorRegisterStep(
      form,
      VENDOR_REGISTER_STEPS.map((step) => step.fields),
    );

  const currentStepConfig = VENDOR_REGISTER_STEPS[currentStepIndex];
  const currentStepFields = currentStepConfig.fields;
  const StepComponent = STEP_MAP[currentStepConfig.id];

  const {
    formState: { errors, isSubmitting },
  } = form;

  form.watch(currentStepFields as any);

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');

  const isStepValid =
    currentStepFields.every((field) => {
      const fieldName = field as keyof VendorRegisterInput;
      const hasValue = !!form.getValues(fieldName);
      const hasNoError = !errors[fieldName];
      return hasValue && hasNoError;
    }) &&
    (currentStepFields.includes('confirmPassword')
      ? password === confirmPassword && confirmPassword !== ''
      : true);

  const handleContinue = async () => {
    const isFieldsValid = await form.trigger(currentStepFields as any);
    if (!isFieldsValid) return;

    if (isLastStep) {
      await form.handleSubmit(async (data) => {
        try {
          const response = await vendorRegisterService.register({
            token,
            businessName: data.businessName,
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            birthDate: data.birthDate,
            contactNumber: data.contactNumber,
            password: data.password,
          });

          if (response.success) {
            navigate('/login', {
              replace: true,
              state: { registrationSuccess: true },
            });
          } else {
            const errorMessages: Record<string, string> = {
              invite_expired: 'Your invitation has expired. Please request a new one.',
              invite_used: 'This invitation has already been used.',
              email_exists: 'An account with this email already exists.',
            };
            alert(
              errorMessages[response.error?.code ?? ''] ?? 'Registration failed. Please try again.',
            );
          }
        } catch {
          alert('A network error occurred. Please try again.');
        }
      })();
    } else {
      await nextStep();
    }
  };

  return (
    <div className="w-screen h-screen bg-neutral-900 flex">
      <main className="flex flex-col h-full w-full pt-12 pb-6 gap-8 items-center justify-between overflow-y-auto">
        <header className="flex flex-col gap-1 items-center">
          <img src={ReactLogo} alt="Logo" className="w-7 h-7" />
          <h1 className="font-bold text-white text-center">Vendor Registration</h1>
          <p className="text-neutral-400 text-xs">
            Step {currentStepIndex + 1} of {VENDOR_REGISTER_STEPS.length}
          </p>
        </header>

        <section className="w-full max-w-[330px] flex flex-col gap-5 items-center font-medium text-white">
          <form className="flex flex-col w-full gap-4">
            {StepComponent && <StepComponent form={form} email={email} />}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className={`rounded-full h-12 font-bold transition-colors ${
                  isStepValid
                    ? 'bg-green-500 text-black cursor-pointer'
                    : 'bg-neutral-700 text-white cursor-not-allowed'
                }`}
                onClick={handleContinue}
                disabled={!isStepValid || isSubmitting}
              >
                {isSubmitting
                  ? 'Registering...'
                  : isLastStep
                    ? 'Complete Registration'
                    : 'Continue'}
              </button>

              {!isFirstStep && (
                <button
                  type="button"
                  className="bg-neutral-700 rounded-full text-white font-bold h-12"
                  onClick={previousStep}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              )}
            </div>
          </form>
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
