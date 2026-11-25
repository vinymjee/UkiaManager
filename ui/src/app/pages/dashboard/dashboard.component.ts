import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../services/api.service";
import { Facture, Devis, FactureProForma, RecuPaiement, BordereauDepense } from "../../models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-header">
      <h1>Tableau de bord</h1>
      <div class="subtitle">Vue d'ensemble de la caisse</div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="value">{{ factures.length }}</div><div class="label">Factures</div></div>
      <div class="stat-card"><div class="value">{{ devis.length }}</div><div class="label">Devis</div></div>
      <div class="stat-card"><div class="value">{{ recus.length }}</div><div class="label">R&eacute;cus</div></div>
      <div class="stat-card"><div class="value">{{ bordereaux.length }}</div><div class="label">Bordereaux de d&eacute;pense</div></div>
    </div>

    <div class="card">
      <div class="card-title">Factures r&eacute;centes</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N&deg;</th><th>Client</th><th>Date</th><th>TTC</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let f of factures.slice(0, 8)">
              <td>{{ f.numero }}</td><td>{{ f.clientNom }}</td><td>{{ f.date | slice:0:10 }}</td>
              <td>{{ f.ttc | number }} {{ devise }}</td>
              <td><span class="badge" [class]="'badge-' + (f.statut||'').toLowerCase()">{{ f.statut }}</span></td>
              <td><a class="btn btn-outline btn-sm">Voir</a></td>
            </tr>
            <tr *ngIf="factures.length === 0"><td colspan="6" class="empty">Aucune facture pour le moment.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Bordereaux de d&eacute;pense r&eacute;cents</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N&deg;</th><th>Fournisseur</th><th>Date</th><th>Total</th><th>Statut</th></tr></thead>
          <tbody>
            <tr *ngFor="let b of bordereaux.slice(0, 8)">
              <td>{{ b.numero }}</td><td>{{ b.fournisseur }}</td><td>{{ b.date | slice:0:10 }}</td>
              <td>{{ b.total | number }}</td>
              <td><span class="badge" [class]="'badge-' + (b.statut||'').toLowerCase()">{{ b.statut }}</span></td>
            </tr>
            <tr *ngIf="bordereaux.length === 0"><td colspan="5" class="empty">Aucun bordereau pour le moment.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  api = inject(ApiService);
  devise = "XOF";
  factures: Facture[] = [];
  devis: Devis[] = [];
  recus: RecuPaiement[] = [];
  bordereaux: BordereauDepense[] = [];

  async ngOnInit() {
    const [f, d, r, b, p] = await Promise.all([
      this.api.get<Facture[]>("/factures"),
      this.api.get<Devis[]>("/devis"),
      this.api.get<RecuPaiement[]>("/recus"),
      this.api.get<BordereauDepense[]>("/bordereaux"),
      this.api.get<{ tauxTva: number; devise: string }>("/parametres"),
    ]);
    this.factures = f.data || [];
    this.devis = d.data || [];
    this.recus = r.data || [];
    this.bordereaux = b.data || [];
    this.devise = p.data?.devise || "XOF";
  }
}
