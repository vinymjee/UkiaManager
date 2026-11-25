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
      <h1>Clients</h1>
      <button class="btn btn-primary" (click)="editer(null)">Nouveau client</button>
    </div>
    <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message">{{ message }}</div>

    <div class="card" *ngIf="formVisible">
      <div class="card-title">{{ clientEdite ? "Modifier" : "Nouveau" }} client</div>
      <div class="form-row">
        <div class="form-group"><label>Nom</label><input [(ngModel)]="client.nom" required /></div>
        <div class="form-group"><label>Email</label><input [(ngModel)]="client.email" /></div>
        <div class="form-group"><label>T&eacute;l&eacute;phone</label><input [(ngModel)]="client.telephone" /></div>
        <div class="form-group"><label>Adresse</label><input [(ngModel)]="client.adresse" /></div>
        <div class="form-group"><label>Ville</label><input [(ngModel)]="client.ville" /></div>
        <div class="form-group"><label>NIF</label><input [(ngModel)]="client.nif" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-success" (click)="enregistrer()" [disabled]="chargement">Enregistrer</button>
        <button class="btn btn-outline" (click)="annulerForm()">Annuler</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Liste des clients</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>T&eacute;l.</th><th>Adresse / Ville</th><th>NIF</th><th>Actif</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of clients">
              <td>{{ c.nom }}</td><td>{{ c.email || "-" }}</td><td>{{ c.telephone || "-" }}</td>
              <td>{{ c.adresse || "-" }} {{ c.ville || "-" }}</td><td>{{ c.nif || "-" }}</td>
              <td>{{ c.actif ? "Oui" : "Non" }}</td>
              <td><button class="btn btn-outline btn-sm" (click)="editer(c)">Modifier</button> <button class="btn btn-danger btn-sm" (click)="supprimer(c)">Suppr.</button></td>
            </tr>
            <tr *ngIf="clients.length === 0"><td colspan="7" class="empty">Aucun client.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ClientsComponent implements OnInit {
  api = inject(ApiService);
  clients: Client[] = [];
  erreur = ""; message = ""; formVisible = false; chargement = false;
  clientEdite: Client | null = null;
  client: Client = { id: "", nom: "", actif: true };

  async ngOnInit() { this.charger(); }
  async charger() { const r = await this.api.get<Client[]>("/clients"); this.clients = r.data || []; }
  editer(c: Client | null) {
    this.clientEdite = c;
    this.client = c ? { ...c } : { id: "", nom: "", email: "", telephone: "", adresse: "", ville: "", nif: "", actif: true };
    this.formVisible = true; this.erreur = ""; this.message = "";
  }
  annulerForm() { this.formVisible = false; }
  async enregistrer() {
    this.erreur = ""; this.chargement = true;
    let r;
    if (this.clientEdite) r = await this.api.put<Client>(`/clients/${this.clientEdite.id}`, this.client);
    else r = await this.api.post<Client>("/clients", this.client);
    this.chargement = false;
    if (r.ok) { this.message = "Client enregistr&eacute;."; this.formVisible = false; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }
  async supprimer(c: Client) {
    if (!confirm("Supprimer ce client ?")) return;
    const r = await this.api.del(`/clients/${c.id}`);
    if (r.ok) await this.charger(); else this.erreur = r.erreur || "Erreur.";
  }
}
