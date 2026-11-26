import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { PrintService } from "../../services/print.service";
import { RecuPaiement } from "../../models";

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

  recus: RecuPaiement[] = [];
  erreur = "";
  message = "";

  async ngOnInit() { this.charger(); }

  async charger() {
    const r = await this.api.get<RecuPaiement[]>("/recus");
    this.recus = r.data || [];
  }

  imprimer(r: RecuPaiement) {
    this.print.printDocument({
      titre: "Reçu de paiement",
      numero: r.numero,
      date: r.date,
      clientNom: r.clientNom,
      mode: r.mode,
      montant: r.montant,
      details: [
        { label: "Montant payé", value: r.montant.toFixed(2) },
        { label: "Mode", value: r.mode },
        { label: "Date", value: r.date?.slice(0, 10) },
      ],
    });
  }
}
