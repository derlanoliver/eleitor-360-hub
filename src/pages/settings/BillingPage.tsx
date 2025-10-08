import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="p-6">
      <SettingsTabs />
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Faturamento</h1>
        </div>
        <p className="text-muted-foreground">
          Gerenciamento de planos, pagamentos e uso da plataforma será implementado no Bloco 1.5
        </p>
      </div>
    </div>
  );
}
