import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { RecuPaiement, Client, Facture } from "../../models";

@Component({
  selector: "app-recus",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <h1>R&eacute;cus de paiement</h1>
      <button class="btn btn-primary" (click)="nouveauRecu()">Nouveau re&ccedil;u</button>
    </div>
    <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message">{{ message }}</div>

    <div class="card" *ngIf="formVisible">
      <div class="card-title">Nouveau re&ccedil;u de paiement</div>
      <div class="form-row">
        <div class="form-group"><label>Client</label><select [(ngModel)]="nouveau.clientId" required><option value="">--</option><option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option></select></div>
        <div class="form-group"><label>Facture (optionnel)</label><select [(ngModel)]="nouveau.factureId"><option value="">--</option><option *ngFor="let f of factures" [value]="f.id">{{ f.numero }} - {{ f.clientNom }}</option></select></div>
        <div class="form-group"><label>Montant</label><input type="number" [(ngModel)]="nouveau.montant" required /></div>
        <div class="form-group"><label>Mode</label><select [(ngModel)]="nouveau.mode"><option>esp&egrave;ces</option><option>carte</option><option>virement</option><option>ch&egrave;que</option></select></div>
        <div class="form-group"><label>Date</label><input type="date" [(ngModel)]="nouveau.date" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-success" (click)="enregistrer()" [disabled]="chargement">Enregistrer</button>
        <button class="btn btn-outline" (click)="annulerForm()">Annuler</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Liste des re&ccedil;us</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N&deg;</th><th>Client</th><th>Facture</th><th>Montant</th><th>Mode</th><th>Date</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of recus">
              <td>{{ r.numero }}</td><td>{{ r.clientNom }}</td><td>{{ r.factureId || "-" }}</td>
              <td>{{ r.montant | number }}</td><td>{{ r.mode }}</td><td>{{ r.date | slice:0:10 }}</td>
            </tr>
            <tr *ngIf="recus.length === 0"><td colspan="6" class="empty">Aucun re&ccedil;u.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class RecusComponent implements OnInit {
  api = inject(ApiService);
  recus: RecuPaiement[] = [];
  clients: Client[] = [];
  factures: Facture[] = [];
  erreur = ""; message = ""; formVisible = false; chargement = false;
  nouveau: any = { clientId: "", factureId: "", montant: 0, mode: "espèces", date: new Date().toISOString().slice(0,10) };

  async ngOnInit() {
    this.charger();
    const [c, f] = await Promise.all([this.api.get<Client[]>("/clients"), this.api.get<Facture[]>("/factures")]);
    this.clients = c.data || [];
    this.factures = f.data || [];
  }
  async charger() { const r = await this.api.get<RecuPaiement[]>("/recus"); this.recus = r.data || []; }
  nouveauRecu() { this.nouveau = { clientId: "", factureId: "", montant: 0, mode: "espèces", date: new Date().toISOString().slice(0,10) }; this.formVisible = true; this.erreur = ""; this.message = ""; }
  annulerForm() { this.formVisible = false; }
  async enregistrer() {
    this.erreur = ""; this.chargement = true;
    const r = await this.api.post<RecuPaiement>("/recus", this.nouveau);
    this.chargement = false;
    if (r.ok) { this.message = "Re&ccedil;u enregistr&eacute;."; this.formVisible = false; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }
}
