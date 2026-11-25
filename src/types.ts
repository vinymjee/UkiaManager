export type Role = "SUPERVISEUR" | "AGENT";
export type StatutFacture = "BROUILLON" | "ENVOYEE" | "PAYEE" | "ANNULEE";
export type StatutDevis = "BROUILLON" | "ENVOYEE" | "ACCEPTE" | "REFUSE" | "ANNULEE";
export type StatutPiece = "BROUILLON" | "VALIDEE" | "PAYEE" | "ANNULEE";
export type TypeMouvement = "VENTE" | "ACHAT" | "DEPENSE" | "ENCAISSEMENT" | "DECAISSEMENT";

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: Role;
  motDePasseHash: string;
  actif: boolean;
  creeLe: string;
}

export interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  nif?: string;
  actif: boolean;
  creeLe: string;
}

export interface Ligne {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tva: number; // taux en fraction (ex: 0.18)
  total: number;
}

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  clientNom: string;
  date: string;
  echeance?: string;
  lignes: Ligne[];
  ht: number;
  tva: number;
  ttc: number;
  statut: StatutFacture;
  agentId: string;
  agentNom: string;
  payeeLe?: string;
  modePaiement?: string;
}

export interface Devis {
  id: string;
  numero: string;
  clientId: string;
  clientNom: string;
  date: string;
  validite?: string;
  lignes: Ligne[];
  ht: number;
  tva: number;
  ttc: number;
  statut: StatutDevis;
  agentId: string;
  agentNom: string;
}

export interface FactureProForma {
  id: string;
  numero: string;
  clientId: string;
  clientNom: string;
  date: string;
  lignes: Ligne[];
  ht: number;
  tva: number;
  ttc: number;
  agentId: string;
  agentNom: string;
}

export interface RecuPaiement {
  id: string;
  numero: string;
  factureId: string;
  clientId: string;
  montant: number;
  date: string;
  mode: string;
  agentId: string;
}

export interface BordereauDepense {
  id: string;
  numero: string;
  date: string;
  fournisseur: string;
  lignes: Ligne[];
  total: number;
  statut: StatutPiece;
  agentId: string;
  agentNom: string;
}

export interface EcritureComptable {
  id: string;
  date: string;
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
  refType: "FACTURE" | "DEVIS" | "RECU" | "DEPENSE" | "MANUEL";
  refId: string;
}

export interface Parametres {
  tauxTva: number;
  devise: string;
  nomEntreprise: string;
  adresseEntreprise: string;
}

export interface CaisseData {
  utilisateurs: Utilisateur[];
  clients: Client[];
  factures: Facture[];
  devis: Devis[];
  facturesProForma: FactureProForma[];
  recusPaiement: RecuPaiement[];
  bordereauxDepense: BordereauDepense[];
  ecrituresComptables: EcritureComptable[];
  parametres: Parametres;
}

export const DATA_KEY = "caisse_data";

export const EMPTY_DATA: CaisseData = {
  utilisateurs: [],
  clients: [],
  factures: [],
  devis: [],
  facturesProForma: [],
  recusPaiement: [],
  bordereauxDepense: [],
  ecrituresComptables: [],
  parametres: { tauxTva: 0.18, devise: "XOF", nomEntreprise: "Ma Entreprise", adresseEntreprise: "" },
};

export const ALLOWED_COLLECTIONS = [
  "utilisateurs",
  "clients",
  "factures",
  "devis",
  "facturesProForma",
  "recusPaiement",
  "bordereauxDepense",
  "ecrituresComptables",
] as const;

export type Collection = (typeof ALLOWED_COLLECTIONS)[number];
