import { useState, useEffect } from 'react';
import { Building2, ChevronRight, Search } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export function TenantSwitcher() {
  const { tenant, availableTenants, switchTenant, isLoading } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('🔄 TenantSwitcher render:', {
      tenant: tenant?.name,
      availableCount: availableTenants.length,
      isLoading,
      tenantsList: availableTenants.map(t => ({ id: t.id, name: t.name, code: t.account_code }))
    });
  }, [tenant, availableTenants, isLoading]);

  const filteredTenants = availableTenants.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.account_code?.toString().includes(searchQuery)
  );

  const handleTenantSwitch = async (tenantId: string) => {
    await switchTenant(tenantId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Show skeleton while loading
  if (isLoading || !tenant) {
    return (
      <div className="w-full px-2 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    );
  }

  if (availableTenants.length === 0) {
    console.log('⚠️ TenantSwitcher: No available tenants to display');
    return null;
  }

  const logoUrl = tenant.tenant_branding?.[0]?.logo_url;
  const tenantInitials = tenant.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 px-2 py-6 hover:bg-accent"
        onClick={() => setIsOpen(true)}
      >
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarImage src={logoUrl} alt={tenant.name} />
          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
            {tenantInitials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-sm font-semibold truncate w-full text-left">
            {tenant.name}
          </span>
          <span className="text-xs text-muted-foreground">
            ID: {tenant.account_code || tenant.id.slice(0, 8)}
          </span>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle>Selecionar Cliente</SheetTitle>
          </SheetHeader>

          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)] px-3">
            <div className="space-y-1 pb-4">
              {filteredTenants.map((t) => {
                const tLogoUrl = t.tenant_branding?.[0]?.logo_url;
                const tInitials = t.name
                  .split(' ')
                  .map(word => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const isActive = t.id === tenant.id;

                return (
                  <Button
                    key={t.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 px-3 py-6"
                    onClick={() => handleTenantSwitch(t.id)}
                    disabled={isLoading}
                  >
                    <Avatar className="h-10 w-10 rounded-lg">
                      <AvatarImage src={tLogoUrl} alt={t.name} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {tInitials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate w-full text-left">
                        {t.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ID: {t.account_code || t.id.slice(0, 8)}
                      </span>
                    </div>

                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </Button>
                );
              })}

              {filteredTenants.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum cliente encontrado
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
