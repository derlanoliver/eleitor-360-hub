import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, History, Search } from "lucide-react";
import { EmailTemplatesTab } from "@/components/email/EmailTemplatesTab";
import { EmailBulkSendTab } from "@/components/email/EmailBulkSendTab";
import { EmailHistoryTab } from "@/components/email/EmailHistoryTab";
import { Input } from "@/components/ui/input";

const EmailMarketing = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Email Marketing
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Gerencie templates, envie emails em massa e acompanhe o histórico
                </p>
              </div>
              {activeTab === "templates" && (
                <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="bulk" className="gap-2">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Envio em Massa</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <EmailTemplatesTab searchTerm={searchTerm} />
            </TabsContent>

            <TabsContent value="bulk">
              <EmailBulkSendTab />
            </TabsContent>

            <TabsContent value="history">
              <EmailHistoryTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmailMarketing;
