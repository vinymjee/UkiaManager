import type {
  CaisseData,
  Collection,
  EMPTY_DATA,
  DATA_KEY,
  ALLOWED_COLLECTIONS,
  Role,
  StatutFacture,
  StatutDevis,
  StatutPiece,
  TypeMouvement,
  Utilisateur,
  Client,
  Facture,
  Devis,
  FactureProForma,
  RecuPaiement,
  BordereauDepense,
  EcritureComptable,
  Parametres,
  Ligne,
} from "./types";
import { sha256Hex, signJWT, verifyJWT } from "./auth";

interface Env {
  CAISSE_DB: KVNamespace;
  JWT_SECRET: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}

function erreur(message: string, status = 400): Response {
  return json({ ok: false, erreur: message }, status);
}

function ok(data: unknown): Response {
  return json({ ok: true, data }, 200);
}

function optionsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function urlBase(url: URL): string {
  return url.pathname.replace(/\/$/, "");
}

function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return request.json() as Promise<T>;
  } catch {
    return Promise.resolve(null);
  }
}

async function getData(env: Env): Promise<CaisseData> {
  const valeur = await env.CAISSE_DB.get(DATA_KEY);
  if (!valeur) return structuredClone(EMPTY_DATA);
  try {
    return JSON.parse(valeur) as CaisseData;
  } catch {
    return structuredClone(EMPTY_DATA);
  }
}

async function saveData(env: Env, data: CaisseData): Promise<void> {
  await env.CAISSE_DB.put(DATA_KEY, JSON.stringify(data));
}

function id(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function maintenant(): string {
  return new Date().toISOString();
}

function calculTotaux(lignes: Ligne[]) {
  const ht = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  const tva = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire * l.tva, 0);
  const ttc = ht + tva;
  return { ht, tva, ttc };
}

function nouvelleLigne(l: any, index: number, tauxTvaDefaut: number): Ligne {
  return {
    id: `l-${Date.now()}-${index}`,
    description: l.description || "",
    quantite: Number(l.quantite) || 0,
    prixUnitaire: Number(l.prixUnitaire) || 0,
    tva: Number(l.tva ?? tauxTvaDefaut),
    total: (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0),
  };
}

async function verifieToken(env: Env, request: Request): Promise<{ id: string; role: Role; nom: string } | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;
  if (payload.exp && Date.now() >= payload.exp * 1000) return null;
  return { id: String(payload.sub), role: payload.role as Role, nom: String(payload.nom) };
}

