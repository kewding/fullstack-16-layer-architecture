import { useState } from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';
import type { VendorRegisterInput } from '../schemas/vendor-register.schema';

export function useVendorRegisterStep(
  form: UseFormReturn<VendorRegisterInput>,
  stepFields: FieldPath<VendorRegisterInput>[][],
) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const nextStep = async () => {
    if (currentStepIndex >= stepFields.length - 1) return false;

    const isStepValid = await form.trigger(stepFields[currentStepIndex]);

    if (isStepValid) {
      setCurrentStepIndex((prev) => prev + 1);
      return true;
    }

    return false;
  };

  const previousStep = () => setCurrentStepIndex((prev) => Math.max(0, prev - 1));

  return {
    currentStepIndex,
    nextStep,
    previousStep,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === stepFields.length - 1,
  };
}