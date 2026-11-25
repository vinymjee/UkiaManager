import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { BordereauDepense, Ligne } from "../../models";

@Component({
  selector: "app-bordereaux",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <h1>Bordereaux de d&eacute;pense</h1>
      <button class="btn btn-primary" (click)="nouveauBordereau()">Nouveau bordereau</button>
    </div>
    <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message">{{ message }}</div>

    <div class="card" *ngIf="formVisible">
      <div class="card-title">Nouveau bordereau de d&eacute;pense</div>
      <div class="form-row">
        <div class="form-group"><label>Fournisseur</label><input [(ngModel)]="nouveau.fournisseur" required /></div>
        <div class="form-group"><label>Date</label><input type="date" [(ngModel)]="nouveau.date" /></div>
      </div>
      <div class="card"><div class="card-title">Lignes</div>
        <table class="lines-table">
          <thead><tr><th>D&e9;signation</th><th>Qte</th><th>Prix unit.</th><th>TVA %</th><th>Total</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let l of nouveau.lignes; let i = index">
              <td><input [(ngModel)]="l.description" placeholder="D&e9;signation" /></td>
              <td><input type="number" [(ngModel)]="l.quantite" (change)="recalcul(i)" /></td>
              <td><input type="number" [(ngModel)]="l.prixUnitaire" (change)="recalcul(i)" /></td>
              <td><input type="number" [(ngModel)]="l.tva" step="0.01" (change)="recalcul(i)" /></td>
              <td>{{ l.total | number }}</td>
              <td><button class="btn btn-danger btn-sm" (click)="supprimerLigne(i)">X</button></td>
            </tr>
            <tr><td colspan="6"><button class="btn btn-outline btn-sm" (click)="ajouterLigne()">+ Ligne</button></td></tr>
          </tbody>
        </table>
      </div>
      <div class="form-actions">
        <button class="btn btn-success" (click)="enregistrer()" [disabled]="chargement">Enregistrer</button>
        <button class="btn btn-outline" (click)="annulerForm()">Annuler</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Liste des bordereaux</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N&deg;</th><th>Fournisseur</th><th>Date</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let b of bordereaux">
              <td>{{ b.numero }}</td><td>{{ b.fournisseur }}</td><td>{{ b.date | slice:0:10 }}</td>
              <td>{{ b.total | number }}</td>
              <td><span class="badge" [class]="'badge-' + (b.statut||'').toLowerCase()">{{ b.statut }}</span></td>
              <td>
                <button *ngIf="b.statut==='BROUILLON'" class="btn btn-outline btn-sm" (click)="changer(b,'valider')">Valider</button>
                <button *ngIf="b.statut!=='ANNULEE'" class="btn btn-danger btn-sm" (click)="changer(b,'annuler')">Annuler</button>
              </td>
            </tr>
            <tr *ngIf="bordereaux.length === 0"><td colspan="6" class="empty">Aucun bordereau.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class BordereauxComponent implements OnInit {
  api = inject(ApiService);
  bordereaux: BordereauDepense[] = [];
  erreur = ""; message = ""; formVisible = false; chargement = false;
  nouveau: any = { fournisseur: "", date: new Date().toISOString().slice(0,10), lignes: [] };

  async ngOnInit() { this.charger(); }
  async charger() { const r = await this.api.get<BordereauDepense[]>("/bordereaux"); this.bordereaux = r.data || []; }
  nouveauBordereau() { this.nouveau = { fournisseur: "", date: new Date().toISOString().slice(0,10), lignes: [] }; this.ajouterLigne(); this.formVisible = true; this.erreur = ""; this.message = ""; }
  annulerForm() { this.formVisible = false; }
  ajouterLigne() { this.nouveau.lignes.push({ description: "", quantite: 1, prixUnitaire: 0, tva: 0.18, total: 0 }); }
  supprimerLigne(i: number) { this.nouveau.lignes.splice(i, 1); }
  recalcul(i: number) { const l = this.nouveau.lignes[i]; l.total = (l.quantite||0)*(l.prixUnitaire||0); }
  async enregistrer() {
    this.erreur = ""; this.chargement = true;
    const r = await this.api.post<BordereauDepense>("/bordereaux", this.nouveau);
    this.chargement = false;
    if (r.ok) { this.message = "Bordereau enregistr&eacute;."; this.formVisible = false; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }
  async changer(b: BordereauDepense, action: string) {
    const r = await this.api.post(`/bordereaux/${b.id}/${action}`);
    if (r.ok) await this.charger(); else this.erreur = r.erreur || "Erreur.";
  }
}
