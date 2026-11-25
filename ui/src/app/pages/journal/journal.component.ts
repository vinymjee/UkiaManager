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
      <div>
        <h1>Journal comptable</h1>
        <div class="subtitle">Toutes les écritures comptables de votre activité</div>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Nouvelle écriture manuelle</div>
      </div>

      <form (ngSubmit)="ajouter()" #form="ngForm" class="form-grid">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" name="date" [(ngModel)]="ecriture.date" required class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">Compte comptable</label>
          <input type="text" name="compte" [(ngModel)]="ecriture.compte" required class="form-input" placeholder="ex: 70 - Ventes de biens" />
        </div>

        <div class="form-group">
          <label class="form-label">Libellé</label>
          <input type="text" name="libelle" [(ngModel)]="ecriture.libelle" required class="form-input" placeholder="Libellé de l'écriture" />
        </div>

        <div class="form-group">
          <label class="form-label">Débit</label>
          <input type="number" name="debit" [(ngModel)]="ecriture.debit" step="0.01" class="form-input" placeholder="0.00" />
        </div>

        <div class="form-group">
          <label class="form-label">Crédit</label>
          <input type="number" name="credit" [(ngModel)]="ecriture.credit" step="0.01" class="form-input" placeholder="0.00" />
        </div>

        <div class="form-actions" style="margin-top: var(--space-5);">
          <button type="submit" class="btn btn-success" [disabled]="chargement || !form.valid">{{ chargement ? "Ajout..." : "Ajouter l'écriture" }}</button>
        </div>
      </form>
    </div>

    <div class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header">
        <div class="card-title">Écritures comptables</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th><th>Compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th><th>Type</th><th>Référence</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of ecritures">
              <td>{{ e.date | slice:0:10 }}</td>
              <td>{{ e.compte }}</td>
              <td>{{ e.libelle }}</td>
              <td>{{ e.debit | number:'1.0-2' }}</td>
              <td>{{ e.credit | number:'1.0-2' }}</td>
              <td>{{ e.refType }}</td>
              <td>{{ e.refId }}</td>
            </tr>
            <tr *ngIf="ecritures.length === 0"><td colspan="7" class="empty-state">Aucune écriture comptable pour le moment.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class JournalComponent implements OnInit {
  api = inject(ApiService);

  ecritures: EcritureComptable[] = [];
  ecriture: EcritureComptable = {
    id: "", date: new Date().toISOString().slice(0, 10), compte: "", libelle: "",
    debit: 0, credit: 0, refType: "MANUEL", refId: "",
  };
  erreur = "";
  message = "";
  chargement = false;

  async ngOnInit() { this.charger(); }

  async charger() {
    const r = await this.api.get<EcritureComptable[]>("/journal");
    this.ecritures = r.data || [];
  }

  async ajouter() {
    this.erreur = "";
    this.chargement = true;
    const r = await this.api.post<EcritureComptable>("/journal", this.ecriture);
    this.chargement = false;
    if (r.ok) {
      this.message = "Écriture ajoutée avec succès.";
      this.ecriture = {
        id: "", date: new Date().toISOString().slice(0, 10), compte: "", libelle: "",
        debit: 0, credit: 0, refType: "MANUEL", refId: "",
      };
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur.";
    }
  }
}
