import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="login-brand">
            <div class="mark"></div>
            <span>Ukia Caisse</span>
          </div>
          <div class="login-subtitle">Connexion à votre espace de gestion</div>
        </div>

        <div class="alert alert-error" *ngIf="erreur" role="alert">
          {{ erreur }}
        </div>

        <form (ngSubmit)="connexion()" #f="ngForm" class="login-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Adresse email</label>
              <div class="input-group">
                <span class="input-group-icon">&#128231;</span>
                <input
                  type="email"
                  name="email"
                  [(ngModel)]="email"
                  required
                  email
                  class="form-input"
                  placeholder="exemple@entreprise.com"
                  autocomplete="email"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Mot de passe</label>
              <div class="input-group">
                <span class="input-group-icon">&#128274;</span>
                <input
                  type="password"
                  name="motDePasse"
                  [(ngModel)]="motDePasse"
                  required
                  class="form-input"
                  placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                  autocomplete="current-password"
                />
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-block" [disabled]="chargement">
              {{ chargement ? "Connexion en cours..." : "Se connecter" }}
            </button>
          </div>
        </form>

        <div class="login-footer">
          <span>Premier lancement ?</span>
          <a (click)="showInit = !showInit" style="cursor:pointer">Créer le premier compte superviseur</a>
        </div>

        <div *ngIf="showInit" class="init-card" style="margin-top: var(--space-5); padding: var(--space-4); border: 1px dashed rgb(var(--color-border)); border-radius: var(--radius-md); background: rgb(var(--color-bg));">
          <div style="font-size: var(--text-xs); font-weight: var(--font-weight-semibold); color: rgb(var(--color-text-secondary)); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-3);">Nouvelle installation</div>
          <form (ngSubmit)="initSuperviseur()" #fi="ngForm" class="login-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Nom complet</label>
                <input type="text" name="nom" [(ngModel)]="initNom" required class="form-input" placeholder="Jean Dupont" />
              </div>
              <div class="form-group">
                <label class="form-label">Email superviseur</label>
                <input type="email" name="email" [(ngModel)]="initEmail" required class="form-input" placeholder="superviseur@entreprise.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Mot de passe</label>
                <input type="password" name="motDePasse" [(ngModel)]="initMdp" required class="form-input" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" />
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-secondary btn-block" [disabled]="chargement">{{ chargement ? "Création..." : "Créer le superviseur" }}</button>
            </div>
          </form>
          <p style="font-size: var(--text-xs); color: rgb(var(--color-text-muted)); margin-top: var(--space-2);">Cette étape n'est nécessaire que si aucun utilisateur n'existe encore.</p>
        </div>

        <div class="alert alert-info" *ngIf="info" role="alert">{{ info }}</div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  email = "";
  motDePasse = "";
  erreur = "";
  info = "";
  chargement = false;
  showInit = false;

  initNom = "";
  initEmail = "";
  initMdp = "";

  async connexion() {
    this.erreur = "";
    this.chargement = true;
    try {
      const ok = await this.auth.login(this.email, this.motDePasse);
      this.chargement = false;
      if (ok) {
        this.router.navigateByUrl("/dashboard");
      } else {
        this.erreur = "Identifiants invalides. Vérifiez votre email et votre mot de passe.";
      }
    } catch {
      this.chargement = false;
      this.erreur = "Une erreur est survenue lors de la connexion.";
    }
  }

  async initSuperviseur() {
    this.erreur = "";
    this.chargement = true;
    try {
      const ok = await this.auth.initSuperviseur(this.initNom, this.initEmail, this.initMdp);
      this.chargement = false;
      if (ok) {
        this.info = "Compte superviseur créé avec succès. Vous pouvez vous connecter.";
        this.showInit = false;
      } else {
        this.erreur = "Impossible de créer le superviseur (des utilisateurs existent déjà ou l'email est déjà utilisé).";
      }
    } catch {
      this.chargement = false;
      this.erreur = "Une erreur est survenue lors de la création du compte.";
    }
  }
}
