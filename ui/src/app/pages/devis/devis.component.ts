import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { Devis, Client, Ligne } from "../../models";

@Component({
  selector: "app-devis",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <h1>Devis</h1>
      <button class="btn btn-primary" (click)="nouveauDevis()">Nouveau devis</button>
    </div>
    <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message">{{ message }}</div>

    <div class="card" *ngIf="formVisible">
      <div class="card-title">Nouveau devis</div>
      <div class="form-row">
        <div class="form-group"><label>Client</label><select [(ngModel)]="nouveau.clientId" required><option value="">--</option><option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option></select></div>
        <div class="form-group"><label>Date</label><input type="date" [(ngModel)]="nouveau.date" /></div>
        <div class="form-group"><label>Validit&eacute;</label><input type="date" [(ngModel)]="nouveau.validite" /></div>
      </div>
      <div class="card">
        <div class="card-title">Lignes</div>
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
      <div class="card-title">Liste des devis</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N&deg;</th><th>Client</th><th>Date</th><th>HT</th><th>TTC</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let d of devis">
              <td>{{ d.numero }}</td><td>{{ d.clientNom }}</td><td>{{ d.date | slice:0:10 }}</td>
              <td>{{ d.ht | number }}</td><td>{{ d.ttc | number }}</td>
              <td><span class="badge" [class]="'badge-' + (d.statut||'').toLowerCase()">{{ d.statut }}</span></td>
              <td>
                <button *ngIf="d.statut==='BROUILLON'" class="btn btn-outline btn-sm" (click)="changerStatut(d,'ENVOYEE')">Envoyer</button>
                <button *ngIf="d.statut==='ENVOYEE'" class="btn btn-success btn-sm" (click)="changerStatut(d,'ACCEPTE')">Accepter</button>
                <button *ngIf="d.statut==='ENVOYEE'" class="btn btn-outline btn-sm" (click)="changerStatut(d,'REFUSE')">Refuser</button>
                <button *ngIf="d.statut!=='ANNULEE'" class="btn btn-danger btn-sm" (click)="changerStatut(d,'ANNULEE')">Annuler</button>
              </td>
            </tr>
            <tr *ngIf="devis.length === 0"><td colspan="7" class="empty">Aucun devis.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DevisComponent implements OnInit {
  api = inject(ApiService);
  devis: Devis[] = [];
  clients: Client[] = [];
  erreur = ""; message = ""; formVisible = false; chargement = false;
  nouveau: any = { clientId: "", date: "", validite: "", lignes: [] };

  async ngOnInit() {
    this.charger();
    const c = await this.api.get<Client[]>("/clients");
    this.clients = c.data || [];
  }
  async charger() { const r = await this.api.get<Devis[]>("/devis"); this.devis = r.data || []; }
  nouveauDevis() { this.nouveau = { clientId: "", date: new Date().toISOString().slice(0,10), validite: "", lignes: [] }; this.ajouterLigne(); this.formVisible = true; this.erreur = ""; this.message = ""; }
  annulerForm() { this.formVisible = false; }
  ajouterLigne() { this.nouveau.lignes.push({ description: "", quantite: 1, prixUnitaire: 0, tva: 0.18, total: 0 }); }
  supprimerLigne(i: number) { this.nouveau.lignes.splice(i, 1); }
  recalcul(i: number) { const l = this.nouveau.lignes[i]; l.total = (l.quantite||0)*(l.prixUnitaire||0); }
  async enregistrer() {
    this.erreur = ""; this.chargement = true;
    const r = await this.api.post<Devis>("/devis", this.nouveau);
    this.chargement = false;
    if (r.ok) { this.message = "Devis enregistr&eacute;."; this.formVisible = false; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }
  async changerStatut(d: Devis, statut: string) {
    const r = await this.api.post(`/devis/${d.id}/${statut === 'ACCEPTE' ? 'accepter' : statut === 'REFUSE' ? 'refuser' : 'annuler'}`);
    if (r.ok) await this.charger(); else this.erreur = r.erreur || "Erreur.";
  }
}
