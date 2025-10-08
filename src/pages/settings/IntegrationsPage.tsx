import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { Plug } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="p-6">
      <SettingsTabs />
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Plug className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Integrações</h1>
        </div>
        <p className="text-muted-foreground">
          Conexões com WhatsApp, e-mail marketing e redes sociais serão implementadas no Bloco 1.3
        </p>
      </div>
    </div>
  );
}
