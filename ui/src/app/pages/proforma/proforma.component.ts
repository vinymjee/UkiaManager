import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { FactureProForma, Client, Ligne } from "../../models";

@Component({
  selector: "app-proforma",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <h1>Factures Pro forma</h1>
      <button class="btn btn-primary" (click)="nouvelle()">Nouvelle pro forma</button>
    </div>
    <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message">{{ message }}</div>

    <div class="card" *ngIf="formVisible">
      <div class="card-title">Nouvelle facture pro forma</div>
      <div class="form-row">
        <div class="form-group"><label>Client</label><select [(ngModel)]="nouveau.clientId" required><option value="">--</option><option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option></select></div>
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
      <div class="card-title">Liste des pro forma</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N&deg;</th><th>Client</th><th>Date</th><th>HT</th><th>TVA</th><th>TTC</th></tr></thead>
          <tbody>
            <tr *ngFor="let p of proformas">
              <td>{{ p.numero }}</td><td>{{ p.clientNom }}</td><td>{{ p.date | slice:0:10 }}</td>
              <td>{{ p.ht | number }}</td><td>{{ p.tva | number }}</td><td>{{ p.ttc | number }}</td>
            </tr>
            <tr *ngIf="proformas.length === 0"><td colspan="6" class="empty">Aucune pro forma.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ProformaComponent implements OnInit {
  api = inject(ApiService);
  proformas: FactureProForma[] = [];
  clients: Client[] = [];
  erreur = ""; message = ""; formVisible = false; chargement = false;
  nouveau: any = { clientId: "", date: "", lignes: [] };

  async ngOnInit() {
    this.charger();
    const c = await this.api.get<Client[]>("/clients");
    this.clients = c.data || [];
  }
  async charger() { const r = await this.api.get<FactureProForma[]>("/factures-proforma"); this.proformas = r.data || []; }
  nouvelle() { this.nouveau = { clientId: "", date: new Date().toISOString().slice(0,10), lignes: [] }; this.ajouterLigne(); this.formVisible = true; this.erreur = ""; this.message = ""; }
  annulerForm() { this.formVisible = false; }
  ajouterLigne() { this.nouveau.lignes.push({ description: "", quantite: 1, prixUnitaire: 0, tva: 0.18, total: 0 }); }
  supprimerLigne(i: number) { this.nouveau.lignes.splice(i, 1); }
  recalcul(i: number) { const l = this.nouveau.lignes[i]; l.total = (l.quantite||0)*(l.prixUnitaire||0); }
  async enregistrer() {
    this.erreur = ""; this.chargement = true;
    const r = await this.api.post<FactureProForma>("/factures-proforma", this.nouveau);
    this.chargement = false;
    if (r.ok) { this.message = "Pro forma enregistr&eacute;e."; this.formVisible = false; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }
}
