import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="p-6">
      <SettingsTabs />
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Equipe</h1>
        </div>
        <p className="text-muted-foreground">
          Gerenciamento de usuários, permissões e convites será implementado no Bloco 1.2
        </p>
      </div>
    </div>
  );
}
