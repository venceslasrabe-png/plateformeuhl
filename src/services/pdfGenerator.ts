import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { AppData, Payment, Student } from '../types';
import {
  calcBalance,
  calcEcAverage,
  calcFee,
  calcSemesterResult,
  formatFCFA,
  getMention,
  getStudentRank,
} from './storage';
import { UNIVERSITY_LOGO, UNIVERSITY_LOGO_FALLBACK, UNIVERSITY_MOTTO } from '../constants/assets';

// Helper to trigger download
const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1200);
};

// University Congolese theme colors
const BL = [31, 95, 174]; // #1f5fae Royal Blue
const GR = [63, 154, 77]; // #3f9a4d Forest Green
const LOGO_RATIO = 1199 / 1312; // 0.91387

// In-memory cached Data URL for jsPDF
let cachedLogoDataUrl: string = '';

export const ensureLogoLoaded = (): Promise<string> => {
  if (cachedLogoDataUrl) return Promise.resolve(cachedLogoDataUrl);
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(UNIVERSITY_LOGO_FALLBACK);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 731;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          cachedLogoDataUrl = canvas.toDataURL('image/png');
          resolve(cachedLogoDataUrl);
          return;
        }
      } catch (e) {
        console.warn('Canvas export of official emblem failed, using fallback', e);
      }
      resolve(UNIVERSITY_LOGO_FALLBACK);
    };
    img.onerror = () => {
      resolve(UNIVERSITY_LOGO_FALLBACK);
    };
    img.src = UNIVERSITY_LOGO;
  });
};

// Immediate background preloading
if (typeof window !== 'undefined') {
  ensureLogoLoaded().catch(() => {});
}

const addLogo = async (doc: jsPDF, x: number, y: number, r: number) => {
  try {
    const dataUrl = await ensureLogoLoaded();
    doc.addImage(dataUrl, 'PNG', x - r, y - r * LOGO_RATIO, 2 * r, 2 * r * LOGO_RATIO);
  } catch (e) {
    console.warn('Could not add logo to PDF', e);
  }
};

const drawCardWaves = (doc: jsPDF, offset: number, color: number[]) => {
  const points: [number, number][] = [];
  for (let x = 0; x <= 54; x += 3) {
    points.push([x, 77 + offset + 2.2 * Math.sin((x / 54) * 4 + 0.5)]);
  }
  const lines: [number, number][] = points
    .slice(1)
    .map((q, i) => [q[0] - points[i][0], q[1] - points[i][1]]);
  lines.push([0, 85.6 - points[points.length - 1][1]], [-54, 0]);

  doc.setFillColor(color[0], color[1], color[2]);
  doc.lines(lines, points[0][0], points[0][1], [1, 1], 'F', true);
};

/**
 * 1. PVC Student Card (CR80 ID-1 standard format: 54mm x 85.6mm)
 */
