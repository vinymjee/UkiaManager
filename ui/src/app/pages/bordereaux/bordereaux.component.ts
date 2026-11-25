import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { BordereauDepense } from "../../models";

@Component({
  selector: "app-bordereaux",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Bordereaux de d&eacute;pense</h1>
        <div class="subtitle">Enregistrez et suivez vos d&eacute;penses professionnelles</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="ouvrirFormulaire()">Nouveau bordereau</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <div *ngIf="formVisible" class="card card-body">
      <div class="card-header">
        <div class="card-title">Nouveau bordereau de d&eacute;pense</div>
        <button class="btn btn-ghost btn-sm" (click)="fermerFormulaire()">Fermer</button>
      </div>

      <form (ngSubmit)="enregistrer()" #form="ngForm" class="form-grid">
        <input type="hidden" name="id" [ngModel]="bord.id" />
        <input type="hidden" name="agentId" [ngModel]="auth.utilisateur()?.id" />
        <input type="hidden" name="agentNom" [ngModel]="auth.utilisateur()?.nom" />

        <div class="form-group">
          <label class="form-label">Fournisseur</label>
          <input type="text" name="fournisseur" [(ngModel)]="bord.fournisseur" required class="form-input" placeholder="Nom du fournisseur" />
        </div>

        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" name="date" [(ngModel)]="bord.date" required class="form-input" />
        </div>

        <div class="form-group full">
          <label class="form-label">Lignes de d&eacute;pense</label>
          <table class="data-table" style="margin-top: var(--space-2);">
            <thead>
              <tr>
                <th>Désignation</th><th>Quantité</th><th>Prix unitaire</th><th>TVA %</th><th>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of bord.lignes; let i = index">
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
          <div style="margin-top: var(--space-3); font-weight: var(--font-weight-semibold); font-size: var(--text-lg);">
            Total : {{ totaux | number:'1.0-2' }}
          </div>
        </div>

        <div class="form-actions" style="margin-top: var(--space-5);">
          <button type="submit" class="btn btn-success" [disabled]="chargement || !form.valid">{{ chargement ? "Enregistrement..." : "Enregistrer le bordereau" }}</button>
          <button type="button" class="btn btn-outline" (click)="fermerFormulaire()">Annuler</button>
        </div>
      </form>
    </div>

    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Liste des bordereaux de d&eacute;pense</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Numéro</th><th>Fournisseur</th><th>Date</th><th>Total</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of bordereaux">
              <td>{{ b.numero }}</td>
              <td>{{ b.fournisseur }}</td>
              <td>{{ b.date | slice:0:10 }}</td>
              <td>{{ b.total | number:'1.0-2' }}</td>
              <td><span class="badge" [class]="'badge-' + statutClass(b.statut)">{{ b.statut }}</span></td>
              <td class="table-actions">
                <button *ngIf="b.statut === 'BROUILLON'" class="btn btn-outline btn-sm" (click)="changerStatut(b, 'valider')">Valider</button>
                <button *ngIf="b.statut !== 'ANNULEE'" class="btn btn-danger btn-sm" (click)="changerStatut(b, 'annuler')">Annuler</button>
              </td>
            </tr>
            <tr *ngIf="bordereaux.length === 0"><td colspan="6" class="empty-state">Aucun bordereau enregistr&eacute;.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class BordereauxComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  bordereaux: BordereauDepense[] = [];
  erreur = "";
  message = "";
  formVisible = false;
  chargement = false;
  bord: BordereauDepense = this.newBord();
  totaux = 0;

  newBord(): BordereauDepense {
    return {
      id: "", numero: "", date: new Date().toISOString().slice(0, 10), fournisseur: "",
      lignes: [], total: 0, statut: "BROUILLON", agentId: "", agentNom: "",
    };
  }

  async ngOnInit() { this.charger(); }

  async charger() {
    const r = await this.api.get<BordereauDepense[]>("/bordereaux");
    this.bordereaux = r.data || [];
  }

  ouvrirFormulaire() {
    this.bord = this.newBord();
    this.ajouterLigne();
    this.formVisible = true;
    this.erreur = "";
    this.message = "";
  }

  fermerFormulaire() { this.formVisible = false; }

  ajouterLigne() {
    this.bord.lignes.push({ description: "", quantite: 1, prixUnitaire: 0, tva: 0.18, total: 0 });
    this.calculerTotal();
  }

  supprimerLigne(i: number) {
    this.bord.lignes.splice(i, 1);
    this.calculerTotal();
  }

  recalculLigne(i: number) {
    const l = this.bord.lignes[i];
    l.total = (l.quantite || 0) * (l.prixUnitaire || 0);
    this.calculerTotal();
  }

  calculerTotal() {
    this.totaux = this.bord.lignes.reduce((s, l) => s + (l.total || 0), 0);
    this.bord.total = this.totaux;
  }

  async enregistrer() {
    this.erreur = "";
    this.chargement = true;
    this.calculerTotal();
    const r = await this.api.post<BordereauDepense>("/bordereaux", this.bord);
    this.chargement = false;
    if (r.ok) {
      this.message = "Bordereau enregistr&eacute; avec succ&egrave;s.";
      this.formVisible = false;
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur lors de l'enregistrement.";
    }
  }

  async changerStatut(b: BordereauDepense, action: string) {
    const r = await this.api.post(`/bordereaux/${b.id}/${action}`);
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }

  statutClass(s: string) {
    const map: Record<string, string> = {
      BROUILLON: "secondary", VALIDEE: "success", ANNULEE: "error", PAYEE: "success",
    };
    return map[s] || "secondary";
  }
}
