import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { Client } from "../../models";

@Component({
  selector: "app-clients",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Clients</h1>
        <div class="subtitle">Gestion de votre portefeuille clients</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="editer(null)">Nouveau client</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <div *ngIf="formVisible" class="card card-body">
      <div class="card-header">
        <div class="card-title">{{ clientEdite ? 'Modifier le client' : 'Nouveau client' }}</div>
        <button class="btn btn-ghost btn-sm" (click)="fermerFormulaire()">Fermer</button>
      </div>

      <form (ngSubmit)="enregistrer()" #form="ngForm" class="form-grid">
        <input type="hidden" name="id" [ngModel]="client.id" />

        <div class="form-group">
          <label class="form-label">Matricule</label>
          <input type="text" name="matricule" [(ngModel)]="client.matricule" class="form-input" placeholder="Auto-généré si vide" />
        </div>

        <div class="form-group">
          <label class="form-label">Nom / Raison sociale</label>
          <input type="text" name="nom" [(ngModel)]="client.nom" required class="form-input" placeholder="Nom du client" />
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" name="email" [(ngModel)]="client.email" class="form-input" placeholder="contact@entreprise.com" />
        </div>

        <div class="form-group">
          <label class="form-label">T&eacute;l&eacute;phone</label>
          <input type="tel" name="telephone" [(ngModel)]="client.telephone" class="form-input" placeholder="+225 XX XX XX XX" />
        </div>

        <div class="form-group">
          <label class="form-label">Adresse</label>
          <input type="text" name="adresse" [(ngModel)]="client.adresse" class="form-input" placeholder="Adresse" />
        </div>

        <div class="form-group">
          <label class="form-label">Ville</label>
          <input type="text" name="ville" [(ngModel)]="client.ville" class="form-input" placeholder="Ville" />
        </div>

        <div class="form-group">
          <label class="form-label">NIF</label>
          <input type="text" name="nif" [(ngModel)]="client.nif" class="form-input" placeholder="NIF" />
        </div>

        <div class="form-group">
          <label class="form-label">Actif</label>
          <select name="actif" [(ngModel)]="client.actif" class="form-select">
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>

        <div class="form-actions" style="margin-top: var(--space-5);">
          <button type="submit" class="btn btn-success" [disabled]="chargement || !form.valid">{{ chargement ? "Enregistrement..." : "Enregistrer le client" }}</button>
          <button type="button" class="btn btn-outline" (click)="fermerFormulaire()">Annuler</button>
        </div>
      </form>
    </div>

    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Liste des clients</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th><th>Email</th><th>T&eacute;l.</th><th>Adresse / Ville</th><th>NIF</th><th>Actif</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clients">
              <td>{{ c.nom }}</td>
              <td>{{ c.email || "-" }}</td>
              <td>{{ c.telephone || "-" }}</td>
              <td>{{ c.adresse || "-" }} {{ c.ville || "-" }}</td>
              <td>{{ c.nif || "-" }}</td>
              <td><span class="badge" [class]="'badge-' + (c.actif ? 'success' : 'secondary')">{{ c.actif ? 'Actif' : 'Inactif' }}</span></td>
              <td class="table-actions">
                <button class="btn btn-outline btn-sm" (click)="editer(c)">Modifier</button>
                <button class="btn btn-danger btn-sm" (click)="supprimer(c)">Supprimer</button>
              </td>
            </tr>
            <tr *ngIf="clients.length === 0"><td colspan="7" class="empty-state">Aucun client enregistr&eacute;.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ClientsComponent implements OnInit {
  api = inject(ApiService);

  clients: Client[] = [];
  erreur = "";
  message = "";
  formVisible = false;
  chargement = false;
  clientEdite: Client | null = null;
  client: Client = { id: "", nom: "", actif: true };

  async ngOnInit() { this.charger(); }

  async charger() {
    const r = await this.api.get<Client[]>("/clients");
    this.clients = r.data || [];
  }

  editer(c: Client | null) {
    this.clientEdite = c;
    this.client = c ? { ...c } : { id: "", nom: "", email: "", telephone: "", adresse: "", ville: "", nif: "", actif: true };
    this.formVisible = true;
    this.erreur = "";
    this.message = "";
  }

  fermerFormulaire() { this.formVisible = false; }

  async enregistrer() {
    this.erreur = "";
    this.chargement = true;
    let r;
    if (this.clientEdite) {
      r = await this.api.put<Client>(`/clients/${this.clientEdite.id}`, this.client);
    } else {
      r = await this.api.post<Client>("/clients", this.client);
    }
    this.chargement = false;
    if (r.ok) {
      this.message = "Client enregistr&eacute; avec succ&egrave;s.";
      this.formVisible = false;
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur.";
    }
  }

  async supprimer(c: Client) {
    if (!confirm("Supprimer ce client ?")) return;
    const r = await this.api.del(`/clients/${c.id}`);
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }
}
