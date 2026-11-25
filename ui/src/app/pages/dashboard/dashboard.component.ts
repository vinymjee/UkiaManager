import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../services/api.service";
import { Facture, Devis, FactureProForma, RecuPaiement, BordereauDepense, Parametres } from "../../models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Tableau de bord</h1>
        <div class="subtitle">Vue d'ensemble de votre activité</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="nouvelleFacture()">Nouvelle facture</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{{ factures.length }}</div>
        <div class="stat-label">Factures</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ devis.length }}</div>
        <div class="stat-label">Devis</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ recus.length }}</div>
        <div class="stat-label">R&eacute;cus</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ bordereaux.length }}</div>
        <div class="stat-label">Bordereaux</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
      <div class="card card-body" style="padding:0;">
        <div class="card-header">
          <div class="card-title">Factures r&eacute;centes</div>
          <a routerLink="/factures" class="link-btn">Voir toutes</a>
        </div>
        <div class="table-wrap" style="border:none; border-top:1px solid rgb(var(--color-border));">
          <table class="data-table">
            <thead>
              <tr>
                <th>N&deg;</th><th>Client</th><th>Date</th><th>Montant</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of factures.slice(0, 6)">
                <td>{{ f.numero }}</td>
                <td>{{ f.clientNom }}</td>
                <td>{{ f.date | slice:0:10 }}</td>
                <td>{{ f.ttc | number:'1.0-2' }} {{ devise }}</td>
                <td><span class="badge" [class]="'badge-' + statutClass(f.statut)">{{ f.statut }}</span></td>
              </tr>
              <tr *ngIf="factures.length === 0"><td colspan="5" class="empty-state">Aucune facture pour le moment.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card card-body" style="padding:0;">
        <div class="card-header">
          <div class="card-title">Derniers bordereaux</div>
          <a routerLink="/bordereaux" class="link-btn">Voir toutes</a>
        </div>
        <div class="table-wrap" style="border:none; border-top:1px solid rgb(var(--color-border));">
          <table class="data-table">
            <thead>
              <tr><th>N&deg;</th><th>Fournisseur</th><th>Date</th><th>Total</th><th>Statut</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of bordereaux.slice(0, 6)">
                <td>{{ b.numero }}</td>
                <td>{{ b.fournisseur }}</td>
                <td>{{ b.date | slice:0:10 }}</td>
                <td>{{ b.total | number:'1.0-2' }}</td>
                <td><span class="badge" [class]="'badge-' + statutClass(b.statut)">{{ b.statut }}</span></td>
              </tr>
              <tr *ngIf="bordereaux.length === 0"><td colspan="5" class="empty-state">Aucun bordereau pour le moment.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header">
        <div class="card-title">Actions rapides</div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">
        <button class="btn btn-outline" (click)="nouvelleFacture()">&#128203; Nouvelle facture</button>
        <button class="btn btn-outline" (click)="nouveauDevis()">&#128204; Nouveau devis</button>
        <button class="btn btn-outline" (click)="nouveauRecu()">&#128179; Nouveau re&ccedil;u</button>
        <button class="btn btn-outline" (click)="nouveauBordereau()">&#128202; Nouveau bordereau</button>
        <button class="btn btn-outline" routerLink="/clients">&#128100; Gérer les clients</button>
        <button class="btn btn-outline" routerLink="/journal">&#128201; Journal comptable</button>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  api = inject(ApiService);

  factures: Facture[] = [];
  devis: Devis[] = [];
  recus: RecuPaiement[] = [];
  bordereaux: BordereauDepense[] = [];
  devise = "XOF";

  async ngOnInit() {
    const [f, d, r, b, p] = await Promise.all([
      this.api.get<Facture[]>("/factures"),
      this.api.get<Devis[]>("/devis"),
      this.api.get<RecuPaiement[]>("/recus"),
      this.api.get<BordereauDepense[]>("/bordereaux"),
      this.api.get<Parametres>("/parametres"),
    ]);
    this.factures = f.data || [];
    this.devis = d.data || [];
    this.recus = r.data || [];
    this.bordereaux = b.data || [];
    this.devise = p.data?.devise || "XOF";
  }

  statutClass(s: string) {
    const map: Record<string, string> = {
      BROUILLON: "secondary",
      ENVOYEE: "info",
      PAYEE: "success",
      ACCEPTE: "success",
      ANNULEE: "error",
      REFUSE: "error",
      VALIDEE: "success",
    };
    return map[s] || "secondary";
  }

  nouvelleFacture() { /* placeholder */ }
  nouveauDevis() { /* placeholder */ }
  nouveauRecu() { /* placeholder */ }
  nouveauBordereau() { /* placeholder */ }
}
