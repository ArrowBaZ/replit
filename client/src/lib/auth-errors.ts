export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_verified"
  | "email_taken"
  | "invalid_email"
  | "weak_password"
  | "password_mismatch"
  | "invalid_code"
  | "code_expired"
  | "invalid_token"
  | "token_expired"
  | "network_error"
  | "unknown_error";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  statusCode?: number;
}

export function parseAuthError(error: any): AuthError {
  const statusCode = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  // Parse server error messages
  if (serverMessage) {
    const message = serverMessage.toLowerCase();

    if (message.includes("invalid email or password") || message.includes("not found")) {
      return {
        code: "invalid_credentials",
        message: "invalidCredentials",
        statusCode,
      };
    }

    if (message.includes("already")) {
      return {
        code: "email_taken",
        message: "emailTaken",
        statusCode,
      };
    }

    if (message.includes("not verified")) {
      return {
        code: "email_not_verified",
        message: "emailVerificationRequired",
        statusCode,
      };
    }

    if (message.includes("code") && message.includes("invalid")) {
      return {
        code: "invalid_code",
        message: "invalidCode",
        statusCode,
      };
    }

    if (message.includes("code") && message.includes("expired")) {
      return {
        code: "code_expired",
        message: "codeExpired",
        statusCode,
      };
    }

    if (message.includes("token") && message.includes("invalid")) {
      return {
        code: "invalid_token",
        message: "invalidResetLink",
        statusCode,
      };
    }

    if (message.includes("token") && message.includes("expired")) {
      return {
        code: "token_expired",
        message: "invalidResetLink",
        statusCode,
      };
    }
  }

  // Handle network errors
  if (error?.code === "ECONNREFUSED" || error?.code === "ENOTFOUND") {
    return {
      code: "network_error",
      message: "networkError",
      statusCode,
    };
  }

  // Default to unknown error
  return {
    code: "unknown_error",
    message: error?.message || "authError",
    statusCode,
  };
}
