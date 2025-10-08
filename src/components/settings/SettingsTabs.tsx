import { NavLink } from 'react-router-dom';

export function SettingsTabs() {
  const items = [
    { to: '/settings/organization', label: 'Organização' },
    { to: '/settings/branding', label: 'Branding' },
    { to: '/settings/domains', label: 'Domínios' },
    { to: '/settings/team', label: 'Equipe' },
    { to: '/settings/integrations', label: 'Integrações' },
    { to: '/settings/billing', label: 'Faturamento' },
    { to: '/settings/privacy', label: 'Privacidade' },
    { to: '/settings/ai-providers', label: 'Provedores de IA' },
  ];

  return (
    <div className="border-b border-border mb-6">
      <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
