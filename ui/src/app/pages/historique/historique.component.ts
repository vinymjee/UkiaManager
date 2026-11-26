import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { PrintService } from "../../services/print.service";
import { QrService } from "../../services/qr.service";
import { OperationCaisse, RecuPaiement, Facture, Caisse } from "../../models";

@Component({
  selector: "app-historique",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Historique des opérations de caisse</h1>
        <div class="subtitle">Consultez et filtrez toutes les opérations de caisse</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-outline" (click)="imprimer()">Imprimer</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>

    <!-- Filtres -->
    <div class="card card-body">
      <div class="card-header"><div class="card-title">Filtres</div></div>
      <form (ngSubmit)="appliquerFiltres()" class="form-grid" style="margin-top: var(--space-3);">
        <div class="form-group">
          <label class="form-label">Date début</label>
          <input type="date" name="debut" [(ngModel)]="filtre.debut" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Date fin</label>
          <input type="date" name="fin" [(ngModel)]="filtre.fin" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">&Eacute;crire un texte (libellé, numéro, type)</label>
          <input type="text" name="recherche" [(ngModel)]="filtre.recherche" class="form-input" placeholder="Rechercher..." />
        </div>
        <div class="form-actions" style="align-self:end;">
          <button type="submit" class="btn btn-primary">Appliquer</button>
          <button type="button" class="btn btn-outline" (click)="reinitialiser()">R&eacute;initialiser</button>
        </div>
      </form>

      <!-- Caisses (zone multiligne avec cases à cocher) -->
      <div style="margin-top: var(--space-4);">
        <div class="form-label">Caisses (cocher celles à afficher)</div>
        <div class="caisse-check-list">
          <label *ngFor="let c of caisses" class="caisse-check">
            <input type="checkbox" [checked]="selectedCaisses.has(c.userId)" (change)="toggleCaisse(c.userId)" />
            <span>{{ c.nom }} <span class="badge badge-secondary">{{ c.solde | number:'1.0-2' }}</span></span>
          </label>
          <div *ngIf="caisses.length === 0" class="empty-state">Aucune caisse accessible.</div>
        </div>
      </div>
    </div>

    <!-- Résultats -->
    <div class="card card-body" style="margin-top: var(--space-6);">
      <div class="card-header">
        <div class="card-title">R&eacute;sultats ({{ operationsFiltrees.length }})</div>
      </div>
      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr><th>Date</th><th>N&deg;</th><th>Type</th><th>Libell&eacute;</th><th>Caisse</th><th>Montant</th><th>Source</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of operationsFiltrees">
              <td>{{ o.date | slice:0:10 }}</td>
              <td>{{ o.numero }}</td>
              <td><span class="badge" [class]="'badge-' + (o.type === 'ENCAISSEMENT' || o.type === 'TRANSFERT_ENTRANT' ? 'success' : 'error')">{{ o.type }}</span></td>
              <td>{{ o.libelle }}</td>
              <td>{{ nomCaisse(o.userId) }}</td>
              <td>{{ o.montant | number:'1.0-2' }}</td>
              <td>{{ o.source }}</td>
              <td class="table-actions">
                <button class="btn btn-outline btn-sm" (click)="reimprimer(o)">Imprimer {{ o.source === 'FACTURE' ? 're&ccedil;u' : 'bordereau' }}</button>
              </td>
            </tr>
            <tr *ngIf="operationsFiltrees.length === 0"><td colspan="8" class="empty-state">Aucune op&eacute;ration pour ces filtres.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class HistoriqueComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  print = inject(PrintService);
  qr = inject(QrService);

  caisses: Caisse[] = [];
  selectedCaisses = new Set<string>();
  operations: OperationCaisse[] = [];
  operationsFiltrees: OperationCaisse[] = [];
  recus: RecuPaiement[] = [];
  factures: Facture[] = [];
  erreur = "";

  filtre: { debut: string; fin: string; recherche: string } = { debut: "", fin: "", recherche: "" };

  async ngOnInit() {
    await this.charger();
  }

  async charger() {
    this.erreur = "";
    const [ca, ops, rec, fac] = await Promise.all([
      this.api.get<Caisse[]>("/caisses/visibles"),
      this.api.get<OperationCaisse[]>("/operations-caisse"),
      this.api.get<RecuPaiement[]>("/recus"),
      this.api.get<Facture[]>("/factures"),
    ]);
    if (ca.ok) {
      this.caisses = ca.data || [];
      if (this.selectedCaisses.size === 0) this.caisses.forEach((c) => this.selectedCaisses.add(c.userId));
    }
    if (ops.ok) this.operations = ops.data || [];
    if (rec.ok) this.recus = rec.data || [];
    if (fac.ok) this.factures = fac.data || [];
    this.appliquerFiltres();
  }

  toggleCaisse(userId: string) {
    if (this.selectedCaisses.has(userId)) this.selectedCaisses.delete(userId);
    else this.selectedCaisses.add(userId);
    this.appliquerFiltres();
  }

  nomCaisse(userId: string): string {
    return this.caisses.find((c) => c.userId === userId)?.nom || userId;
  }

  async appliquerFiltres() {
    let ops = [...this.operations];
    if (this.selectedCaisses.size > 0) {
      ops = ops.filter((o) => this.selectedCaisses.has(o.userId));
    } else {
      ops = [];
    }
    if (this.filtre.debut) ops = ops.filter((o) => (o.date || "").slice(0, 10) >= this.filtre.debut);
    if (this.filtre.fin) ops = ops.filter((o) => (o.date || "").slice(0, 10) <= this.filtre.fin);
    const q = this.filtre.recherche.trim().toLowerCase();
    if (q) {
      ops = ops.filter((o) =>
        (o.libelle || "").toLowerCase().includes(q) ||
        (o.numero || "").toLowerCase().includes(q) ||
        (o.type || "").toLowerCase().includes(q) ||
        (o.source || "").toLowerCase().includes(q)
      );
    }
    this.operationsFiltrees = ops;
  }

  reinitialiser() {
    this.filtre = { debut: "", fin: "", recherche: "" };
    this.selectedCaisses.clear();
    this.caisses.forEach((c) => this.selectedCaisses.add(c.userId));
    this.appliquerFiltres();
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
        <div class="rec-client"><b>Op&eacute;ration :</b> ${o.type}</div>
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

  imprimer() {
    let html = `<h1>Historique des op&eacute;rations de caisse</h1><div class="meta">Imprim&eacute; le ${new Date().toLocaleDateString("fr-FR")}</div>`;
    html += `<table><thead><tr><th>Date</th><th>N&deg;</th><th>Type</th><th>Libell&eacute;</th><th>Montant</th></tr></thead><tbody>`;
    for (const o of this.operationsFiltrees) {
      html += `<tr><td>${o.date?.slice(0, 10)}</td><td>${o.numero}</td><td>${o.type}</td><td>${o.libelle}</td><td class="right">${o.montant.toFixed(2)}</td></tr>`;
    }
    html += `</tbody></table>`;
    this.print.printHtml("Historique caisse", html);
  }
}
