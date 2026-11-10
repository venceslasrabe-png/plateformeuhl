export type Cycle = 'Licence' | 'Master' | 'Doctorat';
export type Semester = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';

export interface Student {
  id: string;
  mat: string; // Matricule UHL-2026-0001
  nom: string;
  prenom: string;
  naiss: string; // YYYY-MM-DD
  lieu: string;
  sexe: 'Masculin' | 'Féminin';
  nat: string;
  tel: string;
  bp: string;
  email: string;
  adr: string;
  ville: string;
  photo?: string; // base64 data url
  // Scolarité
  cyc: string; // LN, LP, Master, Doctorat
  annee: string;
  parcours: string; // parcours ID / Option ID
  fil: string; // Filière
  niveau: string; // L1, L2, L3, M1, M2, D1, D2, D3
  classe?: string; // ex. L1-INFO-A
  dnv: string;
  ddip: string;
  dan: string;
  etab: string;
  dossier: 'Oui' | 'Non' | 'Incomplet';
  // Tuteurs
  pere: string;
  telpere: string;
  fpere: string;
  mere: string;
  telmere: string;
  fmere: string;
  adrp: string;
  nfr: number;
  nso: number;
  tut: string;
  ttut: string;
  ftut: string;
  atut: string;
  ltut: string;
  modp: 'Mensuel' | 'Semestriel' | 'Annuel';
  // Inscription financière
  resp: string;
  dins: string;
  ech: number;
  modr: 'Espèces' | 'Mobile money' | 'Virement' | 'Chèque';
  cout: number;
  typr: 'Inscription' | 'Réinscription' | 'Normal';
  stat: 'Normal' | 'Boursier' | 'Réduction';
}

export interface Filiere {
  id: string;
  code: string; // ex. "INFO", "DROIT", "SECOG", "COMM"
  nom: string; // ex. "Informatique & Sciences Numériques"
  domaine: string; // ex. "Sciences et Technologies"
  chefDept?: string; // ex. "Prof. Jean-Claude Mavoungou"
  description?: string;
}

export interface OptionItem {
  id: string;
  code: string; // ex. "IGR", "GLSI", "DAF"
  nom: string; // ex. "Informatique de Gestion & Réseaux"
  filiereId: string; // Référence à Filière
  cycle: Cycle;
  description?: string;
}

export interface NiveauItem {
  id: string;
  code: string; // "L1", "L2", "L3", "M1", "M2", "D1", "D2", "D3"
  intitule: string; // ex. "Licence 1ère Année (S1-S2)"
  cycle: Cycle;
  ordre: number; // 1, 2, 3...
  creditsRequis: number; // 60, 120, 180...
}

export interface ClasseItem {
  id: string;
  code: string; // ex. "L1-INFO-A", "L2-INFO", "M1-DAF"
  nom: string; // ex. "Licence 1 Informatique - Section A"
  filiereId: string; // Code ou ID de filière
  optionId?: string; // Code ou ID d'option / parcours
  niveau: string; // "L1", "L2", "L3", "M1", "M2"
  salle?: string; // ex. "Amphithéâtre Nelson Mandela"
  delegue?: string; // Nom de l'étudiant délégué
  capacite?: number; // Capacité max de la classe
}

export interface Parcours {
  id: string;
  nom: string;
  dom: string;
  cycle: Cycle;
}

export interface UE {
  id: string;
  code: string;
  nom: string;
  parcours: string;
  sem: Semester;
  cred: number; // ECTS
}

export interface EC {
  id: string;
  code: string;
  nom: string;
  ue: string;
  coef: number;
  vh: number; // Volume horaire
  ens: string; // Teacher ID
}

export interface TimetableEntry {
  id: string;
  jour: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  debut: string; // "08:00"
  fin: string; // "10:00"
  ec: string;
  salle: string;
}

export interface Teacher {
  id: string;
  nom: string;
  statut: 'Permanent' | 'Vacataire' | 'Administratif';
  grade: string;
  tel: string;
  email: string;
}

export interface Payment {
  id: string;
  etu: string;
  montant: number;
  mode: 'Espèces' | 'Mobile money' | 'Virement' | 'Chèque';
  date: string;
  caissier: string;
  ts?: number;
}

export interface Exam {
  id: string;
  ec: string;
  session: 'Normale' | 'Rattrapage';
  date: string;
  salle: string;
}

export interface Announcement {
  id: string;
  titre: string;
  cible: 'Tous' | 'Étudiants' | 'Enseignants' | 'Administration' | 'Caisse';
  msg: string;
  etu?: string;
  ts?: number;
}

export interface GradeEntry {
  cc?: number | string;
  ex?: number | string;
  rt?: number | string;
}

export interface SurveillanceEntry {
  id: string;
  etu: string;
  in: number;
  out: number | null;
}

export interface Mission {
  id: string;
  titre: string;
  desc: string;
  to: string; // "u:USER_ID" or "r:ROLE_NAME"
  priorite: 'Normale' | 'Haute' | 'Urgente';
  delai: string;
  statut: 'À faire' | 'En cours' | 'Terminée';
  ts?: number;
  par?: string;
}

export interface AppParams {
  ann: string; // e.g. "2026-2027"
  seuil: number; // e.g. 10
  cc: number; // e.g. 40 (%)
  fees: {
    Licence: number;
    Master: number;
    Doctorat: number;
  };
  adr?: string;
  tel?: string;
  mail?: string;
}

export type RoleType =
  | 'admin'
  | 'scolarite'
  | 'caisse'
  | 'enseignant'
  | 'surveillant'
  | 'direction'
  | 'president';

export interface UserRoleRecord {
  role: RoleType;
  mission?: string;
  nom?: string;
}

export interface UserRequestRecord {
  id: string;
  nom: string;
  fonction: RoleType;
  msg?: string;
  date?: number;
}

export interface AppData {
  students: Student[];
  parcours: Parcours[];
  filieres: Filiere[];
  options: OptionItem[];
  niveaux: NiveauItem[];
  classes: ClasseItem[];
  ue: UE[];
  ec: EC[];
  edt: TimetableEntry[];
  teachers: Teacher[];
  pay: Payment[];
  exams: Exam[];
  ann: Announcement[];
  pres: Record<string, Record<string, number>>; // "ecId|date" -> { studentId: 1 | 0 }
  notes: Record<string, GradeEntry>; // "ecId|studentId" -> { cc, ex, rt }
  surv: SurveillanceEntry[];
  missions: Mission[];
  seen: number;
  seenC?: number;
  seenM?: number;
  p: AppParams;
}

export interface SemesterResult {
  rows: Array<[UE, number | null]>;
  moy: number | null;
  cr: number;
  tot: number;
  dec: 'Admis' | 'Ajourné' | 'Rattrapage' | 'Incomplet' | '—';
}
