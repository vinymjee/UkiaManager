import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { RecuPaiement, Client, Facture } from "../../models";

@Component({
  selector: "app-recus",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>R&eacute;cus de paiement</h1>
        <div class="subtitle">Émettez des reçus pour les paiements reçus</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="ouvrirFormulaire()">Nouveau re&ccedil;u</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <div *ngIf="formVisible" class="card card-body">
      <div class="card-header">
        <div class="card-title">Nouveau re&ccedil;u de paiement</div>
        <button class="btn btn-ghost btn-sm" (click)="fermerFormulaire()">Fermer</button>
      </div>

      <form (ngSubmit)="enregistrer()" #form="ngForm" class="form-grid">
        <input type="hidden" name="id" [ngModel]="recu.id" />
        <input type="hidden" name="agentId" [ngModel]="auth.utilisateur()?.id" />

        <div class="form-group">
          <label class="form-label">Client</label>
          <select name="clientId" [(ngModel)]="recu.clientId" required class="form-select">
            <option value="">-- Sélectionner un client --</option>
            <option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Facture concern&eacute;e (optionnel)</label>
          <select name="factureId" [(ngModel)]="recu.factureId" class="form-select">
            <option value="">-- Aucune facture --</option>
            <option *ngFor="let f of factures" [value]="f.id">{{ f.numero }} - {{ f.clientNom }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Montant</label>
          <div class="input-group">
            <span class="input-group-icon">&#8364;</span>
            <input type="number" name="montant" [(ngModel)]="recu.montant" required step="0.01" class="form-input" placeholder="0.00" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Mode de paiement</label>
          <select name="mode" [(ngModel)]="recu.mode" required class="form-select">
            <option value="espèces">Espèces</option>
            <option value="carte">Carte bancaire</option>
            <option value="virement">Virement</option>
            <option value="chèque">Chèque</option>
            <option value="mobile money">Mobile Money</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" name="date" [(ngModel)]="recu.date" required class="form-input" />
        </div>

        <div class="form-actions" style="margin-top: var(--space-5);">
          <button type="submit" class="btn btn-success" [disabled]="chargement || !form.valid">{{ chargement ? "Enregistrement..." : "Enregistrer le re&ccedil;u" }}</button>
          <button type="button" class="btn btn-outline" (click)="fermerFormulaire()">Annuler</button>
        </div>
      </form>
    </div>

    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Liste des re&ccedil;us de paiement</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Numéro</th><th>Client</th><th>Facture</th><th>Montant</th><th>Mode</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of recus">
              <td>{{ r.numero }}</td>
              <td>{{ r.clientNom }}</td>
              <td>{{ r.factureId || "-" }}</td>
              <td>{{ r.montant | number:'1.0-2' }}</td>
              <td>{{ r.mode }}</td>
              <td>{{ r.date | slice:0:10 }}</td>
            </tr>
            <tr *ngIf="recus.length === 0"><td colspan="6" class="empty-state">Aucun re&ccedil;u enregistr&eacute;.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class RecusComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  recus: RecuPaiement[] = [];
  clients: Client[] = [];
  factures: Facture[] = [];
  erreur = "";
  message = "";
  formVisible = false;
  chargement = false;
  recu: RecuPaiement = this.newRecu();

  newRecu(): RecuPaiement {
    return {
      id: "", numero: "", factureId: "", clientId: "", clientNom: "",
      montant: 0, date: new Date().toISOString().slice(0, 10), mode: "espèces", agentId: "",
    };
  }

  async ngOnInit() {
    this.charger();
    const [c, f] = await Promise.all([
      this.api.get<Client[]>("/clients"),
      this.api.get<Facture[]>("/factures"),
    ]);
    this.clients = c.data || [];
    this.factures = f.data || [];
  }

  async charger() {
    const r = await this.api.get<RecuPaiement[]>("/recus");
    this.recus = r.data || [];
  }

  ouvrirFormulaire() {
    this.recu = this.newRecu();
    this.formVisible = true;
    this.erreur = "";
    this.message = "";
  }

  fermerFormulaire() { this.formVisible = false; }

  async enregistrer() {
    this.erreur = "";
    this.chargement = true;
    const r = await this.api.post<RecuPaiement>("/recus", this.recu);
    this.chargement = false;
    if (r.ok) {
      this.message = "Re&ccedil;u enregistr&eacute; avec succ&egrave;s.";
      this.formVisible = false;
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur lors de l'enregistrement.";
    }
  }
}
