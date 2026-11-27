import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { PrintService } from "../../services/print.service";
import { QrService } from "../../services/qr.service";
import { Caisse, OperationCaisse, TransfertCaisse, Utilisateur, RecuPaiement, Facture, LignePaiement } from "../../models";

@Component({
  selector: "app-caisse",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="app-header">
      <div>
        <h1>Caisse</h1>
        <div class="subtitle">Gestion de votre caisse et transferts entre utilisateurs</div>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <!-- Soldes -->
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

    <div *ngIf="auth.isSuperviseur() && soldes.length" class="card card-body" style="margin-top: var(--space-4);">
      <div class="card-header"><div class="card-title">Soldes par utilisateur</div></div>
      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead><tr><th>Utilisateur</th><th>Solde</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of soldes"><td>{{ s.nom }}</td><td>{{ s.solde | number:'1.0-2' }}</td></tr>
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
          <select name="type" [(ngModel)]="op.type" (change)="onTypeChange()" required class="form-select">
            <option *ngIf="auth.hasDroit('CAISSE_ENCAISSEMENT')" value="ENCAISSEMENT">Encaissement</option>
            <option *ngIf="auth.hasDroit('CAISSE_DECAISSEMENT')" value="DECAISSEMENT">Dépense (décaissement)</option>
          </select>
        </div>

        <div class="form-group full" *ngIf="op.type === 'ENCAISSEMENT'">
          <label class="form-label">Facture concernée (paiement anticipé / encaissement sur facture)</label>
          <select name="factureId" [(ngModel)]="op.factureId" (change)="onFactureChange()" class="form-select">
            <option value="">-- Aucune facture (encaissement ordinaire) --</option>
            <option *ngFor="let fac of facturesNonPayees" [value]="fac.id">{{ fac.numero }} — {{ fac.clientNom }} — {{ fac.ttc | number:'1.0-2' }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Montant total de l'opération</label>
          <input type="number" name="montant" [(ngModel)]="op.montant" (change)="verifierSomme()" required step="0.01" class="form-input" placeholder="0.00" [readonly]="op.factureId" />
          <span class="form-hint" *ngIf="op.factureId">Montant renseigné automatiquement d'après la facture</span>
        </div>

        <div class="form-group full" *ngIf="op.factureId">
          <label class="form-label">Répartition du montant par ligne de facture</label>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Désignation</th><th>Montant facturé</th><th>Montant à payer</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let l of op.lignesPaiement; let i = index">
                  <td>{{ l.description }}</td>
                  <td>{{ factureChoisie?.lignes[i]?.total | number:'1.0-2' }}</td>
                  <td><input type="number" name="ligne-{{i}}" [(ngModel)]="l.montant" (change)="verifierSomme()" class="form-input" step="0.01" min="0" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="somme-check" [class.valid]="sommeLignesValide" [class.invalid]="!sommeLignesValide">
            Somme des lignes : {{ sommeLignes | number:'1.0-2' }} / Montant : {{ op.montant | number:'1.0-2' }}
            <span *ngIf="sommeLignesValide">✓ Conforme</span>
            <span *ngIf="!sommeLignesValide">✗ La somme doit être égale au montant total</span>
          </div>
        </div>

        <div class="form-group full">
          <label class="form-label">Libellé</label>
          <input type="text" name="libelle" [(ngModel)]="op.libelle" required class="form-input" placeholder="Motif de l'opération" />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-success" [disabled]="chargement || (op.factureId && !sommeLignesValide)">Enregistrer</button>
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

    <!-- Transferts en attente -->
    <div *ngIf="transfertsEnAttente.length" class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header"><div class="card-title">Transferts en attente de votre confirmation</div></div>
      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead><tr><th>N°</th><th>Expéditeur</th><th>Montant</th><th>Motif</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let t of transfertsEnAttente">
              <td>{{ t.numero }}</td><td>{{ t.expediteurNom }}</td>
              <td>{{ t.montant | number:'1.0-2' }}</td><td>{{ t.motif || "-" }}</td>
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

    <!-- Historique des operations (résumé) -->
    <div class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header">
        <div class="card-title">Dernières opérations de caisse</div>
        <a routerLink="/historique" class="link-btn">Voir tout l'historique</a>
      </div>
      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead><tr><th>Date</th><th>N°</th><th>Type</th><th>Libellé</th><th>Montant</th><th>Source</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let o of operations.slice(0, 8)">
              <td>{{ o.date | slice:0:10 }}</td><td>{{ o.numero }}</td>
              <td><span class="badge" [class]="'badge-' + (o.type === 'ENCAISSEMENT' || o.type === 'TRANSFERT_ENTRANT' ? 'success' : 'error')">{{ o.type }}</span></td>
              <td>{{ o.libelle }}</td><td>{{ o.montant | number:'1.0-2' }}</td><td>{{ o.source }}</td>
              <td class="table-actions"><button class="btn btn-outline btn-sm" (click)="reimprimer(o)">Imprimer {{ o.source === 'FACTURE' ? 'reçu' : 'bordereau' }}</button></td>
            </tr>
            <tr *ngIf="operations.length === 0"><td colspan="7" class="empty-state">Aucune opération.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Admin : réinitialisation -->
    <div *ngIf="auth.isSuperviseur()" class="card card-body" style="margin-top: var(--space-6); border-color: rgb(var(--color-error));">
      <div class="card-header"><div class="card-title">Administration — Réinitialisation des données de test</div></div>
      <p style="font-size: var(--text-sm); color: rgb(var(--color-text-secondary));">
        Efface toutes les données comptables (factures, devis, clients, réçus, bordereaux, opérations, transferts) et remet tous les soldes à zéro. Les comptes utilisateurs sont conservés.
      </p>
      <button class="btn btn-danger" (click)="reinitialiser()">Réinitialiser toutes les données</button>
    </div>
  `,
})
export class CaisseComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  print = inject(PrintService);
  qr = inject(QrService);

  caisse: Caisse | null = null;
  soldes: any[] = [];
  utilisateurs: Utilisateur[] = [];
  operations: OperationCaisse[] = [];
  transferts: TransfertCaisse[] = [];
  transfertsEnAttente: TransfertCaisse[] = [];
  recus: RecuPaiement[] = [];
  factures: Facture[] = [];
  facturesNonPayees: Facture[] = [];
  erreur = "";
  message = "";
  chargement = false;
  totalSysteme = 0;

  op: { type: string; montant: number; libelle: string; factureId: string; lignesPaiement: LignePaiement[] } = {
    type: "ENCAISSEMENT", montant: 0, libelle: "", factureId: "", lignesPaiement: [],
  };
  tr: { destinataireId: string; montant: number; motif: string } = { destinataireId: "", montant: 0, motif: "" };

  get factureChoisie(): Facture | undefined {
    return this.factures.find((f) => f.id === this.op.factureId);
  }

  get sommeLignes(): number {
    return this.op.lignesPaiement.reduce((s, l) => s + (Number(l.montant) || 0), 0);
  }

  get sommeLignesValide(): boolean {
    return Math.abs(this.sommeLignes - Number(this.op.montant)) < 0.01;
  }

  async ngOnInit() { await this.charger(); }

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
    const [rec, fac] = await Promise.all([
      this.api.get<RecuPaiement[]>("/recus"),
      this.api.get<Facture[]>("/factures"),
    ]);
    this.recus = rec.data || [];
    this.factures = fac.data || [];
    this.facturesNonPayees = this.factures.filter((f) => f.statut !== "PAYEE" && f.statut !== "ANNULEE");
    if (this.auth.isSuperviseur()) {
      const s = await this.api.get<any[]>("/caisses/tous");
      if (s.ok) {
        this.soldes = s.data || [];
        this.totalSysteme = this.soldes.reduce((acc, x) => acc + (x.solde || 0), 0);
      }
    }
  }

  onTypeChange() {
    if (this.op.type !== "ENCAISSEMENT") {
      this.op.factureId = "";
      this.op.lignesPaiement = [];
    }
  }

  onFactureChange() {
    const fac = this.factureChoisie;
    if (fac) {
      this.op.montant = fac.ttc;
      this.op.lignesPaiement = fac.lignes.map((l) => ({ description: l.description, montant: l.total || 0 }));
      if (!this.op.libelle) this.op.libelle = `Encaissement facture ${fac.numero} - ${fac.clientNom}`;
    } else {
      this.op.montant = 0;
      this.op.lignesPaiement = [];
    }
    this.verifierSomme();
  }

  verifierSomme() {
    // getter recalcule automatiquement
  }

  async enregistrerOperation() {
    this.erreur = "";
    if (this.op.factureId && !this.sommeLignesValide) {
      this.erreur = "La somme des montants par ligne doit être égale au montant total de l'opération.";
      return;
    }
    this.chargement = true;
    const payload: any = {
      type: this.op.type,
      montant: this.op.montant,
      libelle: this.op.libelle,
      factureId: this.op.factureId || undefined,
      lignesPaiement: this.op.factureId ? this.op.lignesPaiement : undefined,
    };
    const r = await this.api.post<OperationCaisse>("/operations-caisse", payload);
    this.chargement = false;
    if (r.ok) {
      this.message = this.op.factureId ? "Encaissement enregistré et facture marquée payée." : "Opération enregistrée.";
      this.op = { type: "ENCAISSEMENT", montant: 0, libelle: "", factureId: "", lignesPaiement: [] };
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
    } else this.erreur = r.erreur || "Erreur.";
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

  async reinitialiser() {
    if (!confirm("ATTENTION : Effacer TOUTES les données de test (factures, clients, réçus, opérations, soldes) ? Cette action est irréversible.")) return;
    this.chargement = true;
    const r = await this.api.post("/admin/reset", { confirm: true });
    this.chargement = false;
    if (r.ok) { this.message = "Données réinitialisées. Tous les soldes sont à zéro."; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }

  reimprimer(o: OperationCaisse) {
    const recu = this.recus.find((r) => r.factureId === o.refId || r.id === o.refId);
    if (recu) this.imprimerRecu(recu);
    else this.imprimerBordereau(o);
  }

  imprimerRecu(r: RecuPaiement) {
    const facture = this.factures.find((f) => f.id === r.factureId);
    const reste = facture ? Math.max(0, facture.ttc - r.montant) : 0;
    const u = this.auth.utilisateur();
    const nominatif = u?.titre ? `${u.titre} ${u.nom}` : u?.nom || "";
    const cachet = u?.cachet || "";
    const code = "PS/CLT/MGR";
    const lignes = facture?.lignes || [];
    const matricule = r.clientId || "UKLC_7";
    const numFacture = facture?.numero || r.factureId || "00186";
    const dateStr = r.date?.slice(0, 10) || "";
    const bodyHtml = `
      <hr class="rec-sep"/><div class="rec-titre-centre">RECU DE PAIEMENT</div><hr class="rec-sep2"/>
      <div class="rec-infos">
        <div class="rec-ligne"><span><b>Matricule client :</b> ${matricule}</span><span class="droite"><b>Num&eacute;ro facture :</b> <span class="rec-rouge">${numFacture}</span> /2026</span></div>
        <div class="rec-client"><b>Client :</b> ${r.clientNom || "-"}</div>
      </div>
      <table class="rec-table">
        <thead><tr><th>Code</th><th>Intitul&eacute;</th><th class="right">Montant Vers&eacute;</th><th class="right">Reste</th></tr></thead>
        <tbody>
          ${lignes.length ? lignes.map((l) => `<tr><td>${code}</td><td>${l.description || ""}</td><td class="right">${Number(l.total || 0).toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>`).join("") : `<tr><td>${code}</td><td>Paiement</td><td class="right">${r.montant.toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>`}
          <tr class="rec-total"><td colspan="2">Total vers&eacute;</td><td class="right">${r.montant.toFixed(2)} FCFA</td><td class="right">${reste.toFixed(2)} FCFA</td></tr>
        </tbody>
      </table>
      <p class="rec-montant-lettres">${r.montant.toLocaleString("fr-FR")} francs CFA</p>
      <div class="rec-date">Brazzaville : le ${dateStr}</div>
      <div class="rec-sign"><div><b>${nominatif}</b></div>${cachet ? `<div class="rec-cachet">${cachet}</div>` : ""}</div>
      <div class="rec-pied">R&eacute;publique du Congo<br/>Unit&eacute; * Travail * Progr&egrave;s</div>
    `;
    this.print.printWithHeader("Reçu de paiement", bodyHtml, this.qr.docUrl("recu", r.id));
  }

  imprimerBordereau(o: OperationCaisse) {
    const u = this.auth.utilisateur();
    const nominatif = u?.titre ? `${u.titre} ${u.nom}` : u?.nom || "";
    const cachet = u?.cachet || "";
    const dateStr = o.date?.slice(0, 10) || "";
    const estDepense = o.type === "DECAISSEMENT" || o.type === "TRANSFERT_SORTANT";
    const bodyHtml = `
      <hr class="rec-sep"/><div class="rec-titre-centre">BORDEREAU DE ${estDepense ? "DEPENSE" : "VERSEMENT"}</div><hr class="rec-sep2"/>
      <div class="rec-infos">
        <div class="rec-ligne"><span><b>Num&eacute;ro :</b> ${o.numero}</span><span class="droite"><b>Date :</b> ${dateStr}</span></div>
        <div class="rec-client"><b>Libell&eacute; :</b> ${o.libelle}</div>
      </div>
      <table class="rec-table">
        <thead><tr><th>Code</th><th>Intitul&eacute;</th><th class="right">Montant</th></tr></thead>
        <tbody><tr><td>CAISSE</td><td>${o.libelle}</td><td class="right">${o.montant.toFixed(2)} FCFA</td></tr>
        <tr class="rec-total"><td colspan="2">Total</td><td class="right">${o.montant.toFixed(2)} FCFA</td></tr></tbody>
      </table>
      <p class="rec-montant-lettres">${o.montant.toLocaleString("fr-FR")} francs CFA</p>
      <div class="rec-date">Brazzaville : le ${dateStr}</div>
      <div class="rec-sign"><div><b>${nominatif}</b></div>${cachet ? `<div class="rec-cachet">${cachet}</div>` : ""}</div>
      <div class="rec-pied">R&eacute;publique du Congo<br/>Unit&eacute; * Travail * Progr&egrave;s</div>
    `;
    this.print.printWithHeader(estDepense ? "Bordereau de dépense" : "Bordereau de versement", bodyHtml, this.qr.docUrl("operation", o.id));
  }
}
