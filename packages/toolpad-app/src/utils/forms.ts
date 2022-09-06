import { FieldError, FieldValues, FormState } from 'react-hook-form';

function errorMessage(error: FieldError) {
  if (error.message) {
    return error.message;
  }
  switch (error.type) {
    case 'required':
      return 'required';
    default:
      return 'invalid';
  }
}

export function validation<T extends FieldValues>(
  formState: FormState<T>,
  field: keyof T,
): { error?: boolean; helperText?: string } {
  const error: FieldError = (formState.errors as any)[field];

  return {
    error: !!error,
    helperText: error ? errorMessage(error) : undefined,
  };
}

export function isSaveDisabled<T extends FieldValues>(formState: FormState<T>): boolean {
  // Always destructure formState to trigger underlying react-hook-form Proxy object
  const { isValid, isDirty } = formState;
  return !isValid || !isDirty;
}
