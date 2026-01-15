/**
 * Utility functions for text manipulation, especially for SMS
 */

/**
 * Extracts only the first name from a full name
 */
export function getFirstName(fullName: string): string {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0];
}

/**
 * Truncates text to a specific character limit
 * If truncation is needed, adds "..." at the end
 */
export function truncateToSMSLimit(message: string, limit: number = 160): string {
  if (!message) return "";
  if (message.length <= limit) return message;
  return message.substring(0, limit - 3) + "...";
}

/**
 * Replaces template variables with values, using first name for 'nome' variable
 * and ensuring the final message respects the SMS character limit
 */
export function replaceTemplateVariablesWithSMSLimit(
  message: string,
  variables: Record<string, string>,
  limit: number = 160
): string {
  let result = message;
  for (const [key, value] of Object.entries(variables)) {
    // For 'nome' variable, use only first name
    const finalValue = key === "nome" ? getFirstName(value) : value;
    result = result.replace(new RegExp(`{{${key}}}`, "g"), finalValue || "");
  }
  // Ensure SMS character limit
  return truncateToSMSLimit(result, limit);
}