export const downloadStudentCardPdf = async (student: Student, data: AppData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [54, 85.6],
    orientation: 'portrait',
  });

  const p = data.parcours.find((x) => x.id === student.parcours);
  const filiereName = student.fil || p?.dom || 'Sciences & Technologies';
  const optionName = p?.nom || 'Formation Supérieure LMD';

  // ==========================================
  // PAGE 1: RECTO (FACE AVANT)
  // ==========================================
  // Institutional Header
  await addLogo(doc, 7, 7, 4.2);
  doc.setTextColor(15, 59, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('UNIVERSITÉ HENRI LOPES (UHL)', 13, 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.2);
  doc.setTextColor(90, 90, 90);
  doc.text('Pointe-Noire · République du Congo', 13, 9.5);

  // Document Title Banner (Centered across 54mm card)
  doc.setFillColor(232, 185, 35); // UHL Gold
  doc.roundedRect(3, 12, 48, 4.8, 1, 1, 'F');
  doc.setTextColor(15, 20, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('CARTE D’ÉTUDIANT', 27, 15.5, { align: 'center' });

  // Student Photo (3.5mm, 18.5mm, w=20, h=25)
  if (student.photo) {
    try {
      doc.addImage(student.photo, 'JPEG', 3.5, 18.5, 20, 25);
    } catch {
      doc.setFillColor(235, 240, 245);
      doc.roundedRect(3.5, 18.5, 20, 25, 1.5, 1.5, 'F');
    }
  } else {
    doc.setFillColor(235, 240, 245);
    doc.roundedRect(3.5, 18.5, 20, 25, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 59, 46);
    const initials = (student.prenom[0] || 'E') + (student.nom[0] || 'H');
    doc.text(initials, 13.5, 33, { align: 'center' });
  }

  // Right Column: Academic Year, Level, Matricule (next to photo)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(100, 100, 100);
  doc.text('ANNÉE ACADÉMIQUE', 25.5, 20.2);
  doc.setFillColor(15, 59, 46);
  doc.roundedRect(25.5, 21.2, 25, 4.2, 1.2, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(data.p.ann, 38, 24.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(100, 100, 100);
  doc.text('CYCLE & NIVEAU', 25.5, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(15, 59, 46);
  doc.text(`${p?.cycle || 'Licence'} · ${student.niveau}`, 25.5, 31.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(100, 100, 100);
  doc.text('MATRICULE ÉTUDIANT', 25.5, 35.5);
  doc.setFillColor(15, 59, 46);
  doc.roundedRect(25.5, 36.5, 25, 4.5, 1.2, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.text(student.mat, 38, 39.8, { align: 'center' });

  // Identity Card Section: Full Width, 100% Unobstructed Name Visibility
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(215, 222, 230);
  doc.roundedRect(3.5, 44.5, 47, 18.5, 1.2, 1.2, 'FD');

  // Name Label & Value (Full width, zero overlap from QR code)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.8);
  doc.setTextColor(100, 100, 100);
  doc.text('NOM(S) ET PRÉNOM(S) :', 5.5, 48);
  doc.setTextColor(15, 59, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  const fullName = `${student.nom} ${student.prenom}`.toUpperCase();
  doc.text(fullName, 5.5, 52, { maxWidth: 43 });

  // Filière & Option on Recto
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(100, 100, 100);
  doc.text('FILIÈRE :', 5.5, 56.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(30, 30, 30);
  doc.text(filiereName, 16.5, 56.5, { maxWidth: 31 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(100, 100, 100);
  doc.text('OPTION :', 5.5, 60.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(15, 59, 46);
  doc.text(optionName, 16.5, 60.5, { maxWidth: 31 });

  // Bottom Control & Security Section: QR Code placed at bottom right, completely away from name
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(3.5, 63.8, 29.5, 15.5, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.2);
  doc.setTextColor(15, 59, 46);
  doc.text('ID ÉTUDIANT CERTIFIÉ', 5.5, 67.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.4);
  doc.setTextColor(70, 80, 90);
  doc.text('Contrôle guérite & présences', 5.5, 71.2);
  doc.text('Propriété officielle UHL', 5.5, 74.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(15, 59, 46);
  doc.text(student.mat, 5.5, 77.8);

  // QR Code Box (Bottom Right: x=34.5, y=63.8, w=16, h=15.5) - strictly square, pure white background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 215, 210);
  doc.setLineWidth(0.3);
  doc.roundedRect(34.5, 63.8, 16, 15.5, 1.2, 1.2, 'FD');
  try {
    const qrDataUrl = await QRCode.toDataURL(student.mat, {
      margin: 1,
      width: 160,
      color: { dark: '#0f3b2e', light: '#ffffff' },
    });
    // Centered 13.5 x 13.5 mm square QR code (ends at y=78.3mm, safely above footer)
    doc.addImage(qrDataUrl, 'PNG', 35.75, 64.8, 13.5, 13.5);
  } catch (e) {
    console.warn('QR Code generation failed', e);
  }

  // Recto Reduced Slim Footer Ribbon: Yellow stripe (0.7mm) + Green band (4.1mm)
  // Perfectly positioned at the very bottom (y=80.8mm to 85.6mm) without ever touching or altering QR code shape
  doc.setFillColor(232, 185, 35); // Gold Accent Ribbon
  doc.rect(0, 80.8, 54, 0.7, 'F');

  doc.setFillColor(15, 59, 46); // Deep Green UHL Band
  doc.rect(0, 81.5, 54, 4.1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.0);
  doc.text('RÉPUBLIQUE DU CONGO · UHL', 27, 84.4, { align: 'center' });

  // ==========================================
  // PAGE 2: VERSO (FACE ARRIÈRE)
  // Contient: Téléphone, Email, Filière, Option
  // ==========================================
  doc.addPage([54, 85.6], 'portrait');

  // Verso Header
  doc.setFillColor(15, 59, 46);
  doc.rect(0, 0, 54, 12, 'F');
  await addLogo(doc, 6.5, 6, 3.8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('UNIVERSITÉ HENRI LOPES (UHL)', 12, 5.5);
  doc.setFontSize(4.2);
  doc.setTextColor(232, 185, 35);
  doc.text('AUTHENTIFICATION & CONTACTS ÉTUDIANT', 12, 9);

  // Box 1: Coordonnées Étudiant (Téléphone & Email)
  doc.setDrawColor(215, 220, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(3.5, 14, 47, 16, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(110, 110, 110);
  doc.text('NUMÉRO DE TÉLÉPHONE :', 5.5, 17.5);
  doc.setFontSize(5.6);
  doc.setTextColor(15, 59, 46);
  doc.text(student.tel || '+242 06 000 00 00', 5.5, 21.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(110, 110, 110);
  doc.text('ADRESSE EMAIL :', 5.5, 25);
  doc.setFontSize(5);
  doc.setTextColor(20, 20, 20);
  const emailStr = student.email || `${student.prenom.toLowerCase()}.${student.nom.toLowerCase()}@universite-henrilopes.cg`;
  doc.text(emailStr, 5.5, 28.5, { maxWidth: 43 });

  // Box 2: Filière & Option (Verso)
  doc.setFillColor(243, 249, 246);
  doc.setDrawColor(180, 215, 200);
  doc.roundedRect(3.5, 31.5, 47, 17, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(15, 59, 46);
  doc.text('FILIÈRE ACADÉMIQUE :', 5.5, 35.5);
  doc.setFontSize(5.4);
  doc.setTextColor(30, 30, 30);
  doc.text(filiereName, 5.5, 39, { maxWidth: 43 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(15, 59, 46);
  doc.text('OPTION DE SPÉCIALITÉ :', 5.5, 43);
  doc.setFontSize(5.4);
  doc.setTextColor(15, 59, 46);
  doc.text(optionName, 5.5, 46.5, { maxWidth: 43 });

  // Civil & Emergency
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4);
  doc.setTextColor(90, 90, 90);
  doc.text(`Né(e) le : ${student.naiss || '2004-01-01'} à ${student.lieu || 'Pointe-Noire'}`, 3.5, 51.5);
  if (student.tut) {
    doc.text(`Contact d'urgence : ${student.tut} (${student.ttut || student.tel})`, 3.5, 55);
  }

  // Regulatory Notice
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(3.5, 57.5, 47, 9.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.6);
  doc.setTextColor(80, 80, 80);
  doc.text('AVIS RÉGLEMENTAIRE & SÉCURITÉ', 27, 60.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.3);
  doc.setTextColor(110, 110, 110);
  doc.text('Carte strictement personnelle. Obligatoire sur les campus et examens.', 27, 63, { align: 'center' });
  doc.text('En cas de perte, rapporter à la Scolarité : BP 1254 Pointe-Noire.', 27, 65.5, { align: 'center' });

  // Signature Block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4);
  doc.setTextColor(80, 80, 80);
  doc.text('Direction de la Scolarité', 4.5, 70.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 59, 46);
  doc.text('Dr. M. Mavoungou', 4.5, 73.5);

  doc.setFillColor(232, 185, 35);
  doc.roundedRect(34, 69.5, 16.5, 5, 0.8, 0.8, 'F');
  doc.setTextColor(15, 20, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.text('UHL-CERTIFIÉ', 42.25, 73, { align: 'center' });

  // Bottom Barcode line
  doc.setFillColor(20, 25, 30);
  doc.rect(0, 77.6, 54, 8, 'F');
  doc.setTextColor(220, 220, 220);
  doc.setFont('courier', 'bold');
  doc.setFontSize(5.5);
  doc.text(`|||||  ${student.mat}  |||||||||||||`, 27, 82.5, { align: 'center' });

  downloadBlob(`carte_pvc_${student.mat}.pdf`, doc.output('blob'));
};

/**
 * 2. Official Registration Form (Fiche d'inscription A4)
 */
export const downloadRegistrationFormPdf = async (student: Student, data: AppData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  const x0 = 15;
  let y = 60;
  const p = data.parcours.find((x) => x.id === student.parcours);

  const T = (t: string | number, x: number, yy: number, o?: any) => {
    doc.text(String(t ?? ''), x, yy, o);
  };

  const sec = (title: string) => {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(BL[0], BL[1], BL[2]);
    T(title, x0, y);
    doc.setDrawColor(BL[0], BL[1], BL[2]);
    doc.setLineWidth(0.4);
    doc.line(x0, y + 1.4, 195, y + 1.4);
    y += 6.5;
    doc.setTextColor(0, 0, 0);
  };

  const row = (fields: Array<[string, string | number]>) => {
    const w = 180 / fields.length;
    fields.forEach(([label, value], i) => {
      const x = x0 + i * w;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(110, 110, 110);
      T(label, x, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      T(String(value || '—'), x, y + 4, { maxWidth: w - 3 });
    });
    y += 9.5;
  };

  // Header with Official Logo
  await addLogo(doc, 23, 20, 8.5);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  T('UNIVERSITÉ HENRI LOPES (UHL)', 34, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  T('Pointe-Noire · République du Congo', 34, 21);
  const contacts = [
    data.p.adr,
    data.p.tel && 'Tél : ' + data.p.tel,
    data.p.mail && 'Email : ' + data.p.mail,
  ].filter(Boolean);
  contacts.forEach((c, idx) => {
    T(c as string, 34, 25 + idx * 3.8);
  });

  // Photo
  if (student.photo) {
    try {
      doc.addImage(student.photo, 'JPEG', 160, 10, 30, 38);
    } catch {
      doc.setDrawColor(90);
      doc.rect(160, 10, 30, 38);
    }
  } else {
    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    doc.rect(160, 10, 30, 38);
    doc.setFontSize(8);
    doc.setTextColor(120);
    T('PHOTO', 175, 30, { align: 'center' });
  }

  // Banner
  doc.setFillColor(BL[0], BL[1], BL[2]);
  doc.rect(55, 48, 100, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  T('FICHE D’INSCRIPTION', 105, 54.4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  T('Matricule : ' + student.mat, x0, 54.4);

  // Sections
  sec('1. ÉTAT CIVIL');
  row([
    ['Nom(s)', student.nom],
    ['Prénom(s)', student.prenom],
  ]);
  row([
    ['Date de naissance', student.naiss],
    ['Lieu de naissance', student.lieu],
    ['Sexe', student.sexe],
  ]);
  row([
    ['Nationalité', student.nat],
    ['Téléphone', student.tel],
    ['BP', student.bp],
  ]);
  row([
    ['E-mail', student.email],
    ['Adresse', student.adr],
    ['Ville', student.ville],
  ]);

  sec('2. SCOLARITÉ');
  row([
    ['Cycle', student.cyc],
    ['Année académique', student.annee || data.p.ann],
    ['Option / Parcours', p?.nom || '—'],
    ['Filière', student.fil],
  ]);
  row([
    ['Dernier niveau', student.dnv],
    ['Dernier diplôme', student.ddip],
    ['Année d’obtention', student.dan],
    ['Établissement fréquenté', student.etab],
  ]);
  row([
    ['Niveau actuel', student.niveau],
    ['Dossier complet ?', student.dossier],
  ]);

  sec('3. TUTEURS & CONTACTS D’URGENCE');
  row([
    ['Nom du père', student.pere],
    ['Téléphone du père', student.telpere],
    ['Fonction du père', student.fpere],
  ]);
  row([
    ['Nom de la mère', student.mere],
    ['Téléphone de la mère', student.telmere],
    ['Fonction de la mère', student.fmere],
  ]);
  row([
    ['Adresse des parents', student.adrp],
    ['Nombre de frères', student.nfr],
    ['Nombre de sœurs', student.nso],
  ]);
  row([
    ['Tuteur / Tutrice', student.tut],
    ['Téléphone du tuteur', student.ttut],
    ['Fonction du tuteur', student.ftut],
  ]);
  row([
    ['Adresse du tuteur', student.atut],
    ['Lien de parenté', student.ltut],
    ['Modalité de paiement', student.modp],
  ]);

  sec('4. INSCRIPTION & CONDITIONS FINANCIÈRES');
  row([
    ['Responsable financier', student.resp],
    ['Date d’inscription', student.dins],
  ]);
  row([
    ['Montant de l’échéance', student.ech > 0 ? formatFCFA(student.ech) : '—'],
    ['Mode de règlement', student.modr],
    ['Coût de formation', calcFee(student, data) ? formatFCFA(calcFee(student, data)) : '—'],
  ]);
  row([
    ['Type de règlement', student.typr],
    ['Statut de l’étudiant(e)', student.stat],
  ]);

  // Signatures
  y = Math.max(y + 8, 260);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  T('Fait à Pointe-Noire, le ' + new Date().toLocaleDateString('fr-FR'), 130, y);
  y += 9;
  doc.setFont('helvetica', 'bold');
  T('Signature de l’étudiant(e)', x0, y);
  T('Signature du parent ou du tuteur', 115, y);

  downloadBlob(`fiche_inscription_${student.mat}.pdf`, doc.output('blob'));
};

/**
 * 3. Official Grade Transcript (Relevé de notes A4)
 */
export const downloadTranscriptPdf = async (
  student: Student,
  sem: string,
  data: AppData
) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  const res = calcSemesterResult(student.id, sem, data);
  const [rg, nb] = getStudentRank(student.id, sem, data);
  const p = data.parcours.find((item) => item.id === student.parcours);

  const x0 = 15;
  const colWidths = [56, 18, 12, 12, 18, 16, 12, 18, 18];
  let y = 0;

  const T = (t: string | number, x: number, yy: number, o?: any) => {
    doc.text(String(t ?? ''), x, yy, o);
  };

  const drawCell = (
    x: number,
    yy: number,
    w: number,
    h: number,
    t: string,
    fill?: number[],
    align?: 'l' | 'c',
    textColor?: number
  ) => {
    doc.setDrawColor(90);
    doc.setLineWidth(0.2);
    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2]);
      doc.rect(x, yy, w, h, 'FD');
    } else {
      doc.rect(x, yy, w, h);
    }
    doc.setTextColor(textColor || 0);
    if (t !== '') {
      if (align === 'c') {
        T(t, x + w / 2, yy + h * 0.68, { align: 'center' });
      } else {
        T(t, x + 1.5, yy + h * 0.68);
      }
    }
  };

  // 1. Top Institutional Header
  await addLogo(doc, 24, 18, 8.5);
  doc.setTextColor(15, 59, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  T('UNIVERSITÉ HENRI LOPES (UHL)', 35, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(63, 154, 77);
  T('Pointe-Noire · République du Congo', 35, 19.5);
  doc.setFontSize(6.8);
  doc.setTextColor(110, 110, 110);
  T('« Savoir · Former · Réussir »', 35, 23.5);
  T('BP 1254 · Tél : +242 06 650 12 34 · contact@universite-henrilopes.cg', 35, 27.5);

  // Student Photo (Top Right)
  if (student.photo) {
    try {
      doc.addImage(student.photo, 'JPEG', 165, 10, 30, 38);
      doc.setDrawColor(180, 180, 180);
      doc.rect(165, 10, 30, 38);
    } catch {
      doc.setDrawColor(180, 180, 180);
      doc.rect(165, 10, 30, 38);
    }
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.rect(165, 10, 30, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 59, 46);
    const initials = (student.prenom[0] || 'E') + (student.nom[0] || 'H');
    T(initials, 180, 30, { align: 'center' });
  }

  // 2. Official Document Title Banner (Across width, centered at 105mm)
  doc.setFillColor(243, 248, 245);
  doc.setDrawColor(15, 59, 46);
  doc.setLineWidth(0.4);
  doc.roundedRect(x0, 42, 145, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 59, 46);
  T('BULLETIN OFFICIEL DE NOTES & RÉSULTATS LMD', 87.5, 47.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 130, 20); // UHL Gold
  T('SESSION ORDINAIRE — SEMESTRE ' + sem.slice(1) + ' · ANNÉE ACADÉMIQUE ' + data.p.ann, 87.5, 52.5, { align: 'center' });

  // 3. Student Identification Card (2 Balanced Columns, 180mm width)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(x0, 59, 180, 24, 1.5, 1.5, 'FD');

  // Left column (x=18mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  T('MATRICULE :', 18, 64.5);
  doc.setTextColor(15, 59, 46);
  doc.setFontSize(8);
  T(student.mat, 45, 64.5);

  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  T('NOM & PRÉNOMS :', 18, 69.5);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.8);
  T(`${student.nom} ${student.prenom}`.toUpperCase(), 45, 69.5);

  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  T('NÉ(E) LE :', 18, 74.5);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  T(`${student.naiss || '—'} à ${student.lieu || '—'}`, 45, 74.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  T('CONTACT :', 18, 79.5);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  T(`${student.tel || '—'} · ${student.email || '—'}`, 45, 79.5);

  // Right column (x=105mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  T('FILIÈRE :', 105, 64.5);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.8);
  T(student.fil || p?.dom || 'Sciences et Technologies', 132, 64.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  T('OPTION / PARCOURS :', 105, 69.5);
  doc.setTextColor(15, 59, 46);
  doc.setFontSize(7.8);
  T(p?.nom || 'Formation LMD', 132, 69.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  T('CYCLE & NIVEAU :', 105, 74.5);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  T(`${p?.cycle || 'Licence'} — ${student.niveau}`, 132, 74.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  T('STATUT ACADÉMIQUE :', 105, 79.5);
  doc.setTextColor(63, 154, 77);
  doc.setFontSize(7.5);
  T('Inscrit(e) régulier · Dossier complet', 132, 79.5);

  // 4. Section Title Banner: Results detail
  doc.setFillColor(15, 59, 46);
  doc.rect(x0, 86, 180, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  T('RÉSULTATS DÉTAILLÉS PAR UNITÉ D’ENSEIGNEMENT (UE) ET ÉLÉMENTS CONSTITUTIFS (EC)', 105, 90.5, { align: 'center' });

  y = 96;

  // Render UEs and ECs
  res.rows.forEach(([u, ueAvg]) => {
    const ecs = data.ec.filter((e) => e.ue === u.id);
    if (y + 7 * (ecs.length + 1) + 10 > 270) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(238, 244, 240);
    doc.rect(x0, y, 180, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(15, 59, 46);
    T('Unité d’Enseignement (UE) : ' + (u.code ? u.code + ' — ' : '') + u.nom, x0 + 2, y + 3.8);
    const avgStr = ueAvg !== null ? ueAvg.toFixed(2) : '—';
    const isVal = ueAvg !== null && (ueAvg >= data.p.seuil || (res.moy !== null && res.moy >= data.p.seuil));
    doc.setTextColor(isVal ? 15 : 180, isVal ? 100 : 30, isVal ? 40 : 30);
    T('Moyenne UE : ' + avgStr + ' / 20  [' + (isVal ? 'Capitalisée' : 'Non validée') + ']', x0 + 178, y + 3.8, { align: 'right' });
    y += 5.5;

    let x = x0;
    const headers = [
      'Élément constitutif',
      'Note Classe',
      'TD',
      'TP',
      'Moy. Classe',
      'Examen',
      'Coef',
      'Moy. Gén',
      'Crédit',
    ];
    headers.forEach((h, i) => {
      doc.setFontSize(7);
      drawCell(x, y, colWidths[i], 6, h, [85, 85, 85], i ? 'c' : 'l', 255);
      x += colWidths[i];
    });
    y += 6;

    doc.setFont('helvetica', 'normal');
    ecs.forEach((e, j) => {
      const note = data.notes[`${e.id}|${student.id}`] || {};
      const exVal =
        note.ex !== undefined && note.ex !== ''
          ? (note.rt !== undefined && note.rt !== ''
              ? Math.max(Number(note.ex), Number(note.rt))
              : Number(note.ex)
            ).toFixed(2)
          : '';
      const ccVal = note.cc !== undefined && note.cc !== '' ? Number(note.cc).toFixed(2) : '';
      const ecAvg = calcEcAverage(e.id, student.id, data);
      const ecAvgStr = ecAvg !== null ? ecAvg.toFixed(2) : '—';

      const vals = [
        e.nom,
        ccVal,
        '',
        '',
        ccVal,
        exVal,
        String(e.coef),
        ecAvgStr,
        j === 0 ? Number(u.cred).toFixed(2) : '',
      ];

      x = x0;
      vals.forEach((v, i) => {
        doc.setFontSize(7.5);
        drawCell(x, y, colWidths[i], 6.5, v, undefined, i ? 'c' : 'l');
        x += colWidths[i];
      });
      y += 6.5;
    });
    y += 3;
  });

  // Summary box
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const G = [220, 225, 230];

  const semAvgStr = res.moy !== null ? res.moy.toFixed(2) : '—';
  drawCell(x0, y, 60, 7, 'Moyenne Semestre ' + sem.slice(1), G);
  drawCell(x0 + 60, y, 22, 7, semAvgStr, undefined, 'c');
  drawCell(x0 + 82, y, 58, 7, 'Nombre de crédits validés', G);
  drawCell(x0 + 140, y, 40, 7, `${res.cr}  sur  ${res.tot}`, undefined, 'c');
  y += 7;

  drawCell(x0, y, 60, 7, 'Rang', G);
  const rankStr = rg ? `${rg}${rg === 1 ? 'er' : 'ème'} sur ${nb} candidats` : '—';
  drawCell(x0 + 60, y, 80, 7, rankStr, undefined, 'c');
  drawCell(x0 + 140, y, 20, 7, 'Mention', G);
  drawCell(x0 + 160, y, 20, 7, getMention(res.moy), undefined, 'c');
  y += 18;

  // Signatures
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  T('Fait à Pointe-Noire, le ' + new Date().toLocaleDateString('fr-FR'), x0, y);
  doc.setFont('helvetica', 'bold');
  T('Le Directeur de la Scolarité et des Examens', x0 + 95, y);

  downloadBlob(`releve_${student.mat}_${sem}.pdf`, doc.output('blob'));
};

/**
 * 4. Deliberation Minutes (PV de délibération A4)
 */
export const downloadDeliberationPvPdf = async (
  parcoursId: string,
  sem: string,
  data: AppData
) => {
  const doc = new jsPDF();
  const p = data.parcours.find((item) => item.id === parcoursId);
  const students = data.students.filter((s) => s.parcours === parcoursId);

  // Official logo
  await addLogo(doc, 25, 20, 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BL[0], BL[1], BL[2]);
  doc.text('UNIVERSITÉ HENRI LOPES (UHL)', 38, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text('Faculté des Sciences, Technologies & Droit · Pointe-Noire (Congo)', 38, 20.5);
  doc.text(`Année Académique : ${data.p.ann} · Session de délibérations LMD`, 38, 24.5);
  doc.text(`Devise : ${UNIVERSITY_MOTTO}`, 38, 28.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`PROCÈS-VERBAL DE DÉLIBÉRATION — ${sem}`, 15, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Parcours : ${p?.nom || 'Tous'} (${p?.cycle || ''})`, 15, 44);

  let y = 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(BL[0], BL[1], BL[2]);
  doc.rect(15, y - 5, 180, 7, 'F');
  doc.text('Matricule', 17, y);
  doc.text('Nom & Prénom(s)', 50, y);
  doc.text('Moyenne', 125, y);
  doc.text('Crédits', 145, y);
  doc.text('Décision', 165, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  students.forEach((s) => {
    const res = calcSemesterResult(s.id, sem, data);
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    const moyStr = res.moy !== null ? res.moy.toFixed(2) : '—';
    doc.text(s.mat, 17, y);
    doc.text(`${s.nom} ${s.prenom}`.slice(0, 38), 50, y);
    doc.text(moyStr, 125, y);
    doc.text(`${res.cr} / ${res.tot}`, 145, y);
    doc.text(res.dec, 165, y);
    y += 7;
  });

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Le Président du Jury de Délibération :', 15, Math.min(y, 280));

  downloadBlob(`PV_Deliberation_${sem}_${p?.nom || 'Parcours'}.pdf`, doc.output('blob'));
};

/**
 * 5. Payment Receipt (Reçu de paiement)
 */
export const downloadPaymentReceiptPdf = async (pay: Payment, data: AppData) => {
  const doc = new jsPDF();
  const s = data.students.find((x) => x.id === pay.etu);
  if (!s) return;

  const balance = calcBalance(s, data);

  // Header with Official Logo
  await addLogo(doc, 25, 20, 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BL[0], BL[1], BL[2]);
  doc.text('UNIVERSITÉ HENRI LOPES (UHL)', 38, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Service de la Caisse Centrale & Comptabilité', 38, 22);
  doc.text('Pointe-Noire · République du Congo', 38, 26);
  doc.text(`Devise : ${UNIVERSITY_MOTTO}`, 38, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('REÇU DE PAIEMENT SCOLARITÉ', 15, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Reçu N° : REC-${pay.id.toUpperCase()}`, 15, 53);
  doc.text(`Date d’opération : ${pay.date}`, 15, 60);
  doc.text(`Étudiant : ${s.nom} ${s.prenom} (${s.mat})`, 15, 67);
  doc.text(`Niveau : ${s.niveau}  ·  Filière : ${s.fil}`, 15, 74);

  doc.setFillColor(245, 247, 246);
  doc.rect(15, 82, 180, 32, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, 82, 180, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Montant versé : ${formatFCFA(pay.montant)}`, 20, 92);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mode de règlement : ${pay.mode}`, 20, 100);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(balance > 0 ? 180 : 31, balance > 0 ? 30 : 120, balance > 0 ? 30 : 60);
  doc.text(`Solde restant dû : ${formatFCFA(Math.max(0, balance))}`, 20, 108);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Opération enregistrée par : ${pay.caissier || 'Caisse Centrale'}`, 15, 126);

  doc.setFont('helvetica', 'bold');
  doc.text('Cachet et signature de la Caisse :', 120, 140);

  downloadBlob(`recu_${s.mat}_${pay.date}.pdf`, doc.output('blob'));
};
