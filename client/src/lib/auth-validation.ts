export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return { field: "email", message: "emailRequired" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { field: "email", message: "invalidEmail" };
  }
  return null;
}

export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: "password", message: "passwordRequired" };
  }
  if (password.length < 8) {
    return { field: "password", message: "passwordMinLength" };
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): ValidationError | null {
  if (!confirmPassword) {
    return { field: "confirmPassword", message: "passwordRequired" };
  }
  if (password !== confirmPassword) {
    return { field: "confirmPassword", message: "passwordMismatch" };
  }
  return null;
}

export function validatePasswordReset(password: string, confirmPassword: string): ValidationError | null {
  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;

  return validatePasswordConfirmation(password, confirmPassword);
}
