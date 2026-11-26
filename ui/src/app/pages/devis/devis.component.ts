import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { PrintService } from "../../services/print.service";
import { QrService } from "../../services/qr.service";
import { Devis, Client } from "../../models";

@Component({
  selector: "app-devis",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Devis</h1>
        <div class="subtitle">Créez et suivez vos devis commerciaux</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="ouvrirFormulaire()">Nouveau devis</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <div *ngIf="formVisible" class="card card-body">
      <div class="card-header">
        <div class="card-title">Nouveau devis</div>
        <button class="btn btn-ghost btn-sm" (click)="fermerFormulaire()">Fermer</button>
      </div>

      <form (ngSubmit)="enregistrer()" #form="ngForm" class="form-grid">
        <input type="hidden" name="id" [ngModel]="devis.id" />
        <input type="hidden" name="agentId" [ngModel]="auth.utilisateur()?.id" />
        <input type="hidden" name="agentNom" [ngModel]="auth.utilisateur()?.nom" />

        <div class="form-group">
          <label class="form-label">Client</label>
          <select name="clientId" [(ngModel)]="devis.clientId" required class="form-select">
            <option value="">-- Sélectionner un client --</option>
            <option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Date du devis</label>
          <input type="date" name="date" [(ngModel)]="devis.date" required class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">Validité (jours)</label>
          <input type="number" name="validite" [(ngModel)]="devis.validite" class="form-input" placeholder="30" />
        </div>

        <div class="form-group full">
          <label class="form-label">Lignes de devis</label>
          <table class="data-table" style="margin-top: var(--space-2);">
            <thead>
              <tr>
                <th>Désignation</th><th>Quantité</th><th>Prix unitaire</th><th>TVA %</th><th>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of devis.lignes; let i = index">
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
          <button type="submit" class="btn btn-success" [disabled]="chargement || !form.valid">{{ chargement ? "Enregistrement..." : "Enregistrer le devis" }}</button>
          <button type="button" class="btn btn-outline" (click)="fermerFormulaire()">Annuler</button>
        </div>
      </form>
    </div>

    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Liste des devis</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Numéro</th><th>Client</th><th>Date</th><th>HT</th><th>TVA</th><th>TTC</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of devis">
              <td>{{ d.numero }}</td>
              <td>{{ d.clientNom }}</td>
              <td>{{ d.date | slice:0:10 }}</td>
              <td>{{ d.ht | number:'1.0-2' }}</td>
              <td>{{ d.tva | number:'1.0-2' }}</td>
              <td>{{ d.ttc | number:'1.0-2' }}</td>
              <td><span class="badge" [class]="'badge-' + statutClass(d.statut)">{{ d.statut }}</span></td>
              <td class="table-actions">
                <button *ngIf="d.statut === 'BROUILLON'" class="btn btn-outline btn-sm" (click)="changerStatut(d, 'ENVOYEE')">Envoyer</button>
                <button *ngIf="d.statut === 'ENVOYEE'" class="btn btn-success btn-sm" (click)="changerStatut(d, 'ACCEPTE')">Accepter</button>
                <button *ngIf="d.statut === 'ENVOYEE'" class="btn btn-outline btn-sm" (click)="changerStatut(d, 'REFUSE')">Refuser</button>
                <button class="btn btn-outline btn-sm" (click)="imprimer(d)">Imprimer</button>
                <button *ngIf="d.statut !== 'ANNULEE'" class="btn btn-danger btn-sm" (click)="changerStatut(d, 'ANNULEE')">Annuler</button>
              </td>
            </tr>
            <tr *ngIf="devis.length === 0"><td colspan="8" class="empty-state">Aucun devis enregistré.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DevisComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  print = inject(PrintService);
  qr = inject(QrService);

  devis: Devis[] = [];
  clients: Client[] = [];
  erreur = "";
  message = "";
  formVisible = false;
  chargement = false;
  devisEdit: Devis = this.newDevis();
  totaux = { ht: 0, tva: 0, ttc: 0 };

  newDevis(): Devis {
    return {
      id: "", numero: "", clientId: "", clientNom: "", date: new Date().toISOString().slice(0, 10),
      validite: "", lignes: [], ht: 0, tva: 0, ttc: 0, statut: "BROUILLON",
      agentId: "", agentNom: "",
    };
  }

  async ngOnInit() {
    this.charger();
    const c = await this.api.get<Client[]>("/clients");
    this.clients = c.data || [];
  }

  async charger() {
    const r = await this.api.get<Devis[]>("/devis");
    this.devis = r.data || [];
  }

  ouvrirFormulaire() {
    this.devisEdit = this.newDevis();
    this.ajouterLigne();
    this.formVisible = true;
    this.erreur = "";
    this.message = "";
  }

  fermerFormulaire() { this.formVisible = false; }

  ajouterLigne() {
    this.devisEdit.lignes.push({ description: "", quantite: 1, prixUnitaire: 0, tva: 0, total: 0 });
    this.calculerTotaux();
  }

  supprimerLigne(i: number) {
    this.devisEdit.lignes.splice(i, 1);
    this.calculerTotaux();
  }

  recalculLigne(i: number) {
    const l = this.devisEdit.lignes[i];
    l.total = (l.quantite || 0) * (l.prixUnitaire || 0);
    this.calculerTotaux();
  }

  calculerTotaux() {
    this.totaux.ht = this.devisEdit.lignes.reduce((s, l) => s + (l.total || 0), 0);
    this.totaux.tva = this.devisEdit.lignes.reduce((s, l) => s + (l.total || 0) * (l.tva || 0), 0);
    this.totaux.ttc = this.totaux.ht + this.totaux.tva;
    this.devisEdit.ht = this.totaux.ht;
    this.devisEdit.tva = this.totaux.tva;
    this.devisEdit.ttc = this.totaux.ttc;
  }

  async enregistrer() {
    this.erreur = "";
    this.chargement = true;
    this.calculerTotaux();
    const r = await this.api.post<Devis>("/devis", this.devisEdit);
    this.chargement = false;
    if (r.ok) {
      this.message = "Devis enregistré avec succès.";
      this.formVisible = false;
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur lors de l'enregistrement.";
    }
  }

  async changerStatut(d: Devis, statut: string) {
    const action = statut === 'ACCEPTE' ? 'accepter' : statut === 'REFUSE' ? 'refuser' : 'annuler';
    const r = await this.api.post(`/devis/${d.id}/${action}`);
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }

  imprimer(d: Devis) {
    this.print.printDocument({
      titre: "Devis",
      numero: d.numero,
      date: d.date,
      clientNom: d.clientNom,
      qrUrl: this.qr.docUrl("devis", d.id),
      total: d.ttc,
      lignes: d.lignes,
      details: [
        { label: "HT", value: d.ht.toFixed(2) },
        { label: "TVA", value: d.tva.toFixed(2) },
        { label: "TTC", value: d.ttc.toFixed(2) },
        { label: "Validité", value: d.validite || "-" },
        { label: "Statut", value: d.statut },
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
