/**
 * Verifica se já passou o prazo configurável após o horário do evento
 * @param eventDate Data do evento no formato YYYY-MM-DD
 * @param eventTime Horário do evento no formato HH:MM:SS
 * @param deadlineHours Prazo em horas após o evento (null = sem limite)
 * @returns true se já passou o prazo, false caso contrário
 */
export function isEventDeadlinePassed(
  eventDate: string, 
  eventTime: string, 
  deadlineHours: number | null = 4
): boolean {
  // Sem limite se null
  if (deadlineHours === null) return false;
  
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  // Prazo é ANTES do evento (subtração)
  const deadline = new Date(eventDateTime.getTime() - (deadlineHours * 60 * 60 * 1000));
  return new Date() > deadline;
}
