export type Role = "SUPERVISEUR" | "AGENT";
export type StatutFacture = "BROUILLON" | "ENVOYEE" | "PAYEE" | "ANNULEE";
export type StatutDevis = "BROUILLON" | "ENVOYEE" | "ACCEPTE" | "REFUSE" | "ANNULEE";

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: Role;
  actif: boolean;
  droits?: string[];
  titre?: string;
  cachet?: string;
}

export interface Client {
  id: string;
  nom: string;
  matricule?: string;
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
  montantPaye?: number;
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

export type TypeOperationCaisse = "ENCAISSEMENT" | "DECAISSEMENT" | "TRANSFERT_ENTRANT" | "TRANSFERT_SORTANT";

export interface Caisse {
  userId: string;
  solde: number;
  nom?: string;
  creeLe: string;
  majLe: string;
}

export interface LignePaiement {
  description: string;
  montant: number;
}

export interface OperationCaisse {
  id: string;
  numero: string;
  type: TypeOperationCaisse;
  montant: number;
  libelle: string;
  source: string;
  refId: string;
  userId: string;
  agentId: string;
  agentNom: string;
  date: string;
  creeLe: string;
  lignesPaiement?: LignePaiement[];
}

export interface TransfertCaisse {
  id: string;
  numero: string;
  expediteurId: string;
  expediteurNom: string;
  destinataireId: string;
  destinataireNom: string;
  montant: number;
  motif: string;
  statut: "EN_ATTENTE" | "CONFIRME" | "REJETE" | "ANNULE";
  creeLe: string;
  confirmeLe?: string;
}

export const TOUS_LES_DROITS: string[] = [
  "FACTURES_VOIR", "FACTURES_CREER", "FACTURES_ENVOYER", "FACTURES_PAYER", "FACTURES_ANNULER", "FACTURES_IMPRIMER",
  "DEVIS_VOIR", "DEVIS_CREER", "DEVIS_ENVOYER", "DEVIS_ACCEPTER", "DEVIS_REFUSER", "DEVIS_ANNULER", "DEVIS_IMPRIMER",
  "PROFORMA_VOIR", "PROFORMA_CREER", "PROFORMA_IMPRIMER",
  "BORDEREAUX_VOIR", "BORDEREAUX_CREER", "BORDEREAUX_VALIDER", "BORDEREAUX_ANNULER", "BORDEREAUX_IMPRIMER",
  "CAISSE_VOIR", "CAISSE_ENCAISSEMENT", "CAISSE_DECAISSEMENT",
  "TRANSFERTS_VOIR", "TRANSFERTS_CREER", "TRANSFERTS_CONFIRMER",
  "REÇUS_VOIR", "REÇUS_IMPRIMER",
  "JOURNAL_VOIR", "JOURNAL_CREER",
  "EXPLOITATION_VOIR",
  "CLIENTS_VOIR", "CLIENTS_CREER", "CLIENTS_MODIFIER", "CLIENTS_SUPPRIMER",
  "UTILISATEURS_VOIR", "UTILISATEURS_GERER",
  "PARAMETRES_MODIFIER",
];

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  erreur?: string;
}
