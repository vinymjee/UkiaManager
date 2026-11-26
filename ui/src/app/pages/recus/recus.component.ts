import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { PrintService } from "../../services/print.service";
import { RecuPaiement, Facture } from "../../models";

@Component({
  selector: "app-recus",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>R&eacute;cus de paiement</h1>
        <div class="subtitle">Re&ccedil;us g&eacute;n&eacute;r&eacute;s automatiquement lors du paiement d'une facture</div>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Liste des re&ccedil;us</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Numéro</th><th>Client</th><th>Facture</th><th>Montant</th><th>Mode</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of recus">
              <td>{{ r.numero }}</td>
              <td>{{ r.clientNom }}</td>
              <td>{{ r.factureId || "-" }}</td>
              <td>{{ r.montant | number:'1.0-2' }}</td>
              <td>{{ r.mode }}</td>
              <td>{{ r.date | slice:0:10 }}</td>
              <td class="table-actions">
                <button class="btn btn-outline btn-sm" (click)="imprimer(r)">Imprimer</button>
              </td>
            </tr>
            <tr *ngIf="recus.length === 0"><td colspan="7" class="empty-state">Aucun re&ccedil;u enregistr&eacute;.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class RecusComponent implements OnInit {
  api = inject(ApiService);
  print = inject(PrintService);
  auth = inject(AuthService);

  recus: RecuPaiement[] = [];
  factures: Facture[] = [];
  erreur = "";
  message = "";

  async ngOnInit() { await this.charger(); }

  async charger() {
    const [r, f] = await Promise.all([
      this.api.get<RecuPaiement[]>("/recus"),
      this.api.get<Facture[]>("/factures"),
    ]);
    this.recus = r.data || [];
    this.factures = f.data || [];
  }

  imprimer(r: RecuPaiement) {
    const facture = this.factures.find((f) => f.id === r.factureId);
    const montantVersé = r.montant;
    const reste = facture ? Math.max(0, facture.ttc - montantVersé) : 0;
    const u = this.auth.utilisateur();
    const nominatif = u?.titre ? `${u.titre} ${u.nom}` : u?.nom || "";
    const cachet = u?.cachet || "";
    const code = "PS/CLT/MGR";
    const lignes = facture?.lignes || [];
    const total = montantVersé;
    const dateStr = r.date?.slice(0, 10) || "";
    const matricule = r.clientId || "UKLC_7";
    const numFacture = facture?.numero || r.factureId || "00186";
    const clientNom = r.clientNom || "Lycée CHAMINADE";
    const base = window.location.origin;
    const logoUrl = `${base}/assets/logo-ukia.png`;
    const fontUrl = `${base}/assets/fonts/AVA.ttf`;

    const css = `
      @font-face { font-family:'AVA'; src:url('${fontUrl}') format('truetype'); font-weight:normal; font-style:normal; }
      @page { size: A4; margin: 10mm 9mm; }
      body { font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; color:#111; font-size:11px; line-height:1.3; margin:0; }
      .rec-print { max-width:192mm; margin:0 auto; }
      .rec-entete { position:relative; display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:4px; }
      .rec-gauche { flex:1; }
      .rec-ligne-logo { display:flex; align-items:flex-start; gap:6px; }
      .rec-logo { width:64px; height:auto; display:block; }
      .rec-marque { flex:1; }
      .rec-nom { font-family:'AVA',Arial,sans-serif; font-size:29px; line-height:1; letter-spacing:5px; font-weight:400; color:#222; margin:0; white-space:nowrap; }
      .rec-slogan { font-family:Georgia,"Times New Roman",serif; font-size:11px; font-style:italic; color:#444; margin-top:2px; letter-spacing:0.2px; }
      .rec-republique { text-align:right; font-size:9px; font-weight:700; line-height:1.15; color:#111; white-space:nowrap; margin-left:8px; }
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
      @media print { body { margin:0; } }
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Reçu de paiement</title>
        <style>${css}</style>
      </head>
      <body onload="window.print();">
        <div class="rec-print">
          <div class="rec-entete">
            <div class="rec-gauche">
              <div class="rec-ligne-logo">
                <img src="${logoUrl}" alt="UKIA LABS" class="rec-logo" />
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
            <div class="rec-republique">R&eacute;publique du<br/>Congo</div>
          </div>
          <hr class="rec-sep"/>
          <div class="rec-titre-centre">RECU DE PAIEMENT</div>
          <hr class="rec-sep2"/>
          <div class="rec-infos">
            <div class="rec-ligne"><span><b>Matricule client :</b> ${matricule}</span><span class="droite"><b>Num&eacute;ro facture :</b> <span class="rec-rouge">${numFacture}</span> /2026</span></div>
            <div class="rec-client"><b>Client :</b> ${clientNom}</div>
          </div>
          <table class="rec-table">
            <thead>
              <tr><th style="width:14%">Code</th><th style="width:46%">Intitul&eacute;</th><th class="right" style="width:20%">Montant Vers&eacute;</th><th class="right" style="width:20%">Reste</th></tr>
            </thead>
            <tbody>
              ${lignes.length ? lignes.map((l) => `<tr><td>${code}</td><td>${l.description || ""}</td><td class="right">${Number(l.total || 0).toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>`).join("") : `<tr><td>${code}</td><td>Paiement</td><td class="right">${montantVersé.toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>`}
              <tr class="rec-total"><td colspan="2">Total vers&eacute;</td><td class="right">${total.toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>
            </tbody>
          </table>
          <p class="rec-montant-lettres">${this.montantEnLettres(total)}</p>
          <div class="rec-date">Brazzaville : le ${dateStr}</div>
          <div class="rec-sign">
            <div><b>${nominatif}</b></div>
            ${cachet ? `<div class="rec-cachet">${cachet}</div>` : ""}
          </div>
          <div class="rec-pied">R&eacute;publique du Congo<br/>Unit&eacute; * Travail * Progr&egrave;s</div>
        </div>
      </body>
      </html>
    `;
    this.print.printHtml("Reçu de paiement", html);
  }

  montantEnLettres(n: number): string {
    return n.toLocaleString("fr-FR") + " francs CFA";
  }
}
