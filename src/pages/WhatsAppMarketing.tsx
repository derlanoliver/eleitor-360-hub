import { useState } from "react";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { WhatsAppTemplatesTab } from "@/components/whatsapp/WhatsAppTemplatesTab";
import { WhatsAppBulkSendTab } from "@/components/whatsapp/WhatsAppBulkSendTab";
import { WhatsAppHistoryTab } from "@/components/whatsapp/WhatsAppHistoryTab";

export default function WhatsAppMarketing() {
  const [activeTab, setActiveTab] = useState("templates");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                  WhatsApp Marketing
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie templates e envie mensagens em massa via WhatsApp
                </p>
              </div>

              {activeTab === "templates" && (
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-[280px]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="bulk">Envio em Massa</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <WhatsAppTemplatesTab />
            </TabsContent>

            <TabsContent value="bulk">
              <WhatsAppBulkSendTab />
            </TabsContent>

            <TabsContent value="history">
              <WhatsAppHistoryTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
