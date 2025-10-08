import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="p-6">
      <SettingsTabs />
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Privacidade</h1>
        </div>
        <p className="text-muted-foreground">
          Configurações de segurança e proteção de dados serão implementadas no Bloco 1.6
        </p>
      </div>
    </div>
  );
}
