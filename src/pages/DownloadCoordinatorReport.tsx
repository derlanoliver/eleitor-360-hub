import { useEffect } from "react";
import { generateCoordinatorReportPdf } from "@/utils/generateCoordinatorReportPdf";

const DownloadCoordinatorReport = () => {
  useEffect(() => {
    generateCoordinatorReportPdf();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Relatório de Coordenadores</h1>
        <p className="text-muted-foreground">O download do PDF foi iniciado automaticamente.</p>
        <button
          onClick={() => generateCoordinatorReportPdf()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Baixar novamente
        </button>
      </div>
    </div>
  );
};

export default DownloadCoordinatorReport;
