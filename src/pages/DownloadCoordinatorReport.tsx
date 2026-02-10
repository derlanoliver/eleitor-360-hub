import { useEffect, useState } from "react";
import { generateCoordinatorReportPdf } from "@/utils/generateCoordinatorReportPdf";

const DownloadCoordinatorReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      await generateCoordinatorReportPdf();
    } catch (err: any) {
      setError(err.message || "Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Relatório de Coordenadores</h1>
        {loading && <p className="text-muted-foreground">Carregando dados e gerando PDF...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && (
          <p className="text-muted-foreground">O download do PDF foi iniciado automaticamente.</p>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Gerando..." : "Baixar novamente"}
        </button>
      </div>
    </div>
  );
};

export default DownloadCoordinatorReport;
