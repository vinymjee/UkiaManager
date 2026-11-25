import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { FactureProForma, Client } from "../../models";

@Component({
  selector: "app-proforma",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Factures Pro forma</h1>
        <div class="subtitle">Établissez des factures pro forma pour vos clients</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="ouvrirFormulaire()">Nouvelle pro forma</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <div *ngIf="formVisible" class="card card-body">
      <div class="card-header">
        <div class="card-title">Nouvelle facture pro forma</div>
        <button class="btn btn-ghost btn-sm" (click)="fermerFormulaire()">Fermer</button>
      </div>

      <form (ngSubmit)="enregistrer()" #form="ngForm" class="form-grid">
        <input type="hidden" name="id" [ngModel]="pf.id" />
        <input type="hidden" name="agentId" [ngModel]="auth.utilisateur()?.id" />
        <input type="hidden" name="agentNom" [ngModel]="auth.utilisateur()?.nom" />

        <div class="form-group">
          <label class="form-label">Client</label>
          <select name="clientId" [(ngModel)]="pf.clientId" required class="form-select">
            <option value="">-- Sélectionner un client --</option>
            <option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" name="date" [(ngModel)]="pf.date" required class="form-input" />
        </div>

        <div class="form-group full">
          <label class="form-label">Lignes</label>
          <table class="data-table" style="margin-top: var(--space-2);">
            <thead>
              <tr>
                <th>Désignation</th><th>Quantité</th><th>Prix unitaire</th><th>TVA %</th><th>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of pf.lignes; let i = index">
                <td><input type="text" name="desc-{{i}}" [(ngModel)]="l.description" placeholder="Désignation" class="form-input" /></td>
                <td><input type="number" name="qte-{{i}}" [(ngModel)]="l.quantite" (change)="recalculLigne(i)" step="1" class="form-input" /></td>
                <td><input type="number" name="pu-{{i}}" [(ngModel)]="l.prixUnitaire" (change)="recalculLigne(i)" step="0.01" class="form-input" /></td>
                <td><input type="number" name="tva-{{i}}" [(ngModel)]="l.tva" (change)="recalculLigne(i)" step="0.01" class="form-input" /></td>
                <td>{{ l.total | number:'1.0-2' }}</td>
                <td><button type="button" class="btn btn-danger btn-sm" (click)="supprimerLigne(i)">Supprimer</button></td>
              </tr>
              <tr>
                <td colspan="6">
                  <button type="button" class="btn btn-outline btn-sm" (click)="ajouterLigne()">+ Ajouter une ligne</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: var(--space-3); font-weight: var(--font-weight-semibold);">
            HT : {{ totaux.ht | number:'1.0-2' }} &nbsp;|&nbsp; TVA : {{ totaux.tva | number:'1.0-2' }} &nbsp;|&nbsp; TTC : {{ totaux.ttc | number:'1.0-2' }}
          </div>
        </div>

        <div class="form-actions" style="margin-top: var(--space-5);">
          <button type="submit" class="btn btn-success" [disabled]="chargement || !form.valid">{{ chargement ? "Enregistrement..." : "Enregistrer la pro forma" }}</button>
          <button type="button" class="btn btn-outline" (click)="fermerFormulaire()">Annuler</button>
        </div>
      </form>
    </div>

    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Liste des factures pro forma</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Numéro</th><th>Client</th><th>Date</th><th>HT</th><th>TVA</th><th>TTC</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of proformas">
              <td>{{ p.numero }}</td>
              <td>{{ p.clientNom }}</td>
              <td>{{ p.date | slice:0:10 }}</td>
              <td>{{ p.ht | number:'1.0-2' }}</td>
              <td>{{ p.tva | number:'1.0-2' }}</td>
              <td>{{ p.ttc | number:'1.0-2' }}</td>
            </tr>
            <tr *ngIf="proformas.length === 0"><td colspan="6" class="empty-state">Aucune facture pro forma enregistrée.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ProformaComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  proformas: FactureProForma[] = [];
  clients: Client[] = [];
  erreur = "";
  message = "";
  formVisible = false;
  chargement = false;
  pf: FactureProForma = this.newPf();
  totaux = { ht: 0, tva: 0, ttc: 0 };

  newPf(): FactureProForma {
    return {
      id: "", numero: "", clientId: "", clientNom: "", date: new Date().toISOString().slice(0, 10),
      lignes: [], ht: 0, tva: 0, ttc: 0, agentId: "", agentNom: "",
    };
  }

  async ngOnInit() {
    this.charger();
    const c = await this.api.get<Client[]>("/clients");
    this.clients = c.data || [];
  }

  async charger() {
    const r = await this.api.get<FactureProForma[]>("/factures-proforma");
    this.proformas = r.data || [];
  }

  ouvrirFormulaire() {
    this.pf = this.newPf();
    this.ajouterLigne();
    this.formVisible = true;
    this.erreur = "";
    this.message = "";
  }

  fermerFormulaire() { this.formVisible = false; }

  ajouterLigne() {
    this.pf.lignes.push({ description: "", quantite: 1, prixUnitaire: 0, tva: 0.18, total: 0 });
    this.calculerTotaux();
  }

  supprimerLigne(i: number) {
    this.pf.lignes.splice(i, 1);
    this.calculerTotaux();
  }

  recalculLigne(i: number) {
    const l = this.pf.lignes[i];
    l.total = (l.quantite || 0) * (l.prixUnitaire || 0);
    this.calculerTotaux();
  }

  calculerTotaux() {
    this.totaux.ht = this.pf.lignes.reduce((s, l) => s + (l.total || 0), 0);
    this.totaux.tva = this.pf.lignes.reduce((s, l) => s + (l.total || 0) * (l.tva || 0), 0);
    this.totaux.ttc = this.totaux.ht + this.totaux.tva;
    this.pf.ht = this.totaux.ht;
    this.pf.tva = this.totaux.tva;
    this.pf.ttc = this.totaux.ttc;
  }

  async enregistrer() {
    this.erreur = "";
    this.chargement = true;
    this.calculerTotaux();
    const r = await this.api.post<FactureProForma>("/factures-proforma", this.pf);
    this.chargement = false;
    if (r.ok) {
      this.message = "Facture pro forma enregistrée avec succès.";
      this.formVisible = false;
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur lors de l'enregistrement.";
    }
  }
}
