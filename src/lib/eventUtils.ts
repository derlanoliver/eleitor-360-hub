/**
 * Verifica se já passou o prazo de 4 horas após o horário do evento
 * @param eventDate Data do evento no formato YYYY-MM-DD
 * @param eventTime Horário do evento no formato HH:MM:SS
 * @returns true se já passou o prazo, false caso contrário
 */
export function isEventDeadlinePassed(eventDate: string, eventTime: string): boolean {
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  const deadline = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000));
  return new Date() > deadline;
}
