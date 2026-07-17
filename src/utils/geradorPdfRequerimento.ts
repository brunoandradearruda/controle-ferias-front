import * as pdfMakeModule from 'pdfmake/build/pdfmake';
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

export const gerarRequerimentoFerias = (
  servidorNome: string,
  matricula: string,
  cargo: string,
  lotacao: string,
  anoReferencia: number,
  dataInicioGozo: string,
  diasSolicitados: number,
  abonoPecuniario: boolean
) => {
  // ============================================================================
  // SOLUÇÃO DA TELA BRANCA: Lazy Setup e Proteção contra empacotamento do Vite
  // ============================================================================
  const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
  const pdfFonts = (pdfFontsModule as any).default || pdfFontsModule;
  
  if (pdfFonts && pdfFonts.pdfMake) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts && pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
  }

  // Formatação de datas para o padrão brasileiro
  const formatarData = (dataIso: string) => {
    if (!dataIso) return '';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const dataFim = new Date(dataInicioGozo);
  dataFim.setDate(dataFim.getDate() + diasSolicitados - 1);
  const dataFimFormatada = dataFim.toISOString().split('T')[0];

  const textoAbono = abonoPecuniario 
    ? 'Requeiro, ainda, a conversão de 1/3 (um terço) das férias a que tenho direito em abono pecuniário (indenização), conforme previsto no Estatuto.'
    : 'Declaro que NÃO opto pela conversão de 1/3 (um terço) das férias em abono pecuniário.';

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        text: 'GOVERNO DO ESTADO DA PARAÍBA',
        style: 'cabecalho',
        margin: [0, 0, 0, 2]
      },
      {
        text: 'SECRETARIA DE ESTADO DO PLANEJAMENTO, ORÇAMENTO E GESTÃO - SEPLAG',
        style: 'cabecalho',
        margin: [0, 0, 0, 20]
      },
      {
        text: 'REQUERIMENTO DE FÉRIAS REGULAMENTARES',
        style: 'titulo',
        margin: [0, 0, 0, 30]
      },
      {
        text: 'Ao Sr(a). Chefe Imediato / Diretor(a) de Recursos Humanos,',
        style: 'corpo',
        margin: [0, 0, 0, 20]
      },
      {
        text: [
          'Eu, ', { text: servidorNome, bold: true }, 
          ', matrícula nº ', { text: matricula, bold: true },
          ', ocupante do cargo de ', { text: cargo, bold: true },
          ', com lotação atual no(a) ', { text: lotacao, bold: true },
          ', venho mui respeitosamente requerer a concessão de minhas férias regulamentares relativas ao período aquisitivo de ', 
          { text: `${anoReferencia - 1}/${anoReferencia}`, bold: true }, '.'
        ],
        style: 'corpo',
        margin: [0, 0, 0, 15]
      },
      {
        text: [
          'Solicito o gozo de ', { text: `${diasSolicitados} dias`, bold: true },
          ', com início previsto para o dia ', { text: formatarData(dataInicioGozo), bold: true },
          ' e término no dia ', { text: formatarData(dataFimFormatada), bold: true }, '.'
        ],
        style: 'corpo',
        margin: [0, 0, 0, 15]
      },
      {
        text: textoAbono,
        style: 'corpo',
        margin: [0, 0, 0, 40]
      },
      {
        text: 'Nestes Termos,\nPede Deferimento.',
        alignment: 'center',
        margin: [0, 0, 0, 40]
      },
      {
        text: `João Pessoa, ${new Date().toLocaleDateString('pt-BR')}.`,
        alignment: 'right',
        margin: [0, 0, 0, 60]
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 250, y2: 0, lineWidth: 1 }],
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      {
        text: servidorNome,
        alignment: 'center',
        bold: true,
        fontSize: 11
      },
      {
        text: `Matrícula: ${matricula}`,
        alignment: 'center',
        fontSize: 10
      }
    ],
    styles: {
      cabecalho: {
        fontSize: 12,
        bold: true,
        alignment: 'center'
      },
      titulo: {
        fontSize: 14,
        bold: true,
        alignment: 'center',
        decoration: 'underline'
      },
      corpo: {
        fontSize: 12,
        alignment: 'justify',
        lineHeight: 1.5
      }
    }
  };

  pdfMake.createPdf(docDefinition).download(`Requerimento_Ferias_${matricula}_${anoReferencia}.pdf`);
};