import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class PrintService {
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

  printDocument(doc: { titre: string; numero: string; date: string; lignes?: any[]; total?: number; clientNom?: string; fournisseur?: string; montant?: number; mode?: string; details?: { label: string; value: string }[] }) {
    let html = `<div class="header"><h1>${doc.titre}</h1><div class="meta">N° ${doc.numero} — Date : ${doc.date}</div></div>`;
    if (doc.clientNom) html += `<p><strong>Client :</strong> ${doc.clientNom}</p>`;
    if (doc.fournisseur) html += `<p><strong>Fournisseur :</strong> ${doc.fournisseur}</p>`;
    if (doc.mode) html += `<p><strong>Mode de paiement :</strong> ${doc.mode}</p>`;
    if (doc.details) {
      html += `<table><tbody>`;
      for (const d of doc.details) html += `<tr><td>${d.label}</td><td class="right">${d.value}</td></tr>`;
      html += `</tbody></table>`;
    }
    if (doc.lignes && doc.lignes.length) {
      html += `<table><thead><tr><th>Désignation</th><th>Qté</th><th>P.U.</th><th>TVA</th><th>Total</th></tr></thead><tbody>`;
      for (const l of doc.lignes) {
        html += `<tr><td>${l.description || ""}</td><td class="right">${l.quantite}</td><td class="right">${l.prixUnitaire}</td><td class="right">${((l.tva || 0) * 100).toFixed(0)}%</td><td class="right">${(l.total || 0).toFixed(2)}</td></tr>`;
      }
      if (doc.total !== undefined) html += `<tr class="total"><td colspan="4">Total</td><td class="right">${doc.total.toFixed(2)}</td></tr>`;
      html += `</tbody></table>`;
    }
    if (doc.montant !== undefined && !doc.lignes) {
      html += `<p style="font-size:18px;font-weight:bold;margin-top:16px;">Montant : ${doc.montant.toFixed(2)}</p>`;
    }
    this.printHtml(doc.titre, html);
  }
}