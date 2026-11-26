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
    const client = null;
    const montantVersé = r.montant;
    const reste = facture ? Math.max(0, facture.ttc - montantVersé) : 0;
    const u = this.auth.utilisateur();
    const nominatif = u?.titre ? `${u.titre}\\n${u.nom}` : u?.nom || "";
    const cachet = u?.cachet || "";
    const code = "PS/CLT/MGR";
    const lignes = facture?.lignes || [];
    const total = montantVersé;
    const dateStr = r.date?.slice(0, 10) || "";
    const html = `
      <div style="text-align:center; font-size:11px; color:#555; margin-bottom:4px;">
        e-m@il : contact@ukialabscg.com &nbsp; Web : www.ukialabscg.com &nbsp; Tel : +242 06 969 94 92
      </div>
      <div class="header"><h1>RECU DE PAIEMENT</h1></div>
      <div class="meta">
        Matricule client : ${r.clientId} &nbsp;&nbsp; Numéro facture : ${facture?.numero || r.factureId || "-"} /2026
      </div>
      <p><strong>Client :</strong> ${r.clientNom || "-"}</p>
      <table>
        <thead>
          <tr><th>Code</th><th>Intitulé</th><th>Montant Versé</th><th>Reste</th></tr>
        </thead>
        <tbody>
          ${lignes.length ? lignes.map((l) => `<tr><td>${code}</td><td>${l.description}</td><td class="right">${(l.total || 0).toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>`).join("") : `<tr><td>${code}</td><td>Paiement</td><td class="right">${montantVersé.toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>`}
          <tr class="total"><td colspan="2">Total versé</td><td class="right">${total.toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>
        </tbody>
      </table>
      <p style="margin-top:12px; font-style:italic;">${this.montantEnLettres(total)}</p>
      <div style="margin-top:24px;">Brazzaville : le ${dateStr}</div>
      <div style="margin-top:32px; text-align:right;">
        <div style="font-weight:bold;">${nominatif.replace("\\n", "<br/>")}</div>
        ${cachet ? `<div style="margin-top:8px; border:1px dashed #999; padding:8px; display:inline-block;">${cachet}</div>` : ""}
      </div>
      <div style="margin-top:24px; text-align:center; font-size:11px; color:#555;">
        République du Congo<br/>Unité * Travail * Progrès
      </div>
    `;
    this.print.printHtml("Reçu de paiement", html);
  }

  montantEnLettres(n: number): string {
    return n.toLocaleString("fr-FR") + " francs CFA";
  }
}
