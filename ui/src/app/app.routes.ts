import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/login/login.component";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { FacturesComponent } from "./pages/factures/factures.component";
import { DevisComponent } from "./pages/devis/devis.component";
import { ProformaComponent } from "./pages/proforma/proforma.component";
import { RecusComponent } from "./pages/recus/recus.component";
import { CaisseComponent } from "./pages/caisse/caisse.component";
import { HistoriqueComponent } from "./pages/historique/historique.component";
import { BordereauxComponent } from "./pages/bordereaux/bordereaux.component";
import { JournalComponent } from "./pages/journal/journal.component";
import { ExploitationComponent } from "./pages/exploitation/exploitation.component";
import { ClientsComponent } from "./pages/clients/clients.component";
import { UtilisateursComponent } from "./pages/utilisateurs/utilisateurs.component";
import { authGuard } from "./guards/auth.guard";
import { superviseurGuard } from "./guards/superviseur.guard";

export const routes: Routes = [
  { path: "login", component: LoginComponent },
  { path: "dashboard", component: DashboardComponent, canActivate: [authGuard] },
  { path: "factures", component: FacturesComponent, canActivate: [authGuard] },
  { path: "devis", component: DevisComponent, canActivate: [authGuard] },
  { path: "proforma", component: ProformaComponent, canActivate: [authGuard] },
  { path: "recus", component: RecusComponent, canActivate: [authGuard] },
  { path: "caisse", component: CaisseComponent, canActivate: [authGuard] },
  { path: "historique", component: HistoriqueComponent, canActivate: [authGuard] },
  { path: "bordereaux", component: BordereauxComponent, canActivate: [authGuard] },
  { path: "journal", component: JournalComponent, canActivate: [authGuard] },
  { path: "exploitation", component: ExploitationComponent, canActivate: [authGuard] },
  { path: "clients", component: ClientsComponent, canActivate: [authGuard] },
  { path: "utilisateurs", component: UtilisateursComponent, canActivate: [authGuard, superviseurGuard] },
  { path: "", redirectTo: "/dashboard", pathMatch: "full" },
  { path: "**", redirectTo: "/dashboard" },
];
