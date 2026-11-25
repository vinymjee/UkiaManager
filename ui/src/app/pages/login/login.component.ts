import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h2>Connexion - Ukia Caisse</h2>
        <div class="alert alert-error" *ngIf="erreur">{{ erreur }}</div>
        <div class="alert alert-info" *ngIf="info">{{ info }}</div>
        <form (ngSubmit)="connexion()" #f="ngForm">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" [(ngModel)]="email" required />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" name="mdp" [(ngModel)]="motDePasse" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="chargement">Se connecter</button>
          </div>
        </form>

        <div style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid #eee; font-size:0.85rem; color:#6b7280;">
          Premier lancement ? Cr&eacute;ez le superviseur :
          <form (ngSubmit)="initSuperviseur()" #fi="ngForm" style="margin-top:0.75rem;">
            <div class="form-row">
              <div class="form-group"><label>Nom</label><input name="nom" [(ngModel)]="initNom" required /></div>
              <div class="form-group"><label>Email</label><input name="email" type="email" [(ngModel)]="initEmail" required /></div>
              <div class="form-group"><label>Mot de passe</label><input name="mdp" type="password" [(ngModel)]="initMdp" required /></div>
            </div>
            <button type="submit" class="btn btn-outline btn-sm" [disabled]="chargement">Cr&eacute;er le superviseur</button>
            <p class="" style="font-size:0.75rem;color:#9ca3af;margin:0.5rem 0 0;">Cette &eacute;tape est n&eacute;cessaire uniquement si aucun utilisateur n'existe encore.</p>
          </form>
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
  info = "";
  chargement = false;

  initNom = "";
  initEmail = "";
  initMdp = "";

  async connexion() {
    this.erreur = "";
    this.chargement = true;
    const ok = await this.auth.login(this.email, this.motDePasse);
    this.chargement = false;
    if (ok) {
      this.router.navigateByUrl("/dashboard");
    } else {
      this.erreur = "Identifiants invalides.";
    }
  }

  async initSuperviseur() {
    this.erreur = "";
    this.chargement = true;
    const ok = await this.auth.initSuperviseur(this.initNom, this.initEmail, this.initMdp);
    this.chargement = false;
    if (ok) {
      this.info = "Superviseur cr&eacute;&eacute;. Vous pouvez vous connecter.";
    } else {
      this.erreur = "Impossible de cr&eacute;er le superviseur (utilisateurs d&e9;j&agrave; pr&e9;sents ou email d&e9;j&agrave; utilis&e9;).";
    }
  }
}
