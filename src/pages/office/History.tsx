import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOfficeVisits } from "@/hooks/office/useOfficeVisits";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OfficeStatusBadge } from "@/components/office/OfficeStatusBadge";
import { ProtocolBadge } from "@/components/office/ProtocolBadge";
import { formatPhoneBR } from "@/services/office/officeService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function History() {
  const { data: visits, isLoading } = useOfficeVisits();
  
  // Filtrar apenas visitas finalizadas
  const finishedStatuses = ["MEETING_COMPLETED", "CANCELLED"];
  const finishedVisits = visits?.filter((v) => finishedStatuses.includes(v.status)) || [];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Histórico de Visitas</h1>
        <p className="text-muted-foreground">
          Consulte todas as visitas registradas
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Visitas Finalizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Líder</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Registro</TableHead>
                <TableHead>Check-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finishedVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>
                    <ProtocolBadge protocolo={visit.protocolo} showCopy={false} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {visit.contact?.nome}
                  </TableCell>
                  <TableCell>
                    {visit.contact?.telefone_norm && formatPhoneBR(visit.contact.telefone_norm)}
                  </TableCell>
                  <TableCell>{visit.city?.nome}</TableCell>
                  <TableCell>{visit.leader?.nome_completo}</TableCell>
                  <TableCell>
                    <OfficeStatusBadge status={visit.status} />
                  </TableCell>
                  <TableCell>
                    {format(new Date(visit.created_at), "dd/MM/yyyy HH:mm", {
                      locale: ptBR
                    })}
                  </TableCell>
                  <TableCell>
                    {visit.checked_in_at ? (
                      format(new Date(visit.checked_in_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR
                      })
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {finishedVisits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma visita finalizada ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