async function exporterComptabilite(data: CaisseData): Promise<EcritureComptable[]> {
  const ecritures: EcritureComptable[] = [...data.ecrituresComptables];

  const factureEcrite = new Set(data.ecrituresComptables.filter((e) => e.refType === "FACTURE").map((e) => e.refId));
  for (const f of data.factures) {
    if (f.statut === "PAYEE" && !factureEcrite.has(f.id) && f.payeeLe) {
      ecritures.push(
        { id: id(), date: f.payeeLe, compte: "411 - Clients", libelle: `Facture ${f.numero} - ${f.clientNom}`, debit: f.ttc, credit: 0, refType: "FACTURE", refId: f.id },
        { id: id(), date: f.payeeLe, compte: "70 - Ventes de biens/services", libelle: `Facture ${f.numero} - ${f.clientNom}`, debit: 0, credit: f.ht, refType: "FACTURE", refId: f.id },
        { id: id(), date: f.payeeLe, compte: "44571 - TVA collectee", libelle: `Facture ${f.numero} - ${f.clientNom}`, debit: 0, credit: f.tva, refType: "FACTURE", refId: f.id },
      );
      factureEcrite.add(f.id);
    }
  }

  const recuEcrite = new Set(data.ecrituresComptables.filter((e) => e.refType === "RECU").map((e) => e.refId));
  for (const r of data.recusPaiement) {
    if (!recuEcrite.has(r.id)) {
      ecritures.push(
        { id: id(), date: r.date, compte: "512 - Banque / Caisse", libelle: `Recu ${r.numero}`, debit: r.montant, credit: 0, refType: "RECU", refId: r.id },
        { id: id(), date: r.date, compte: "411 - Clients", libelle: `Recu ${r.numero}`, debit: 0, credit: r.montant, refType: "RECU", refId: r.id },
      );
      recuEcrite.add(r.id);
    }
  }

  const depenseEcrite = new Set(data.ecrituresComptables.filter((e) => e.refType === "DEPENSE").map((e) => e.refId));
  for (const b of data.bordereauxDepense) {
    if (b.statut === "VALIDEE" && !depenseEcrite.has(b.id)) {
      ecritures.push(
        { id: id(), date: b.date, compte: "6 - Charges d'exploitation", libelle: `Bordereau ${b.numero} - ${b.fournisseur}`, debit: b.total, credit: 0, refType: "DEPENSE", refId: b.id },
        { id: id(), date: b.date, compte: "512 - Banque / Caisse", libelle: `Bordereau ${b.numero} - ${b.fournisseur}`, debit: 0, credit: b.total, refType: "DEPENSE", refId: b.id },
      );
      depenseEcrite.add(b.id);
    }
  }

  return ecritures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const base = urlBase(url);

    if (request.method === "OPTIONS") return optionsPreflight();

    if (base === "/api/health" && request.method === "GET") {
      return ok({ status: "ok", service: "ukia-caisse" });
    }

    // ==================== AUTH ====================
    if (base === "/api/auth/login" && request.method === "POST") {
      const body = await parseBody<{ email: string; motDePasse: string }>(request);
      if (!body?.email || !body?.motDePasse) return erreur("email et mot de passe requis");
      const data = await getData(env);
      const utilisateur = data.utilisateurs.find((u) => u.email === body.email && u.actif);
      if (!utilisateur) return erreur("Identifiants invalides", 401);
      const hash = await sha256Hex(body.motDePasse);
      if (hash !== utilisateur.motDePasseHash) return erreur("Identifiants invalides", 401);
      const token = await signJWT(
        {
          sub: utilisateur.id,
          role: utilisateur.role,
          nom: utilisateur.nom,
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        },
        env.JWT_SECRET,
      );
      return ok({
        token,
        utilisateur: { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
      });
    }

    if (base === "/api/auth/me" && request.method === "GET") {
      const me = await verifieToken(env, request);
      if (!me) return erreur("Non authentifie", 401);
      const data = await getData(env);
      const utilisateur = data.utilisateurs.find((u) => u.id === me.id);
      if (!utilisateur) return erreur("Utilisateur introuvable", 404);
      return ok({ id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role });
    }

    if (base === "/api/auth/init" && request.method === "POST") {
      // Creer le premier superviseur si aucun utilisateur n'existe (premier lancement)
      const body = await parseBody<{ nom: string; email: string; motDePasse: string }>(request);
      const data = await getData(env);
      if (data.utilisateurs.length > 0 && !body?.force) {
        return erreur("Des utilisateurs existent deja", 400);
      }
      if (!body?.nom || !body?.email || !body?.motDePasse) return erreur("nom, email et motDePasse requis");
      if (data.utilisateurs.some((u) => u.email === body.email)) return erreur("Email deja utilise");
      const superviseur: Utilisateur = {
        id: id(),
        nom: body.nom,
        email: body.email,
        role: "SUPERVISEUR",
        motDePasseHash: await sha256Hex(body.motDePasse),
        actif: true,
        creeLe: maintenant(),
      };
      data.utilisateurs.push(superviseur);
      await saveData(env, data);
      return ok({ id: superviseur.id, nom: superviseur.nom, email: superviseur.email, role: superviseur.role });
    }

    // ==================== CRUD GENERIQUE (utilisateurs, clients) ====================
    const collectionMatch = base.match(/^\/api\/([a-zA-Z]+)(?:\/([^/]+))?$/);
    if (!collectionMatch) {
      // routes specifiques ci-dessous
    } else {
      const collection = collectionMatch[1] as Collection;
      const itemId = collectionMatch[2];

      if (!ALLOWED_COLLECTIONS.includes(collection)) {
        return erreur(`Collection inconnue: ${collection}`, 404);
      }

      const me = await verifieToken(env, request);
      if (!me) return erreur("Non authentifie", 401);

      const data = await getData(env);
      let liste: any[] = data[collection];

      if (request.method === "GET") {
        if (itemId) {
          const item = liste.find((x) => x.id === itemId);
          if (!item) return erreur("Introuvable", 404);
          return ok(item);
        }
        return ok(liste);
      }

      // Ecriture : superviseur requis pour utilisateurs ; agent autorise sur clients
      if (collection === "utilisateurs" && me.role !== "SUPERVISEUR") {
        return erreur("Reserve au superviseur", 403);
      }

      if (request.method === "POST") {
        const body = await parseBody<any>(request);
        if (!body) return erreur("Corps invalide");
        const nouvelItem: any = { ...body, id: body.id || id(), creeLe: maintenant() };
        if (collection === "utilisateurs") {
          if (!body.nom || !body.email || !body.motDePasse || !body.role) {
            return erreur("nom, email, motDePasse et role requis");
          }
          if (liste.some((u: any) => u.email === body.email)) return erreur("Email deja utilise");
          nouvelItem.motDePasseHash = await sha256Hex(body.motDePasse);
          delete nouvelItem.motDePasse;
          nouvelItem.role = body.role;
          nouvelItem.actif = body.actif !== false;
        }
        if (collection === "clients") {
          if (!body.nom) return erreur("nom requis");
        }
        liste.push(nouvelItem);
        data[collection] = liste;
        await saveData(env, data);
        return ok(nouvelItem);
      }

      if (request.method === "PUT") {
        if (!itemId) return erreur("ID requis");
        const body = await parseBody<any>(request);
        if (!body) return erreur("Corps invalide");
        const index = liste.findIndex((x) => x.id === itemId);
        if (index === -1) return erreur("Introuvable", 404);
        if (collection === "utilisateurs") {
          if (me.role !== "SUPERVISEUR") return erreur("Reserve au superviseur", 403);
          if (body.email && liste.some((u: any) => u.id !== itemId && u.email === body.email)) {
            return erreur("Email deja utilise");
          }
          if (body.motDePasse) {
            body.motDePasseHash = await sha256Hex(body.motDePasse);
            delete body.motDePasse;
          }
        }
        const misAJour = { ...liste[index], ...body, id: itemId };
        liste[index] = misAJour;
        data[collection] = liste;
        await saveData(env, data);
        return ok(misAJour);
      }

      if (request.method === "DELETE") {
        if (!itemId) return erreur("ID requis");
        if (collection === "utilisateurs" && me.role !== "SUPERVISEUR") {
          return erreur("Reserve au superviseur", 403);
        }
        const index = liste.findIndex((x) => x.id === itemId);
        if (index === -1) return erreur("Introuvable", 404);
        const [supprime] = liste.splice(index, 1);
        data[collection] = liste;
        await saveData(env, data);
        return ok(supprime);
      }

      return erreur("Methode non supportee", 405);
    }

    // ==================== AUTH REQUISE pour le reste ====================
    const me = await verifieToken(env, request);
    if (!me) return erreur("Non authentifie", 401);

    const data = await getData(env);

    // ---------- Factures ----------
    if (base === "/api/factures" && request.method === "GET") {
      return ok(data.factures);
    }
    if (base === "/api/factures" && request.method === "POST") {
      const body = await parseBody<any>(request);
      if (!body || !body.clientId || !Array.isArray(body.lignes)) return erreur("clientId et lignes requis");
      const client = data.clients.find((c) => c.id === body.clientId);
      if (!client) return erreur("Client introuvable");
      const lignes = body.lignes.map((l: any, i: number) => nouvelleLigne(l, i, data.parametres.tauxTva));
      const { ht, tva, ttc } = calculTotaux(lignes);
      const facture: Facture = {
        id: id(),
        numero: `FAC-${Date.now()}`,
        clientId: client.id,
        clientNom: client.nom,
        date: body.date || maintenant(),
        echeance: body.echeance,
        lignes,
        ht,
        tva,
        ttc,
        statut: "BROUILLON",
        agentId: me.id,
        agentNom: me.nom,
      };
      data.factures.push(facture);
      await saveData(env, data);
      return ok(facture);
    }
    if (base.match(/^\/api\/factures\/([^/]+)\/(envoyer|payer|annuler)$/) && request.method === "POST") {
      const m = base.match(/^\/api\/factures\/([^/]+)\/(envoyer|payer|annuler)$/)!;
      const idFacture = m[1];
      const action = m[2];
      const index = data.factures.findIndex((f) => f.id === idFacture);
      if (index === -1) return erreur("Facture introuvable", 404);
      const facture = data.factures[index];
      if (action === "envoyer") {
        facture.statut = "ENVOYEE";
      } else if (action === "payer") {
        const body = await parseBody<{ mode: string; montant?: number }>(request) || {};
        facture.statut = "PAYEE";
        facture.payeeLe = maintenant();
        facture.modePaiement = body.mode || "especes";
      } else if (action === "annuler") {
        if (me.role !== "SUPERVISEUR") return erreur("Seul le superviseur peut annuler un paiement", 403);
        facture.statut = "ANNULEE";
        facture.payeeLe = undefined;
        facture.modePaiement = undefined;
      }
      await saveData(env, data);
      return ok(facture);
    }

    // ---------- Devis ----------
    if (base === "/api/devis" && request.method === "GET") return ok(data.devis);
    if (base === "/api/devis" && request.method === "POST") {
      const body = await parseBody<any>(request);
      if (!body || !body.clientId || !Array.isArray(body.lignes)) return erreur("clientId et lignes requis");
      const client = data.clients.find((c) => c.id === body.clientId);
      if (!client) return erreur("Client introuvable");
      const lignes = body.lignes.map((l: any, i: number) => nouvelleLigne(l, i, data.parametres.tauxTva));
      const { ht, tva, ttc } = calculTotaux(lignes);
      const devis: Devis = {
        id: id(),
        numero: `DEV-${Date.now()}`,
        clientId: client.id,
        clientNom: client.nom,
        date: body.date || maintenant(),
        validite: body.validite,
        lignes,
        ht, tva, ttc,
        statut: "BROUILLON",
        agentId: me.id,
        agentNom: me.nom,
      };
      data.devis.push(devis);
      await saveData(env, data);
      return ok(devis);
    }
    if (base.match(/^\/api\/devis\/([^/]+)\/(accepter|refuser|annuler)$/) && request.method === "POST") {
      const m = base.match(/^\/api\/devis\/([^/]+)\/(accepter|refuser|annuler)$/)!;
      const index = data.devis.findIndex((d) => d.id === m[1]);
      if (index === -1) return erreur("Devis introuvable", 404);
      data.devis[index].statut = m[2] as StatutDevis;
      await saveData(env, data);
      return ok(data.devis[index]);
    }

    // ---------- Factures pro forma ----------
    if (base === "/api/factures-proforma" && request.method === "GET") return ok(data.facturesProForma);
    if (base === "/api/factures-proforma" && request.method === "POST") {
      const body = await parseBody<any>(request);
      if (!body || !body.clientId || !Array.isArray(body.lignes)) return erreur("clientId et lignes requis");
      const client = data.clients.find((c) => c.id === body.clientId);
      if (!client) return erreur("Client introuvable");
      const lignes = body.lignes.map((l: any, i: number) => nouvelleLigne(l, i, data.parametres.tauxTva));
      const { ht, tva, ttc } = calculTotaux(lignes);
      const pf: FactureProForma = {
        id: id(),
        numero: `PRO-${Date.now()}`,
        clientId: client.id,
        clientNom: client.nom,
        date: body.date || maintenant(),
        lignes, ht, tva, ttc,
        agentId: me.id,
        agentNom: me.nom,
      };
      data.facturesProForma.push(pf);
      await saveData(env, data);
      return ok(pf);
    }

    // ---------- Recus de paiement ----------
    if (base === "/api/recus" && request.method === "GET") return ok(data.recusPaiement);
    if (base === "/api/recus" && request.method === "POST") {
      const body = await parseBody<any>(request);
      if (!body || !body.clientId || !body.montant || !body.mode) return erreur("clientId, montant et mode requis");
      const client = data.clients.find((c) => c.id === body.clientId);
      if (!client) return erreur("Client introuvable");
      const recu: RecuPaiement = {
        id: id(),
        numero: `REC-${Date.now()}`,
        factureId: body.factureId,
        clientId: client.id,
        clientNom: client.nom,
        montant: Number(body.montant),
        date: body.date || maintenant(),
        mode: body.mode,
        agentId: me.id,
      };
      data.recusPaiement.push(recu);
      await saveData(env, data);
      return ok(recu);
    }

    // ---------- Bordereaux de depense ----------
    if (base === "/api/bordereaux" && request.method === "GET") return ok(data.bordereauxDepense);
    if (base === "/api/bordereaux" && request.method === "POST") {
      const body = await parseBody<any>(request);
      if (!body || !body.fournisseur || !Array.isArray(body.lignes)) return erreur("fournisseur et lignes requis");
      const lignes = body.lignes.map((l: any, i: number) => nouvelleLigne(l, i, data.parametres.tauxTva));
      const total = lignes.reduce((s, l) => s + l.total, 0);
      const bord: BordereauDepense = {
        id: id(),
        numero: `BDEP-${Date.now()}`,
        date: body.date || maintenant(),
        fournisseur: body.fournisseur,
        lignes,
        total,
        statut: "BROUILLON",
        agentId: me.id,
        agentNom: me.nom,
      };
      data.bordereauxDepense.push(bord);
      await saveData(env, data);
      return ok(bord);
    }
    if (base.match(/^\/api\/bordereaux\/([^/]+)\/(valider|annuler)$/) && request.method === "POST") {
      const m = base.match(/^\/api\/bordereaux\/([^/]+)\/(valider|annuler)$/)!;
      const index = data.bordereauxDepense.findIndex((b) => b.id === m[1]);
      if (index === -1) return erreur("Bordereau introuvable", 404);
      const bord = data.bordereauxDepense[index];
      bord.statut = m[2] === "valider" ? "VALIDEE" : "ANNULEE";
      await saveData(env, data);
      return ok(bord);
    }

    // ---------- Journal comptable ----------
    if (base === "/api/journal" && request.method === "GET") {
      const ecritures = await exporterComptabilite(data);
      return ok(ecritures);
    }
    if (base === "/api/journal" && request.method === "POST") {
      const body = await parseBody<any>(request);
      if (!body || !body.compte || !body.libelle || body.debit == null || body.credit == null) {
        return erreur("compte, libelle, debit et credit requis");
      }
      const ecriture: EcritureComptable = {
        id: id(),
        date: body.date || maintenant(),
        compte: body.compte,
        libelle: body.libelle,
        debit: Number(body.debit),
        credit: Number(body.credit),
        refType: "MANUEL",
        refId: body.refId || "",
      };
      data.ecrituresComptables.push(ecriture);
      await saveData(env, data);
      return ok(ecriture);
    }

    // ---------- Compte d'exploitation ----------
    if (base === "/api/compte-exploitation" && request.method === "GET") {
      const ecritures = await exporterComptabilite(data);
      const dateDebut = url.searchParams.get("debut");
      const dateFin = url.searchParams.get("fin");
      let filtrees = ecritures;
      if (dateDebut) filtrees = filtrees.filter((e) => e.date >= dateDebut);
      if (dateFin) filtrees = filtrees.filter((e) => e.date <= dateFin);

      const produits = filtrees.filter((e) => e.compte.startsWith("70")).reduce((s, e) => s + e.credit - e.debit, 0);
      const charges = filtrees.filter((e) => e.compte.startsWith("6")).reduce((s, e) => s + e.debit - e.credit, 0);
      const tvaCollectee = filtrees.filter((e) => e.compte.startsWith("44571")).reduce((s, e) => s + e.credit - e.debit, 0);
      const resultat = produits - charges;

      return ok({
        periode: { debut: dateDebut ?? null, fin: dateFin ?? null },
        produits,
        charges,
        tvaCollectee,
        resultat,
        ecritures: filtrees,
      });
    }

    // ---------- Parametres ----------
    if (base === "/api/parametres" && request.method === "GET") return ok(data.parametres);
    if (base === "/api/parametres" && request.method === "PUT") {
      if (me.role !== "SUPERVISEUR") return erreur("Reserve au superviseur", 403);
      const body = await parseBody<any>(request);
      data.parametres = { ...data.parametres, ...body };
      await saveData(env, data);
      return ok(data.parametres);
    }

    return erreur("Route non trouvee", 404);
  },
} satisfies ExportedHandler<Env>;
