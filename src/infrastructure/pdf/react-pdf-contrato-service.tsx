import { renderToBuffer } from "@react-pdf/renderer";
import type { ContratoPdfService, DadosContratoPdf } from "@/domain/services";
import { ContratoPdfDocument } from "./contrato-template";

/** Adapter que materializa o template React em bytes de PDF. */
export class ReactPdfContratoService implements ContratoPdfService {
  async gerar(dados: DadosContratoPdf): Promise<Uint8Array> {
    const buffer = await renderToBuffer(<ContratoPdfDocument dados={dados} />);
    return new Uint8Array(buffer);
  }
}
