// Shared verification code store
// In production, use Redis or a database instead of in-memory Map

// WHY: Use global to persist across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var verificationCodes: Map<string, { code: string; timestamp: number }> | undefined;
}

export const verificationCodes = 
  global.verificationCodes || 
  (global.verificationCodes = new Map<string, { code: string; timestamp: number }>());

