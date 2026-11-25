import { Injectable, signal, computed, effect } from "@angular/core";
import { Router } from "@angular/router";
import { Role, Utilisateur } from "../models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class AuthService {
  private token = signal<string | null>(null);
  private utilisateurSignal = signal<Utilisateur | null>(null);

  readonly utilisateur = this.utilisateurSignal;
  readonly isAuthenticated = computed(() => !!this.token() && !!this.utilisateurSignal());
  readonly isSuperviseur = computed(() => this.utilisateurSignal()?.role === "SUPERVISEUR");
  readonly isAgent = computed(() => this.utilisateurSignal()?.role === "AGENT");

  constructor(private api: ApiService, private router: Router) {
    const saved = localStorage.getItem("ukia_token");
    const savedUser = localStorage.getItem("ukia_user");
    if (saved) this.token.set(saved);
    if (savedUser) {
      try { this.utilisateurSignal.set(JSON.parse(savedUser)); } catch {}
    }
    effect(() => {
      const t = this.token();
      const u = this.utilisateurSignal();
      if (t) localStorage.setItem("ukia_token", t); else localStorage.removeItem("ukia_token");
      if (u) localStorage.setItem("ukia_user", JSON.stringify(u)); else localStorage.removeItem("ukia_user");
    });
  }

  async login(email: string, motDePasse: string): Promise<boolean> {
    const res = await this.api.post<{ token: string; utilisateur: Utilisateur }>("/auth/login", { email, motDePasse });
    if (res.ok && res.data) {
      this.token.set(res.data.token);
      this.utilisateurSignal.set(res.data.utilisateur);
      return true;
    }
    return false;
  }

  async initSuperviseur(nom: string, email: string, motDePasse: string): Promise<boolean> {
    const res = await this.api.post<{ utilisateur: Utilisateur }>("/auth/init", { nom, email, motDePasse, force: true });
    if (res.ok && res.data) {
      this.utilisateurSignal.set(res.data.utilisateur);
      return true;
    }
    return false;
  }

  logout(): void {
    this.token.set(null);
    this.utilisateurSignal.set(null);
    this.router.navigateByUrl("/login");
  }

  getToken(): string | null {
    return this.token();
  }
}
