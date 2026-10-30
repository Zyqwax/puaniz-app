/**
 * Server actions hand their results back to client components, where Error
 * instances cannot be serialized. Collapse them to a plain message.
 */
export const toMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Bilinmeyen bir hata oluştu";
};
