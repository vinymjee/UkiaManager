import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { Utilisateur, TOUS_LES_DROITS } from "../../models";

@Component({
  selector: "app-utilisateurs",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-header">
      <div>
        <h1>Utilisateurs</h1>
        <div class="subtitle">Gestion des agents et superviseurs</div>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="editer(null)">Nouvel utilisateur</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="erreur" role="alert">{{ erreur }}</div>
    <div class="alert alert-success" *ngIf="message" role="alert">{{ message }}</div>

    <div *ngIf="formVisible" class="card card-body">
      <div class="card-header">
        <div class="card-title">{{ userEdite ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}</div>
        <button class="btn btn-ghost btn-sm" (click)="fermerFormulaire()">Fermer</button>
      </div>

      <form (ngSubmit)="enregistrer()" #form="ngForm" class="form-grid">
        <input type="hidden" name="id" [ngModel]="user.id" />

        <div class="form-group">
          <label class="form-label">Nom complet</label>
          <input type="text" name="nom" [(ngModel)]="user.nom" required class="form-input" placeholder="Nom et prénom" />
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" name="email" [(ngModel)]="user.email" required class="form-input" placeholder="utilisateur@entreprise.com" />
        </div>

        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <input type="password" name="motDePasse" [(ngModel)]="user.motDePasse" [required]="!userEdite" class="form-input" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" />
          <span class="form-hint">{{ userEdite ? 'Laissez vide pour conserver le mot de passe actuel' : 'Obligatoire' }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">R&ocirc;le</label>
          <select name="role" [(ngModel)]="user.role" required class="form-select">
            <option value="AGENT">Agent</option>
            <option value="SUPERVISEUR">Superviseur</option>
          </select>
        </div>

        <div class="form-group full" *ngIf="user.role === 'AGENT'">
          <label class="form-label">Droits / Autorisations</label>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-2); margin-top: var(--space-2);">
            <label *ngFor="let d of droitsDisponibles" style="display:flex; align-items:center; gap: var(--space-2); font-size: var(--text-sm); cursor:pointer;">
              <input type="checkbox" [checked]="hasDroit(d)" (change)="toggleDroit(d)" />
              {{ d }}
            </label>
          </div>
          <span class="form-hint">Le superviseur poss&egrave;de tous les droits automatiquement.</span>
        </div>

        <div class="form-group">
          <label class="form-label">Statut</label>
          <select name="actif" [(ngModel)]="user.actif" class="form-select">
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>

        <div class="form-actions" style="margin-top: var(--space-5);">
          <button type="submit" class="btn btn-success" [disabled]="chargement || !form.valid">{{ chargement ? "Enregistrement..." : "Enregistrer l'utilisateur" }}</button>
          <button type="button" class="btn btn-outline" (click)="fermerFormulaire()">Annuler</button>
        </div>
      </form>
    </div>

    <div class="card card-body">
      <div class="card-header">
        <div class="card-title">Liste des utilisateurs</div>
      </div>

      <div class="table-wrap" style="margin-top: var(--space-3);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th><th>Email</th><th>R&ocirc;le</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of utilisateurs">
              <td>{{ u.nom }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge" [class]="'badge-' + (u.role === 'SUPERVISEUR' ? 'info' : 'secondary')">{{ u.role }}</span></td>
              <td><span class="badge" [class]="'badge-' + (u.actif ? 'success' : 'secondary')">{{ u.actif ? 'Actif' : 'Inactif' }}</span></td>
              <td class="table-actions">
                <button class="btn btn-outline btn-sm" (click)="editer(u)">Modifier</button>
                <button *ngIf="u.id !== auth.utilisateur()?.id" class="btn btn-danger btn-sm" (click)="supprimer(u)">Supprimer</button>
              </td>
            </tr>
            <tr *ngIf="utilisateurs.length === 0"><td colspan="5" class="empty-state">Aucun utilisateur enregistr&eacute;.</td></tr>
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
  erreur = "";
  message = "";
  formVisible = false;
  chargement = false;
  userEdite: Utilisateur | null = null;
  user: Utilisateur = { id: "", nom: "", email: "", role: "AGENT", actif: true, droits: [] };
  droitsDisponibles = TOUS_LES_DROITS;
  toggleDroit(d: string) {
    if (!this.user.droits) this.user.droits = [];
    const i = this.user.droits.indexOf(d);
    if (i >= 0) this.user.droits.splice(i, 1);
    else this.user.droits.push(d);
  }
  hasDroit(d: string) { return (this.user.droits || []).includes(d); }

  async ngOnInit() { this.charger(); }

  async charger() {
    const r = await this.api.get<Utilisateur[]>("/utilisateurs");
    this.utilisateurs = r.data || [];
  }

  editer(u: Utilisateur | null) {
    this.userEdite = u;
    this.user = u ? { ...u, droits: u.droits || [] } : { id: "", nom: "", email: "", role: "AGENT", actif: true, droits: [] };
    this.formVisible = true;
    this.erreur = "";
    this.message = "";
  }

  fermerFormulaire() { this.formVisible = false; }

  async enregistrer() {
    this.erreur = "";
    this.chargement = true;
    let r;
    if (this.userEdite) {
      r = await this.api.put<Utilisateur>(`/utilisateurs/${this.userEdite.id}`, this.user);
    } else {
      r = await this.api.post<Utilisateur>("/utilisateurs", this.user);
    }
    this.chargement = false;
    if (r.ok) {
      this.message = "Utilisateur enregistr&eacute; avec succ&egrave;s.";
      this.formVisible = false;
      await this.charger();
    } else {
      this.erreur = r.erreur || "Erreur.";
    }
  }

  async supprimer(u: Utilisateur) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const r = await this.api.del(`/utilisateurs/${u.id}`);
    if (r.ok) await this.charger();
    else this.erreur = r.erreur || "Erreur.";
  }
}
