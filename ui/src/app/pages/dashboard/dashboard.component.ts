import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { Facture, Devis, FactureProForma, RecuPaiement, BordereauDepense, Parametres } from "../../models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="app-header">
      <div>
        <h1>Tableau de bord</h1>
        <div class="subtitle">Vue d'ensemble de votre activité</div>
      </div>
      <div class="app-header-actions">
        <a routerLink="/factures" class="btn btn-primary">Nouvelle facture</a>
      </div>
    </div>

    <!-- Cartes interactives : raccourcis vers les modules -->
    <div class="stat-grid">
      <a routerLink="/factures" class="stat-card stat-link">
        <div class="stat-icon">&#128203;</div>
        <div class="stat-value">{{ factures.length }}</div>
        <div class="stat-label">Factures &rarr;</div>
      </a>
      <a routerLink="/devis" class="stat-card stat-link">
        <div class="stat-icon">&#128204;</div>
        <div class="stat-value">{{ devis.length }}</div>
        <div class="stat-label">Devis &rarr;</div>
      </a>
      <a routerLink="/recus" class="stat-card stat-link">
        <div class="stat-icon">&#128179;</div>
        <div class="stat-value">{{ recus.length }}</div>
        <div class="stat-label">R&eacute;cus &rarr;</div>
      </a>
      <a routerLink="/bordereaux" class="stat-card stat-link">
        <div class="stat-icon">&#128202;</div>
        <div class="stat-value">{{ bordereaux.length }}</div>
        <div class="stat-label">Bordereaux &rarr;</div>
      </a>
      <a routerLink="/clients" class="stat-card stat-link">
        <div class="stat-icon">&#128100;</div>
        <div class="stat-value">{{ clients.length }}</div>
        <div class="stat-label">Clients &rarr;</div>
      </a>
      <a routerLink="/caisse" class="stat-card stat-link">
        <div class="stat-icon">&#128176;</div>
        <div class="stat-value">{{ solde | number:'1.0-2' }}</div>
        <div class="stat-label">Solde caisse &rarr;</div>
      </a>
      <a routerLink="/journal" class="stat-card stat-link">
        <div class="stat-icon">&#128201;</div>
        <div class="stat-value">{{ ecritures.length }}</div>
        <div class="stat-label">&Eacute;critures &rarr;</div>
      </a>
      <a *ngIf="auth.isSuperviseur()" routerLink="/utilisateurs" class="stat-card stat-link">
        <div class="stat-icon">&#128101;</div>
        <div class="stat-value">{{ utilisateurs.length }}</div>
        <div class="stat-label">Utilisateurs &rarr;</div>
      </a>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);" class="dashboard-tables">
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
      <div class="quick-grid">
        <a routerLink="/factures" class="btn btn-outline">&#128203; Nouvelle facture</a>
        <a routerLink="/devis" class="btn btn-outline">&#128204; Nouveau devis</a>
        <a routerLink="/proforma" class="btn btn-outline">&#128209; Facture pro forma</a>
        <a routerLink="/caisse" class="btn btn-outline">&#128176; Op&eacute;ration de caisse</a>
        <a routerLink="/bordereaux" class="btn btn-outline">&#128202; Nouveau bordereau</a>
        <a routerLink="/clients" class="btn btn-outline">&#128100; G&eacute;rer les clients</a>
        <a routerLink="/journal" class="btn btn-outline">&#128201; Journal comptable</a>
        <a routerLink="/exploitation" class="btn btn-outline">&#128200; Compte d'exploitation</a>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  factures: Facture[] = [];
  devis: Devis[] = [];
  proformas: FactureProForma[] = [];
  recus: RecuPaiement[] = [];
  bordereaux: BordereauDepense[] = [];
  clients: any[] = [];
  utilisateurs: any[] = [];
  ecritures: any[] = [];
  solde = 0;
  devise = "XOF";

  async ngOnInit() {
    const [f, d, pf, r, b, c, p, j] = await Promise.all([
      this.api.get<Facture[]>("/factures"),
      this.api.get<Devis[]>("/devis"),
      this.api.get<FactureProForma[]>("/factures-proforma"),
      this.api.get<RecuPaiement[]>("/recus"),
      this.api.get<BordereauDepense[]>("/bordereaux"),
      this.api.get<any[]>("/clients"),
      this.api.get<Parametres>("/parametres"),
      this.api.get<any[]>("/journal"),
    ]);
    this.factures = f.data || [];
    this.devis = d.data || [];
    this.proformas = pf.data || [];
    this.recus = r.data || [];
    this.bordereaux = b.data || [];
    this.clients = c.data || [];
    this.ecritures = j.data || [];
    this.devise = p.data?.devise || "XOF";

    const ca = await this.api.get<any>("/caisses");
    this.solde = ca.data?.solde || 0;

    if (this.auth.isSuperviseur()) {
      const u = await this.api.get<any[]>("/utilisateurs");
      this.utilisateurs = u.data || [];
    }
  }

  statutClass(s: string) {
    const map: Record<string, string> = {
      BROUILLON: "secondary", ENVOYEE: "info", PAYEE: "success",
      ACCEPTE: "success", ANNULEE: "error", REFUSE: "error", VALIDEE: "success",
    };
    return map[s] || "secondary";
  }
}
