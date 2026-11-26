import { Injectable, inject } from "@angular/core";
import { QrService } from "./qr.service";

@Injectable({ providedIn: "root" })
export class PrintService {
  qr = inject(QrService);
  private baseUrl(): string {
    return window.location.origin;
  }

  /** CSS partagé pour tous les documents (en-tête UKIA LABS) */
  private sharedCss(): string {
    const logoUrl = `${this.baseUrl()}/assets/logo-ukia.png`;
    const fontUrl = `${this.baseUrl()}/assets/fonts/AVA.ttf`;
    return `
      @font-face { font-family:'AVA'; src:url('${fontUrl}') format('truetype'); font-weight:normal; font-style:normal; }
      @page { size: A4; margin: 10mm 9mm; }
      body { font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; color:#111; font-size:11px; line-height:1.3; margin:0; }
      .rec-print { max-width:192mm; margin:0 auto; }
      .rec-entete { position:relative; display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:4px; }
      .rec-gauche { flex:1; }
      .rec-ligne-logo { display:flex; align-items:center; gap:6px; }
      .rec-logo { width:64px; height:auto; display:block; }
      .rec-marque { flex:1; }
      .rec-nom { font-family:'AVA',Arial,sans-serif; font-size:29px; line-height:1; letter-spacing:5px; font-weight:800; color:#222; margin:0; white-space:nowrap; -webkit-text-stroke:0.4px currentColor; }
      .rec-slogan { font-family:Georgia,"Times New Roman",serif; font-size:11px; font-style:italic; color:#444; margin-top:2px; letter-spacing:0.2px; }
      .rec-republique { text-align:right; font-size:12px; font-weight:700; line-height:1.1; color:#111; white-space:nowrap; margin-left:8px; }
      .rec-contacts { font-size:9px; color:#222; line-height:1.45; margin-top:3px; }
      .rec-contacts b { color:#000; }
      .rec-sep { border:none; border-top:1px solid #000; margin:4px 0 6px 0; }
      .rec-titre-centre { text-align:center; font-size:15px; font-weight:800; letter-spacing:1px; color:#222; border-bottom:1px solid #000; padding-bottom:3px; }
      .rec-sep2 { border:none; border-top:1px solid #000; margin:2px 0 7px 0; }
      .rec-infos { font-size:10.5px; color:#333; }
      .rec-ligne { display:flex; justify-content:space-between; margin-bottom:2px; }
      .rec-ligne b { color:#000; }
      .rec-ligne .droite { color:#000; }
      .rec-rouge { color:#c00000; font-weight:700; }
      .rec-client { margin-top:1px; }
      .rec-client b { color:#000; }
      table.rec-table { width:100%; border-collapse:collapse; margin-top:8px; font-size:10px; }
      table.rec-table th, table.rec-table td { border:1px solid #999; padding:3px 5px; text-align:left; }
      table.rec-table th { background:#eee; font-weight:700; }
      table.rec-table td.right, table.rec-table th.right { text-align:right; }
      .rec-total { font-weight:800; background:#f5f5f5; }
      .rec-montant-lettres { font-style:italic; margin-top:8px; font-size:10px; }
      .rec-date { margin-top:14px; font-size:10px; }
      .rec-sign { margin-top:26px; text-align:right; font-size:10px; }
      .rec-sign b { color:#000; }
      .rec-cachet { margin-top:6px; border:1px dashed #777; padding:6px 10px; display:inline-block; font-size:9.5px; color:#333; }
      .rec-pied { margin-top:18px; text-align:center; font-size:8.5px; color:#555; line-height:1.4; }
      .rec-qr-block { margin-top:14px; display:flex; align-items:flex-end; justify-content:space-between; }
      .rec-qr { text-align:center; }
      .rec-qr svg { display:block; border:1px solid #ccc; padding:2px; }
      .rec-qr-label { font-size:7.5px; color:#555; margin-top:2px; max-width:96px; line-height:1.2; }
      @media print { body { margin:0; } }
    `;
  }

