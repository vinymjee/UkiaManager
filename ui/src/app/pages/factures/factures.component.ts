import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { Facture, Client, Ligne } from "../../models";

@Component({
  selector: "app-factures",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <h1>Factures</h1>
      <button class="btn btn-primary" (click)="nouvelleFacture()">Nouvelle facture</button>
    </div>

    <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message">{{ message }}</div>

    <div class="card" *ngIf="formVisible">
      <div class="card-title">Nouvelle facture</div>
      <div class="form-row">
        <div class="form-group">
          <label>Client</label>
          <select name="client" [(ngModel)]="nouveau.clientId" required>
            <option value="">-- s&electionner --</option>
            <option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" [(ngModel)]="nouveau.date" />
        </div>
        <div class="form-group">
          <label>&E9;ch&e9;ance</label>
          <input type="date" name="echeance" [(ngModel)]="nouveau.echeance" />
        </div>
      </div>
      <div class="card">
        <div class="card-title">Lignes</div>
        <table class="lines-table">
          <thead><tr><th>D&e9;signation</th><th>Qte</th><th>Prix unit.</th><th>TVA %</th><th>Total</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let l of nouveau.lignes; let i = index">
              <td><input name="desc-{{i}}" [(ngModel)]="l.description" placeholder="D&e9;signation" /></td>
              <td><input type="number" name="qte-{{i}}" [(ngModel)]="l.quantite" (change)="recalcul(i)" /></td>
              <td><input type="number" name="pu-{{i}}" [(ngModel)]="l.prixUnitaire" (change)="recalcul(i)" /></td>
              <td><input type="number" name="tva-{{i}}" [(ngModel)]="l.tva" step="0.01" (change)="recalcul(i)" /></td>
              <td>{{ l.total | number }}</td>
              <td><button type="button" class="btn btn-danger btn-sm" (click)="supprimerLigne(i)">X</button></td>
            </tr>
            <tr><td colspan="6"><button type="button" class="btn btn-outline btn-sm" (click)="ajouterLigne()">+ Ajouter une ligne</button></td></tr>
          </tbody>
        </table>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-success" (click)="enregistrerFacture()" [disabled]="chargement">Enregistrer</button>
        <button type="button" class="btn btn-outline" (click)="annulerForm()">Annuler</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Liste des factures</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N&deg;</th><th>Client</th><th>Date</th><th>HT</th><th>TVA</th><th>TTC</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let f of factures">
              <td>{{ f.numero }}</td><td>{{ f.clientNom }}</td><td>{{ f.date | slice:0:10 }}</td>
              <td>{{ f.ht | number }}</td><td>{{ f.tva | number }}</td><td>{{ f.ttc | number }}</td>
              <td><span class="badge" [class]="'badge-' + (f.statut||'').toLowerCase()">{{ f.statut }}</span></td>
              <td>
                <button *ngIf="f.statut==='BROUILLON'" class="btn btn-outline btn-sm" (click)="envoyer(f)">Envoyer</button>
                <button *ngIf="f.statut==='ENVOYEE'" class="btn btn-success btn-sm" (click)="payer(f)">Marquer pay&eacute;</button>
                <button *ngIf="f.statut!=='ANNULEE' && auth.isSuperviseur()" class="btn btn-danger btn-sm" (click)="annuler(f)">Annuler</button>
                <a class="btn btn-outline btn-sm" [routerLink]="['/factures', f.id]">D&e9;tail</a>
              </td>
            </tr>
            <tr *ngIf="factures.length === 0"><td colspan="8" class="empty">Aucune facture.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class FacturesComponent implements OnInit {
  api = inject(ApiService);
  factures: Facture[] = [];
  clients: Client[] = [];
  erreur = "";
  message = "";
  formVisible = false;
  chargement = false;
  nouveau: any = { clientId: "", date: "", echeance: "", lignes: [] };
  auth = inject(AuthService);

  async ngOnInit() {
    this.charger();
    const c = await this.api.get<Client[]>("/clients");
    this.clients = c.data || [];
  }

  async charger() {
    const r = await this.api.get<Facture[]>("/factures");
    this.factures = r.data || [];
  }

  nouvelleFacture() {
    this.nouveau = { clientId: "", date: new Date().toISOString().slice(0, 10), echeance: "", lignes: [] };
    this.ajouterLigne();
    this.formVisible = true;
    this.erreur = "";
    this.message = "";
  }

  annulerForm() { this.formVisible = false; }

  ajouterLigne() {
    this.nouveau.lignes.push({ description: "", quantite: 1, prixUnitaire: 0, tva: 0.18, total: 0 });
  }

  supprimerLigne(i: number) { this.nouveau.lignes.splice(i, 1); }

  recalcul(i: number) {
    const l = this.nouveau.lignes[i];
    l.total = (l.quantite || 0) * (l.prixUnitaire || 0);
  }

  async enregistrerFacture() {
    this.erreur = "";
    this.chargement = true;
    const r = await this.api.post<Facture>("/factures", this.nouveau);
    this.chargement = false;
    if (r.ok) {
      this.message = "Facture enregistr&eacute;e.";
      this.formVisible = false;
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur.";
    }
  }

  async envoyer(f: Facture) {
    const r = await this.api.post(`/factures/${f.id}/envoyer`);
    if (r.ok) await this.charger();
  }

  async payer(f: Facture) {
    const mode = prompt("Mode de paiement (espèces, carte, virement...)", "espèces");
    if (mode === null) return;
    const r = await this.api.post(`/factures/${f.id}/payer`, { mode });
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }

  async annuler(f: Facture) {
    if (!confirm("Annuler cette facture ? (r\u00e9serv\u00e9 au superviseur)")) return;
    const r = await this.api.post(`/factures/${f.id}/annuler`);
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }
}
