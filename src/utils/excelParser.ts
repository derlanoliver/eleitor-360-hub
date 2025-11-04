import * as XLSX from 'xlsx';

/**
 * Interface para os dados do líder importados do Excel
 */
export interface LeaderImportRow {
  nome_completo: string;
  whatsapp: string;
  data_nascimento: string;
  status: string;
  observacao?: string;
  email?: string;
}

/**
 * Parse de arquivo Excel (.xlsx ou .xls) para array de objetos
 */
export async function parseExcelFile(file: File): Promise<LeaderImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json<LeaderImportRow>(worksheet, {
          header: [
            'nome_completo',
            'whatsapp',
            'data_nascimento',
            'status',
            'observacao',
            'email'
          ],
          range: 1, // Pular a linha de cabeçalho
          defval: '', // Valor padrão para células vazias
        });

        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Gera um arquivo Excel modelo para importação de líderes
 */
export function generateLeadersTemplate(): void {
  // Dados de exemplo
  const templateData = [
    {
      'Nome Completo': 'João da Silva',
      'WhatsApp': '5561999887766',
      'Data de Nascimento': '15/03/1985',
      'Status': 'ativo',
      'Observação': 'Líder comunitário experiente',
      'Email': 'joao.silva@email.com'
    },
    {
      'Nome Completo': 'Maria Santos',
      'WhatsApp': '5561988776655',
      'Data de Nascimento': '22/07/1990',
      'Status': 'ativo',
      'Observação': '',
      'Email': 'maria.santos@email.com'
    }
  ];

  // Criar workbook e worksheet
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Líderes');

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 25 }, // Nome Completo
    { wch: 18 }, // WhatsApp
    { wch: 18 }, // Data de Nascimento
    { wch: 12 }, // Status
    { wch: 35 }, // Observação
    { wch: 30 }  // Email
  ];
  ws['!cols'] = colWidths;

  // Download do arquivo
  XLSX.writeFile(wb, 'modelo_importacao_lideres.xlsx');
}

/**
 * Valida a estrutura básica dos dados importados
 */
export function validateImportData(data: LeaderImportRow[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || data.length === 0) {
    errors.push('Arquivo vazio ou sem dados válidos');
    return { isValid: false, errors };
  }

  // Validar campos obrigatórios
  data.forEach((row, index) => {
    const lineNumber = index + 2; // +2 porque linha 1 é header e index começa em 0

    if (!row.nome_completo?.trim()) {
      errors.push(`Linha ${lineNumber}: Nome completo é obrigatório`);
    }

    if (!row.whatsapp?.trim()) {
      errors.push(`Linha ${lineNumber}: WhatsApp é obrigatório`);
    }

    if (!row.data_nascimento) {
      errors.push(`Linha ${lineNumber}: Data de nascimento é obrigatória`);
    }

    if (!row.status?.trim()) {
      errors.push(`Linha ${lineNumber}: Status é obrigatório`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
