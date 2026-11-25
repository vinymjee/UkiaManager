import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { EcritureComptable } from "../../models";

@Component({
  selector: "app-journal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <h1>Journal comptable</h1>
    </div>
    <div class="card">
      <div class="card-title">Nouvelle &eacute;criture manuelle</div>
      <div class="form-row">
        <div class="form-group"><label>Date</label><input type="date" [(ngModel)]="ecriture.date" /></div>
        <div class="form-group"><label>Compte</label><input [(ngModel)]="ecriture.compte" placeholder="ex: 70 - Ventes" /></div>
        <div class="form-group"><label>Libell&eacute;</label><input [(ngModel)]="ecriture.libelle" /></div>
        <div class="form-group"><label>D&e9;bit</label><input type="number" [(ngModel)]="ecriture.debit" /></div>
        <div class="form-group"><label>Cr&eacute;dit</label><input type="number" [(ngModel)]="ecriture.credit" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-success" (click)="ajouter()" [disabled]="chargement">Ajouter l'&eacute;criture</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message">{{ message }}</div>

    <div class="card">
      <div class="card-title">Écritures comptables</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th><th>Type</th><th>Ref</th></tr></thead>
          <tbody>
            <tr *ngFor="let e of ecritures">
              <td>{{ e.date | slice:0:10 }}</td><td>{{ e.compte }}</td><td>{{ e.libelle }}</td>
              <td>{{ e.debit | number }}</td><td>{{ e.credit | number }}</td><td>{{ e.refType }}</td><td>{{ e.refId }}</td>
            </tr>
            <tr *ngIf="ecritures.length === 0"><td colspan="7" class="empty">Aucune écriture.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class JournalComponent implements OnInit {
  api = inject(ApiService);
  ecritures: EcritureComptable[] = [];
  ecriture: EcritureComptable = { id: "", date: new Date().toISOString().slice(0,10), compte: "", libelle: "", debit: 0, credit: 0, refType: "MANUEL", refId: "" };
  erreur = ""; message = ""; chargement = false;

  async ngOnInit() { this.charger(); }
  async charger() { const r = await this.api.get<EcritureComptable[]>("/journal"); this.ecritures = r.data || []; }
  async ajouter() {
    this.erreur = ""; this.chargement = true;
    const r = await this.api.post<EcritureComptable>("/journal", this.ecriture);
    this.chargement = false;
    if (r.ok) { this.message = "Écriture ajoutée."; this.ecriture = { id: "", date: new Date().toISOString().slice(0,10), compte: "", libelle: "", debit: 0, credit: 0, refType: "MANUEL", refId: "" }; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }
}
