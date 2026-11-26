import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { PrintService } from "../../services/print.service";
import { Caisse, OperationCaisse, TransfertCaisse, Utilisateur } from "../../models";

@Component({
  selector: "app-caisse",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Caisse</h1>
        <div class="subtitle">Gestion de votre caisse et transferts entre utilisateurs</div>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <!-- Solde -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{{ caisse?.solde | number:'1.0-2' }}</div>
        <div class="stat-label">Solde actuel</div>
      </div>
      <div class="stat-card" *ngIf="auth.isSuperviseur()">
        <div class="stat-value">{{ totalSysteme | number:'1.0-2' }}</div>
        <div class="stat-label">Total système (toutes caisses)</div>
      </div>
    </div>

    <!-- Soldes de toutes les caisses (superviseur) -->
    <div *ngIf="auth.isSuperviseur() && soldes.length" class="card card-body" style="margin-top: var(--space-4);">
      <div class="card-header"><div class="card-title">Soldes par utilisateur</div></div>
      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead><tr><th>Utilisateur</th><th>Solde</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of soldes">
              <td>{{ s.nom }}</td>
              <td>{{ s.solde | number:'1.0-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nouvelle operation -->
    <div *ngIf="auth.hasDroit('CAISSE_ENCAISSEMENT') || auth.hasDroit('CAISSE_DECAISSEMENT')" class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header"><div class="card-title">Nouvelle opération de caisse</div></div>
      <form (ngSubmit)="enregistrerOperation()" #f="ngForm" class="form-grid" style="margin-top: var(--space-3);">
        <div class="form-group">
          <label class="form-label">Type</label>
          <select name="type" [(ngModel)]="op.type" required class="form-select">
            <option *ngIf="auth.hasDroit('CAISSE_ENCAISSEMENT')" value="ENCAISSEMENT">Encaissement</option>
            <option *ngIf="auth.hasDroit('CAISSE_DECAISSEMENT')" value="DECAISSEMENT">Dépense (décaissement)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Montant</label>
          <input type="number" name="montant" [(ngModel)]="op.montant" required step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <div class="form-group full">
          <label class="form-label">Libellé</label>
          <input type="text" name="libelle" [(ngModel)]="op.libelle" required class="form-input" placeholder="Motif de l'opération" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success" [disabled]="chargement">Enregistrer</button>
        </div>
      </form>
    </div>

    <!-- Transfert -->
    <div *ngIf="auth.hasDroit('TRANSFERTS_CREER')" class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header"><div class="card-title">Transfert vers un autre utilisateur</div></div>
      <form (ngSubmit)="envoyerTransfert()" #ft="ngForm" class="form-grid" style="margin-top: var(--space-3);">
        <div class="form-group">
          <label class="form-label">Destinataire</label>
          <select name="destinataireId" [(ngModel)]="tr.destinataireId" required class="form-select">
            <option value="">-- Sélectionner --</option>
            <option *ngFor="let u of utilisateurs" [value]="u.id" [disabled]="u.id === auth.utilisateur()?.id">{{ u.nom }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Montant</label>
          <input type="number" name="montant" [(ngModel)]="tr.montant" required step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <div class="form-group full">
          <label class="form-label">Motif</label>
          <input type="text" name="motif" [(ngModel)]="tr.motif" class="form-input" placeholder="Motif du transfert" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="chargement">Envoyer le transfert</button>
        </div>
      </form>
      <p style="font-size: var(--text-xs); color: rgb(var(--color-text-muted)); margin-top: var(--space-2);">Le transfert ne devient effectif qu'après confirmation du destinataire.</p>
    </div>

    <!-- Transferts en attente de confirmation (destinataire) -->
    <div *ngIf="transfertsEnAttente.length" class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header"><div class="card-title">Transferts en attente de votre confirmation</div></div>
      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead><tr><th>N°</th><th>Expéditeur</th><th>Montant</th><th>Motif</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let t of transfertsEnAttente">
              <td>{{ t.numero }}</td>
              <td>{{ t.expediteurNom }}</td>
              <td>{{ t.montant | number:'1.0-2' }}</td>
              <td>{{ t.motif || "-" }}</td>
              <td>{{ t.creeLe | slice:0:10 }}</td>
              <td class="table-actions">
                <button class="btn btn-success btn-sm" (click)="confirmerTransfert(t)">Confirmer réception</button>
                <button class="btn btn-danger btn-sm" (click)="rejeterTransfert(t)">Rejeter</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Historique des operations -->
    <div class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header">
        <div class="card-title">Historique des opérations de caisse</div>
        <button class="btn btn-outline btn-sm" (click)="imprimerHistorique()">Imprimer</button>
      </div>
      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead><tr><th>Date</th><th>N°</th><th>Type</th><th>Libellé</th><th>Montant</th><th>Source</th></tr></thead>
          <tbody>
            <tr *ngFor="let o of operations">
              <td>{{ o.date | slice:0:10 }}</td>
              <td>{{ o.numero }}</td>
              <td><span class="badge" [class]="'badge-' + (o.type === 'ENCAISSEMENT' || o.type === 'TRANSFERT_ENTRANT' ? 'success' : 'error')">{{ o.type }}</span></td>
              <td>{{ o.libelle }}</td>
              <td>{{ o.montant | number:'1.0-2' }}</td>
              <td>{{ o.source }}</td>
            </tr>
            <tr *ngIf="operations.length === 0"><td colspan="6" class="empty-state">Aucune opération.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Historique des transferts -->
    <div class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header"><div class="card-title">Historique des transferts</div></div>
      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead><tr><th>N°</th><th>Expéditeur</th><th>Destinataire</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody>
            <tr *ngFor="let t of transferts">
              <td>{{ t.numero }}</td>
              <td>{{ t.expediteurNom }}</td>
              <td>{{ t.destinataireNom }}</td>
              <td>{{ t.montant | number:'1.0-2' }}</td>
              <td><span class="badge" [class]="'badge-' + (t.statut === 'CONFIRME' ? 'success' : t.statut === 'REJETE' || t.statut === 'ANNULE' ? 'error' : 'warning')">{{ t.statut }}</span></td>
              <td>{{ t.creeLe | slice:0:10 }}</td>
            </tr>
            <tr *ngIf="transferts.length === 0"><td colspan="6" class="empty-state">Aucun transfert.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class CaisseComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  print = inject(PrintService);

  caisse: Caisse | null = null;
  soldes: any[] = [];
  utilisateurs: Utilisateur[] = [];
  operations: OperationCaisse[] = [];
  transferts: TransfertCaisse[] = [];
  transfertsEnAttente: TransfertCaisse[] = [];
  erreur = "";
  message = "";
  chargement = false;
  totalSysteme = 0;

  op: { type: string; montant: number; libelle: string } = { type: "ENCAISSEMENT", montant: 0, libelle: "" };
  tr: { destinataireId: string; montant: number; motif: string } = { destinataireId: "", montant: 0, motif: "" };

  async ngOnInit() {
    await this.charger();
  }

  async charger() {
    this.erreur = "";
    const c = await this.api.get<Caisse>("/caisses");
    if (c.ok) this.caisse = c.data || null;
    const u = await this.api.get<Utilisateur[]>("/utilisateurs");
    if (u.ok) this.utilisateurs = u.data || [];
    const o = await this.api.get<OperationCaisse[]>("/operations-caisse");
    if (o.ok) this.operations = o.data || [];
    const t = await this.api.get<TransfertCaisse[]>("/transferts-caisse");
    if (t.ok) {
      this.transferts = t.data || [];
      const me = this.auth.utilisateur()?.id;
      this.transfertsEnAttente = this.transferts.filter((x) => x.destinataireId === me && x.statut === "EN_ATTENTE");
    }
    if (this.auth.isSuperviseur()) {
      const s = await this.api.get<any[]>("/caisses/tous");
      if (s.ok) {
        this.soldes = s.data || [];
        this.totalSysteme = this.soldes.reduce((acc, x) => acc + (x.solde || 0), 0);
      }
    }
  }

  async enregistrerOperation() {
    this.erreur = "";
    this.chargement = true;
    const r = await this.api.post<OperationCaisse>("/operations-caisse", this.op);
    this.chargement = false;
    if (r.ok) {
      this.message = "Opération enregistrée.";
      this.op = { type: "ENCAISSEMENT", montant: 0, libelle: "" };
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur.";
    }
  }

  async envoyerTransfert() {
    this.erreur = "";
    this.chargement = true;
    const r = await this.api.post<TransfertCaisse>("/transferts-caisse", this.tr);
    this.chargement = false;
    if (r.ok) {
      this.message = "Transfert envoyé. En attente de confirmation.";
      this.tr = { destinataireId: "", montant: 0, motif: "" };
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur.";
    }
  }

  async confirmerTransfert(t: TransfertCaisse) {
    if (!confirm("Confirmer la réception de ce transfert ?")) return;
    const r = await this.api.post(`/transferts-caisse/${t.id}/confirmer`);
    if (r.ok) { this.message = "Transfert confirmé. Soldes mis à jour."; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }

  async rejeterTransfert(t: TransfertCaisse) {
    if (!confirm("Rejeter ce transfert ?")) return;
    const r = await this.api.post(`/transferts-caisse/${t.id}/rejeter`);
    if (r.ok) { this.message = "Transfert rejeté."; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }

  imprimerHistorique() {
    let html = `<h1>Historique des opérations de caisse</h1><div class="meta">Imprimé le ${new Date().toLocaleDateString("fr-FR")}</div>`;
    html += `<table><thead><tr><th>Date</th><th>N°</th><th>Type</th><th>Libellé</th><th>Montant</th><th>Source</th></tr></thead><tbody>`;
    for (const o of this.operations) {
      html += `<tr><td>${o.date?.slice(0, 10)}</td><td>${o.numero}</td><td>${o.type}</td><td>${o.libelle}</td><td class="right">${o.montant.toFixed(2)}</td><td>${o.source}</td></tr>`;
    }
    html += `</tbody></table>`;
    this.print.printHtml("Historique caisse", html);
  }
}