  /** Bloc d'en-tête partagé (logo, marque, contacts, République) */
  headerHtml(): string {
    return `
      <div class="rec-entete">
        <div class="rec-gauche">
          <div class="rec-ligne-logo">
            <img src="${this.baseUrl()}/assets/logo-ukia.png" alt="UKIA LABS" class="rec-logo" />
            <div class="rec-marque">
              <div class="rec-nom">UKIA LABS</div>
              <div class="rec-slogan">Le futur ici et maintenant</div>
            </div>
          </div>
          <div class="rec-contacts">
            <div><b>e-m@il :</b> contact@ukialabscg.com</div>
            <div><b>Web :</b> www.ukialabscg.com</div>
            <div><b>Tel :</b> +242 06 969 94 92</div>
          </div>
        </div>
        <div class="rec-republique">R&eacute;publique du Congo</div>
      </div>
    `;
  }

  /** Impression d'un document avec l'en-tête partagé et un QR code */
  printWithHeader(docTitle: string, bodyHtml: string, qrUrl?: string) {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const qrBlock = qrUrl
      ? `<div class="rec-qr-block"><div></div>${this.qr.block(qrUrl)}</div>`
      : "";
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        <style>${this.sharedCss()}</style>
      </head>
      <body onload="window.print();">
        <div class="rec-print">
          ${this.headerHtml()}
          ${bodyHtml}
          ${qrBlock}
        </div>
      </body>
      </html>
    `);
    win.document.close();
  }

  printHtml(title: string, html: string) {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: "Segoe UI", Arial, sans-serif; color: #1f2937; margin: 24px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 16px; }
          .header { border-bottom: 2px solid #14b8a6; padding-bottom: 8px; margin-bottom: 16px; }
          .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; }
          .total { font-weight: bold; background: #f9fafb; }
          .right { text-align: right; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; background: #e5e7eb; }
          @media print { body { margin: 12px; } }
        </style>
      </head>
      <body>
        ${html}
        <script>window.onload = function(){ window.print(); };</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  printDocument(doc: { titre: string; numero: string; date: string; lignes?: any[]; total?: number; clientNom?: string; fournisseur?: string; montant?: number; mode?: string; qrUrl?: string; details?: { label: string; value: string }[] }) {
    // Le document utilise désormais l'en-tête partagé
    let html = `
      <hr class="rec-sep"/>
      <div class="rec-titre-centre">${doc.titre.toUpperCase()}</div>
      <hr class="rec-sep2"/>
      <div class="rec-infos">
        <div class="rec-ligne"><span><b>Numéro :</b> ${doc.numero}</span><span class="droite"><b>Date :</b> ${doc.date}</span></div>
        ${doc.clientNom ? `<div class="rec-client"><b>Client :</b> ${doc.clientNom}</div>` : ""}
        ${doc.fournisseur ? `<div class="rec-client"><b>Fournisseur :</b> ${doc.fournisseur}</div>` : ""}
        ${doc.mode ? `<div class="rec-client"><b>Mode :</b> ${doc.mode}</div>` : ""}
      </div>
    `;
    if (doc.details && doc.details.length) {
      html += `<table class="rec-table"><tbody>`;
      for (const d of doc.details) html += `<tr><td>${d.label}</td><td class="right">${d.value}</td></tr>`;
      html += `</tbody></table>`;
    }
    if (doc.lignes && doc.lignes.length) {
      html += `<table class="rec-table"><thead><tr><th>Désignation</th><th>Qté</th><th>P.U.</th><th>TVA</th><th>Total</th></tr></thead><tbody>`;
      for (const l of doc.lignes) {
        html += `<tr><td>${l.description || ""}</td><td class="right">${l.quantite}</td><td class="right">${l.prixUnitaire}</td><td class="right">${((l.tva || 0) * 100).toFixed(0)}%</td><td class="right">${(l.total || 0).toFixed(2)}</td></tr>`;
      }
      if (doc.total !== undefined) html += `<tr class="rec-total"><td colspan="4">Total</td><td class="right">${doc.total.toFixed(2)}</td></tr>`;
      html += `</tbody></table>`;
    }
    if (doc.montant !== undefined && !doc.lignes) {
      html += `<p style="font-size:18px;font-weight:bold;margin-top:16px;">Montant : ${doc.montant.toFixed(2)}</p>`;
    }
    html += `<div class="rec-pied">R&eacute;publique du Congo<br/>Unit&eacute; * Travail * Progr&egrave;s</div>`;
    this.printWithHeader(doc.titre, html, doc.qrUrl);
  }
}
