import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "./services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div *ngIf="auth.isAuthenticated(); else loginTpl" class="app-layout">
      <nav class="app-sidebar">
        <div class="app-brand"><span class="mark"></span>Ukia Caisse</div>
        <ul class="app-nav">
          <li><a routerLink="/dashboard" routerLinkActive="active">Tableau de bord</a></li>
          <li><a routerLink="/factures" routerLinkActive="active">Factures</a></li>
          <li><a routerLink="/devis" routerLinkActive="active">Devis</a></li>
          <li><a routerLink="/proforma" routerLinkActive="active">Factures Pro forma</a></li>
          <li><a routerLink="/recus" routerLinkActive="active">R&eacute;cus de paiement</a></li>
          <li><a routerLink="/bordereaux" routerLinkActive="active">Bordereaux de d&eacute;pense</a></li>
          <li><a routerLink="/journal" routerLinkActive="active">Journal comptable</a></li>
          <li><a routerLink="/exploitation" routerLinkActive="active">Compte d'exploitation</a></li>
          <li><a routerLink="/clients" routerLinkActive="active">Clients</a></li>
          <li *ngIf="auth.isSuperviseur()"><a routerLink="/utilisateurs" routerLinkActive="active">Utilisateurs</a></li>
        </ul>
        <div class="app-user">
          {{ auth.utilisateur()?.nom }}<span class="role">{{ auth.utilisateur()?.role }}</span>
        </div>
        <div style="padding:1rem"><button class="btn btn-danger btn-sm" style="width:100%" (click)="auth.logout()">D&e9;connexion</button></div>
      </nav>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>

    <ng-template #loginTpl>
      <app-login></app-login>
    </ng-template>
  `,
})
export class AppComponent {
  auth = inject(AuthService);
}
