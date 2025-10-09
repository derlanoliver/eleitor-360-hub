import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSafeSupabase } from "@/hooks/useSafeSupabase";
import { UserCog } from "lucide-react";

type PlatformAdmin = {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
};

export default function PlatformAdmins() {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { safeQuery, supabase } = useSafeSupabase();

  useEffect(() => {
    // Pequeno delay para evitar race condition com AuthContext
    const timer = setTimeout(() => {
      console.log('⏰ Iniciando fetch de admins após delay...');
      fetchAdmins();
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchAdmins = async () => {
    try {
      console.log('🔍 Carregando usuários globais...');
      
      const result = await safeQuery<PlatformAdmin[]>(async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('tenant_id', '00000000-0000-0000-0000-000000000001')
          .order('created_at', { ascending: false });
        
        return { data, error };
      });

      if (result.error) throw result.error;
      
      console.log('✅ Usuários globais carregados:', result.data?.length || 0);
      setAdmins(result.data || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      setAdmins([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserBadge = () => {
    return <Badge variant="destructive">Platform Admin</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Usuários Globais
          </h1>
          <p className="text-muted-foreground mt-1">
            Administradores da plataforma (@eleitor360.ai)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Admins</CardTitle>
            <CardDescription>
              Usuários com acesso global à plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário global cadastrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{getUserBadge()}</TableCell>
                      <TableCell>
                        <Badge variant={admin.is_active ? "default" : "secondary"}>
                          {admin.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.last_login 
                          ? new Date(admin.last_login).toLocaleString('pt-BR')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
