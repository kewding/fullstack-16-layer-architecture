import { useState } from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

export function useRegisterStep<TFieldValues extends Record<string, any>>(
  form: UseFormReturn<TFieldValues>,
  
  //enables finding "nested keys"
  stepFields: FieldPath<TFieldValues>[][],
) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const nextStep = async () => {
    // stops validation at last step index - guard
    if (currentStepIndex >= stepFields.length - 1) return false;

    // trigger validation ONLY for the fields in the current step
    const isStepValid = await form.trigger(stepFields[currentStepIndex]);

    // if valid, move continue
    if (isStepValid) {
      setCurrentStepIndex((prev) => prev + 1);
      return true;
    }

    return false;
  };

  // allows backtrack, and stops validation if at the first step index
  const previousStep = () => setCurrentStepIndex((prev) => Math.max(0, prev - 1));

  return {
    currentStepIndex,
    nextStep,
    previousStep,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === stepFields.length - 1,
  };
}
