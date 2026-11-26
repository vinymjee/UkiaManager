import { Injectable } from "@angular/core";
import * as QRCode from "qrcode";

@Injectable({ providedIn: "root" })
export class QrService {
  /** URL publique du document (aucune authentification requise) */
  docUrl(type: string, id: string): string {
    return `${window.location.origin}/api/public/doc/${type}/${encodeURIComponent(id)}`;
  }

  /** Génère un QR code SVG (synchrone) */
  svg(url: string, size = 96): string {
    try {
      const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
      const n = qr.modules.size;
      const data = qr.modules.data;
      const cell = 100 / n;
      let rects = "";
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          if (data[row * n + col]) {
            rects += `<rect x="${(col * cell).toFixed(2)}" y="${(row * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
          }
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" shape-rendering="crispEdges" style="background:#fff;"><g fill="#000">${rects}</g></svg>`;
    } catch {
      return "";
    }
  }

  /** Bloc QR prêt à insérer dans un document imprimé */
  block(url: string): string {
    if (!url) return "";
    return `
      <div class="rec-qr">
        ${this.svg(url)}
        <div class="rec-qr-label">Scannez pour visualiser<br/>ce document en ligne</div>
      </div>
    `;
  }
}
