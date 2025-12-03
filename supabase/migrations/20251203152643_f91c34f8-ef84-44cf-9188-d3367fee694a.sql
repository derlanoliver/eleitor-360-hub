-- Corrigir tickets existentes com protocolo vazio ou NULL
UPDATE support_tickets 
SET protocolo = generate_support_protocol()
WHERE protocolo = '' OR protocolo IS NULL;

-- Melhorar trigger para aceitar string vazia também
CREATE OR REPLACE FUNCTION public.set_support_ticket_protocol()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Verificar se é NULL OU string vazia
    IF NEW.protocolo IS NULL OR NEW.protocolo = '' THEN
        NEW.protocolo := generate_support_protocol();
    END IF;
    RETURN NEW;
END;
$function$;