import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { Utilisateur } from "../../models";

@Component({
  selector: "app-utilisateurs",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <h1>Utilisateurs (agents)</h1>
      <button class="btn btn-primary" (click)="editer(null)">Nouvel utilisateur</button>
    </div>
    <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message">{{ message }}</div>

    <div class="card" *ngIf="formVisible">
      <div class="card-title">{{ userEdite ? "Modifier" : "Nouvel" }} utilisateur</div>
      <div class="form-row">
        <div class="form-group"><label>Nom</label><input [(ngModel)]="user.nom" required /></div>
        <div class="form-group"><label>Email</label><input [(ngModel)]="user.email" required /></div>
        <div class="form-group"><label>Mot de passe</label><input [(ngModel)]="user.motDePasse" type="password" [required]="!userEdite" /></div>
        <div class="form-group"><label>R\u00f4le</label><select [(ngModel)]="user.role"><option value="AGENT">Agent</option><option value="SUPERVISEUR">Superviseur</option></select></div>
        <div class="form-group"><label>Actif</label><select [(ngModel)]="user.actif"><option value="true">Oui</option><option value="false">Non</option></select></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-success" (click)="enregistrer()" [disabled]="chargement">Enregistrer</button>
        <button class="btn btn-outline" (click)="annulerForm()">Annuler</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Liste des utilisateurs</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>R\u00f4le</th><th>Actif</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let u of utilisateurs">
              <td>{{ u.nom }}</td><td>{{ u.email }}</td>
              <td><span class="badge" [class]="'badge-' + (u.role||'').toLowerCase()">{{ u.role }}</span></td>
              <td>{{ u.actif ? "Oui" : "Non" }}</td>
              <td><button class="btn btn-outline btn-sm" (click)="editer(u)">Modifier</button> <button class="btn btn-danger btn-sm" (click)="supprimer(u)" *ngIf="u.id !== auth.utilisateur()?.id">Suppr.</button></td>
            </tr>
            <tr *ngIf="utilisateurs.length === 0"><td colspan="5" class="empty">Aucun utilisateur.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class UtilisateursComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  utilisateurs: Utilisateur[] = [];
  erreur = ""; message = ""; formVisible = false; chargement = false;
  userEdite: Utilisateur | null = null;
  user: Utilisateur = { id: "", nom: "", email: "", role: "AGENT", actif: true, motDePasseHash: "" };

  async ngOnInit() { this.charger(); }
  async charger() { const r = await this.api.get<Utilisateur[]>("/utilisateurs"); this.utilisateurs = r.data || []; }
  editer(u: Utilisateur | null) {
    this.userEdite = u;
    this.user = u ? { ...u, motDePasse: "" } : { id: "", nom: "", email: "", role: "AGENT", actif: true, motDePasseHash: "", motDePasse: "" };
    this.formVisible = true; this.erreur = ""; this.message = "";
  }
  annulerForm() { this.formVisible = false; }
  async enregistrer() {
    this.erreur = ""; this.chargement = true;
    let r;
    if (this.userEdite) r = await this.api.put<Utilisateur>(`/utilisateurs/${this.userEdite.id}`, this.user);
    else r = await this.api.post<Utilisateur>("/utilisateurs", this.user);
    this.chargement = false;
    if (r.ok) { this.message = "Utilisateur enregistr&eacute;."; this.formVisible = false; await this.charger(); }
    else this.erreur = r.erreur || "Erreur.";
  }
  async supprimer(u: Utilisateur) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const r = await this.api.del(`/utilisateurs/${u.id}`);
    if (r.ok) await this.charger(); else this.erreur = r.erreur || "Erreur.";
  }
}
