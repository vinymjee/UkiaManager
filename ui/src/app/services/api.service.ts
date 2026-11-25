import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { environment } from "../../environments";

const API = (environment as any).apiUrl || "";

@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private async headers(): Promise<HeadersInit> {
    const h: HeadersInit = { "Content-Type": "application/json" };
    const token = this.auth.getToken();
    if (token) h["Authorization"] = "Bearer " + token;
    return h;
  }

  private base(path: string): string {
    return API + path;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<{ ok: boolean; data?: T; erreur?: string }> {
    let url = this.base(path);
    if (params) {
      const qs = new URLSearchParams(params);
      url += (url.includes("?") ? "&" : "?") + qs.toString();
    }
    const r = await fetch(url, { method: "GET", headers: await this.headers() });
    return this.json(r);
  }

  async post<T>(path: string, body?: any): Promise<{ ok: boolean; data?: T; erreur?: string }> {
    const r = await fetch(this.base(path), {
      method: "POST",
      headers: await this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.json(r);
  }

  async put<T>(path: string, body?: any): Promise<{ ok: boolean; data?: T; erreur?: string }> {
    const r = await fetch(this.base(path), {
      method: "PUT",
      headers: await this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.json(r);
  }

  async del(path: string): Promise<{ ok: boolean; data?: any; erreur?: string }> {
    const r = await fetch(this.base(path), { method: "DELETE", headers: await this.headers() });
    return this.json(r);
  }

  private async json(r: Response): Promise<{ ok: boolean; data?: any; erreur?: string }> {
    let data: any = null;
    try { data = await r.json(); } catch {}
    if (!r.ok) return { ok: false, erreur: data?.erreur || r.statusText, data };
    return { ok: true, data: data?.data ?? data, erreur: data?.erreur };
  }
}
