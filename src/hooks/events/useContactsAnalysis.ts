import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactsAnalysis {
  totalUniqueContacts: number;
  newContacts: number;
  recurringContacts: number;
  recurrenceRate: number;
  averageEventsPerContact: number;
  topRecurringContacts: {
    contactId: string;
    name: string;
    eventCount: number;
  }[];
}

export function useContactsAnalysis(eventId?: string) {
  return useQuery({
    queryKey: ["contacts-analysis", eventId],
    queryFn: async (): Promise<ContactsAnalysis> => {
      let query = supabase
        .from("event_registrations")
        .select("contact_id, nome")
        .not("contact_id", "is", null);

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Count events per contact
      const contactMap = new Map<string, { name: string; count: number }>();

      data?.forEach((reg: any) => {
        const contactId = reg.contact_id;
        if (!contactMap.has(contactId)) {
          contactMap.set(contactId, { name: reg.nome, count: 0 });
        }
        contactMap.get(contactId)!.count++;
      });

      const totalUniqueContacts = contactMap.size;
      const newContacts = Array.from(contactMap.values()).filter(
        (c) => c.count === 1
      ).length;
      const recurringContacts = Array.from(contactMap.values()).filter(
        (c) => c.count > 1
      ).length;

      const totalEvents = Array.from(contactMap.values()).reduce(
        (sum, c) => sum + c.count,
        0
      );

      // Get top recurring contacts
      const topRecurringContacts = Array.from(contactMap.entries())
        .filter(([_, contact]) => contact.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([contactId, contact]) => ({
          contactId,
          name: contact.name,
          eventCount: contact.count,
        }));

      return {
        totalUniqueContacts,
        newContacts,
        recurringContacts,
        recurrenceRate:
          totalUniqueContacts > 0
            ? (recurringContacts / totalUniqueContacts) * 100
            : 0,
        averageEventsPerContact:
          totalUniqueContacts > 0 ? totalEvents / totalUniqueContacts : 0,
        topRecurringContacts,
      };
    },
  });
}
