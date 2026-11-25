export type Role = "SUPERVISEUR" | "AGENT";
export type StatutFacture = "BROUILLON" | "ENVOYEE" | "PAYEE" | "ANNULEE";
export type StatutDevis = "BROUILLON" | "ENVOYEE" | "ACCEPTE" | "REFUSE" | "ANNULEE";

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: Role;
  actif: boolean;
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
}

export interface Ligne {
  id?: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tva: number;
  total?: number;
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
  clientNom: string;
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
  statut: string;
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
  refType: string;
  refId: string;
}

export interface Parametres {
  tauxTva: number;
  devise: string;
  nomEntreprise: string;
  adresseEntreprise: string;
}

export interface CompteExploitation {
  periode: { debut: string | null; fin: string | null };
  produits: number;
  charges: number;
  tvaCollectee: number;
  resultat: number;
  ecritures: EcritureComptable[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  erreur?: string;
}
