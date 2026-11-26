import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { PrintService } from "../../services/print.service";
import { Facture, Client } from "../../models";

@Component({
  selector: "app-factures",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Factures</h1>
        <div class="subtitle">Gestion de vos factures clients</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="ouvrirFormulaire()">Nouvelle facture</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <!-- Formulaire -->
    <div *ngIf="formVisible" class="card card-body">
      <div class="card-header">
        <div class="card-title">{{ mode === 'create' ? 'Nouvelle facture' : 'Modifier la facture' }}</div>
        <button class="btn btn-ghost btn-sm" (click)="fermerFormulaire()">Fermer</button>
      </div>

      <form (ngSubmit)="enregistrer()" #form="ngForm" class="form-grid">
        <input type="hidden" name="id" [ngModel]="facture.id" />
        <input type="hidden" name="agentId" [ngModel]="auth.utilisateur()?.id" />
        <input type="hidden" name="agentNom" [ngModel]="auth.utilisateur()?.nom" />

        <div class="form-group">
          <label class="form-label">Client</label>
          <select name="clientId" [(ngModel)]="facture.clientId" required class="form-select">
            <option value="">-- Sélectionner un client --</option>
            <option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Date de la facture</label>
          <input type="date" name="date" [(ngModel)]="facture.date" required class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">Date d'échéance</label>
          <input type="date" name="echeance" [(ngModel)]="facture.echeance" class="form-input" />
        </div>

        <div class="form-group full">
          <label class="form-label">Lignes de facture</label>
          <table class="data-table" style="margin-top: var(--space-2);">
            <thead>
              <tr>
                <th>Désignation</th><th>Quantité</th><th>Prix unitaire</th><th>TVA %</th><th>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of facture.lignes; let i = index">
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
          <button type="submit" class="btn btn-success" [disabled]="chargement || !form.valid">{{ chargement ? "Enregistrement..." : "Enregistrer la facture" }}</button>
          <button type="button" class="btn btn-outline" (click)="fermerFormulaire()">Annuler</button>
        </div>
      </form>
    </div>

    <!-- Liste -->
    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Liste des factures</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Numéro</th><th>Client</th><th>Date</th><th>HT</th><th>TVA</th><th>TTC</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let f of factures">
              <td>{{ f.numero }}</td>
              <td>{{ f.clientNom }}</td>
              <td>{{ f.date | slice:0:10 }}</td>
              <td>{{ f.ht | number:'1.0-2' }}</td>
              <td>{{ f.tva | number:'1.0-2' }}</td>
              <td>{{ f.ttc | number:'1.0-2' }}</td>
              <td><span class="badge" [class]="'badge-' + statutClass(f.statut)">{{ f.statut }}</span></td>
              <td class="table-actions">
                <button *ngIf="f.statut === 'BROUILLON'" class="btn btn-outline btn-sm" (click)="envoyer(f)">Envoyer</button>
                <button *ngIf="f.statut === 'ENVOYEE'" class="btn btn-success btn-sm" (click)="payer(f)">Marquer payée</button>
                <button *ngIf="f.statut !== 'ANNULEE' && auth.isSuperviseur()" class="btn btn-danger btn-sm" (click)="annuler(f)">Annuler</button>
                <button class="btn btn-outline btn-sm" (click)="imprimer(f)">Imprimer</button>
                <button class="btn btn-ghost btn-sm" (click)="ouvrirFormulaire(f)">Voir</button>
              </td>
            </tr>
            <tr *ngIf="factures.length === 0"><td colspan="8" class="empty-state">Aucune facture enregistrée.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class FacturesComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  print = inject(PrintService);

  factures: Facture[] = [];
  clients: Client[] = [];
  erreur = "";
  message = "";
  formVisible = false;
  chargement = false;
  mode = "create";
  facture: Facture = this.newFacture();
  totaux = { ht: 0, tva: 0, ttc: 0 };

  newFacture(): Facture {
    return {
      id: "", numero: "", clientId: "", clientNom: "", date: new Date().toISOString().slice(0, 10),
      lignes: [], ht: 0, tva: 0, ttc: 0, statut: "BROUILLON",
      agentId: "", agentNom: "",
    };
  }

  async ngOnInit() {
    this.charger();
    const c = await this.api.get<Client[]>("/clients");
    this.clients = c.data || [];
  }

  async charger() {
    const r = await this.api.get<Facture[]>("/factures");
    this.factures = r.data || [];
  }

  ouvrirFormulaire(f?: Facture) {
    if (f) {
      this.mode = "edit";
      this.facture = { ...f };
    } else {
      this.mode = "create";
      this.facture = this.newFacture();
      this.ajouterLigne();
    }
    this.formVisible = true;
    this.erreur = "";
    this.message = "";
  }

  fermerFormulaire() {
    this.formVisible = false;
  }

  ajouterLigne() {
    this.facture.lignes.push({ description: "", quantite: 1, prixUnitaire: 0, tva: 0, total: 0 });
    this.calculerTotaux();
  }

  supprimerLigne(i: number) {
    this.facture.lignes.splice(i, 1);
    this.calculerTotaux();
  }

  recalculLigne(i: number) {
    const l = this.facture.lignes[i];
    l.total = (l.quantite || 0) * (l.prixUnitaire || 0);
    this.calculerTotaux();
  }

  calculerTotaux() {
    this.totaux.ht = this.facture.lignes.reduce((s, l) => s + (l.total || 0), 0);
    this.totaux.tva = this.facture.lignes.reduce((s, l) => s + (l.total || 0) * (l.tva || 0), 0);
    this.totaux.ttc = this.totaux.ht + this.totaux.tva;
    this.facture.ht = this.totaux.ht;
    this.facture.tva = this.totaux.tva;
    this.facture.ttc = this.totaux.ttc;
  }

  async enregistrer() {
    this.erreur = "";
    this.chargement = true;
    this.calculerTotaux();
    const r = await this.api.post<Facture>("/factures", this.facture);
    this.chargement = false;
    if (r.ok) {
      this.message = "Facture enregistrée avec succès.";
      this.formVisible = false;
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur lors de l'enregistrement.";
    }
  }

  async envoyer(f: Facture) {
    const r = await this.api.post(`/factures/${f.id}/envoyer`);
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }

  async payer(f: Facture) {
    const mode = prompt("Mode de paiement (espèces, carte, virement...)", "espèces");
    if (mode === null) return;
    const r = await this.api.post(`/factures/${f.id}/payer`, { mode });
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }

  async annuler(f: Facture) {
    if (!confirm("Annuler cette facture ? Cette action est irréversible.")) return;
    const r = await this.api.post(`/factures/${f.id}/annuler`);
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }

  imprimer(f: Facture) {
    this.print.printDocument({
      titre: "Facture",
      numero: f.numero,
      date: f.date,
      clientNom: f.clientNom,
      total: f.ttc,
      lignes: f.lignes,
      details: [
        { label: "HT", value: f.ht.toFixed(2) },
        { label: "TVA", value: f.tva.toFixed(2) },
        { label: "TTC", value: f.ttc.toFixed(2) },
        { label: "Statut", value: f.statut },
      ],
    });
  }

  statutClass(s: string) {
    const map: Record<string, string> = {
      BROUILLON: "secondary", ENVOYEE: "info", PAYEE: "success",
      ACCEPTE: "success", ANNULEE: "error", REFUSE: "error",
    };
    return map[s] || "secondary";
  }
}
