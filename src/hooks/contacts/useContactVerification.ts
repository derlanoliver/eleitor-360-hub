import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendVerificationParams {
  contactId: string;
  contactName: string;
  contactPhone: string;
  leaderName: string;
  verificationCode: string;
}

export async function sendVerificationMessage({
  contactId,
  contactName,
  contactPhone,
  leaderName,
  verificationCode,
}: SendVerificationParams): Promise<boolean> {
  try {
    // Get organization name
    const { data: org } = await supabase
      .from("organization")
      .select("nome")
      .limit(1)
      .single();

    // Get template
    const { data: template } = await supabase
      .from("whatsapp_templates")
      .select("mensagem")
      .eq("slug", "verificacao-cadastro")
      .single();

    if (!template) {
      console.error("Template verificacao-cadastro not found");
      return false;
    }

    // Replace variables (exceto código que vai em mensagem separada)
    let message = template.mensagem;
    message = message.replace(/{{nome}}/g, contactName);
    message = message.replace(/{{lider_nome}}/g, leaderName);
    message = message.replace(/{{deputado_nome}}/g, org?.nome || "Deputado");
    // Remove {{codigo}} do template principal - será enviado separadamente
    message = message.replace(/{{codigo}}/g, "").trim();

    // Enviar mensagem principal
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        phone: contactPhone,
        message: message,
        contactId: contactId,
      },
    });

    if (error) {
      console.error("Error sending verification message:", error);
      return false;
    }

    // Aguardar 2 segundos antes de enviar o código
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Enviar código em mensagem separada (facilita copiar no WhatsApp)
    const { error: codeError } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        phone: contactPhone,
        message: verificationCode,
        contactId: contactId,
      },
    });

    if (codeError) {
      console.error("Error sending verification code:", codeError);
      // Não retorna false pois a mensagem principal foi enviada
    }

    // Update verification_sent_at via SECURITY DEFINER function
    await supabase.rpc('update_contact_verification_sent', {
      _contact_id: contactId
    });

    console.log("Verification message sent:", data);
    return true;
  } catch (err) {
    console.error("Error in sendVerificationMessage:", err);
    return false;
  }
}

export async function resendVerificationCode(contactId: string): Promise<boolean> {
  try {
    // Get contact data
    const { data: contact, error } = await supabase
      .from("office_contacts")
      .select(`
        id,
        nome,
        telefone_norm,
        verification_code,
        source_id,
        source_type
      `)
      .eq("id", contactId)
      .single();

    if (error || !contact) {
      toast.error("Contato não encontrado");
      return false;
    }

    if (contact.source_type !== "lider" || !contact.source_id) {
      toast.error("Este contato não requer verificação");
      return false;
    }

    // Get leader name
    const { data: leader } = await supabase
      .from("lideres")
      .select("nome_completo")
      .eq("id", contact.source_id)
      .single();

    if (!leader) {
      toast.error("Líder não encontrado");
      return false;
    }

    // Generate new code if needed
    let verificationCode = contact.verification_code;
    if (!verificationCode) {
      const { data: newCode } = await supabase.rpc("generate_verification_code");
      verificationCode = newCode;
      
      await supabase
        .from("office_contacts")
        .update({ verification_code: verificationCode })
        .eq("id", contactId);
    }

    const success = await sendVerificationMessage({
      contactId: contact.id,
      contactName: contact.nome,
      contactPhone: contact.telefone_norm,
      leaderName: leader.nome_completo,
      verificationCode: verificationCode,
    });

    if (success) {
      toast.success("Código de verificação reenviado!");
    } else {
      toast.error("Erro ao reenviar código");
    }

    return success;
  } catch (err) {
    console.error("Error resending verification:", err);
    toast.error("Erro ao reenviar verificação");
    return false;
  }
}

interface PendingMessage {
  template: string;
  variables: Record<string, string>;
  created_at: string;
}

export function addPendingMessage(
  existingPending: unknown,
  template: string,
  variables: Record<string, string>
): Record<string, unknown>[] {
  const existing = Array.isArray(existingPending) ? existingPending : [];
  return [
    ...existing,
    {
      template,
      variables,
      created_at: new Date().toISOString(),
    },
  ];
}