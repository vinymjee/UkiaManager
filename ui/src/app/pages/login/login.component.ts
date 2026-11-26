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

        <div class="login-footer" style="margin-top: var(--space-5);">
          <span>L'accès est réservé aux utilisateurs autorisés. Contactez votre superviseur.</span>
        </div>
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
  chargement = false;

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
}
