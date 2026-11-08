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
  const parcoursName = p?.nom || 'Formation Supérieure';

  // Header
  await addLogo(doc, 8, 8, 4.8);
  doc.setTextColor(BL[0], BL[1], BL[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('UNIVERSITÉ', 14, 7);
  doc.text('HENRI LOPES', 14, 10.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(110, 110, 110);
  doc.text('Pointe-Noire · Congo', 14, 13);

  // Card Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(BL[0], BL[1], BL[2]);
  doc.text('CARTE D’ÉTUDIANT', 3, 20);

  // Student Photo or Placeholder
  if (student.photo) {
    try {
      doc.addImage(student.photo, 'JPEG', 3, 23, 21, 26);
    } catch {
      doc.setFillColor(227, 235, 245);
      doc.roundedRect(3, 23, 21, 26, 2, 2, 'F');
    }
  } else {
    doc.setFillColor(227, 235, 245);
    doc.roundedRect(3, 23, 21, 26, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(BL[0], BL[1], BL[2]);
    const initials = (student.prenom[0] || 'E') + (student.nom[0] || 'H');
    doc.text(initials, 13.5, 37, { align: 'center' });
  }

  // Academic Year Badge
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Année Académique', 26, 25.5);
  doc.setFillColor(GR[0], GR[1], GR[2]);
  doc.roundedRect(26, 27, 24, 5, 2.5, 2.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text(data.p.ann, 38, 30.6, { align: 'center' });

  // Name
  doc.setTextColor(BL[0], BL[1], BL[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const fullName = `${student.prenom} ${student.nom}`.toUpperCase();
  doc.text(fullName, 3, 53.5, { maxWidth: 48 });

  // Option / Filière
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4);
  doc.setTextColor(130, 130, 130);
  doc.text('FILIÈRE / OPTION', 3, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(BL[0], BL[1], BL[2]);
  doc.text(parcoursName, 3, 61.5, { maxWidth: 28 });

  // Niveau
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4);
  doc.setTextColor(130, 130, 130);
  doc.text('NIVEAU', 3, 66.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(BL[0], BL[1], BL[2]);
  doc.text(student.niveau, 3, 70);

  // QR Code
  try {
    const qrDataUrl = await QRCode.toDataURL(student.mat, {
      margin: 1,
      width: 128,
      color: { dark: '#1f5fae', light: '#ffffff' },
    });
    doc.addImage(qrDataUrl, 'PNG', 33, 55.5, 17, 17);
  } catch (e) {
    console.warn('QR Code generation failed', e);
  }

  // Matricule pill
  doc.setFillColor(GR[0], GR[1], GR[2]);
  doc.roundedRect(3, 72.5, 27, 4.6, 2.3, 2.3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(student.mat, 16.5, 75.8, { align: 'center' });

  // Waves & Footer
  drawCardWaves(doc, -1.3, GR);
  drawCardWaves(doc, 0, BL);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('ID ÉTUDIANT', 27, 82.5, { align: 'center' });

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
  T('UNIVERSITÉ HENRI LOPES', 34, 16);
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

  // Header with Official Logo
  await addLogo(doc, 23, 20, 8.5);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  T('UNIVERSITÉ HENRI LOPES', 34, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  T('Pointe-Noire · République du Congo', 34, 20.5);
  const contacts = [
    data.p.adr,
    data.p.tel && 'Tél : ' + data.p.tel,
    data.p.mail && 'Email : ' + data.p.mail,
  ].filter(Boolean);
  contacts.forEach((c, idx) => {
    T(c as string, 34, 24.5 + idx * 3.8);
  });

  // Relevé title & number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BL[0], BL[1], BL[2]);
  T('Relevé de notes', 105, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  T('N° ' + student.mat.split('-').pop() + sem + '-' + data.p.ann.slice(0, 4), 105, 21.5);

  // Student Photo or box
  if (student.photo) {
    try {
      doc.addImage(student.photo, 'JPEG', 160, 10, 30, 38);
    } catch {
      doc.setDrawColor(90);
      doc.rect(160, 10, 30, 38);
    }
  } else {
    doc.setDrawColor(90);
    doc.rect(160, 10, 30, 38);
  }

  // Student details
  doc.setFontSize(9);
  const meta: Array<[string, string]> = [
    ['Étudiant', student.mat],
    ['Nom(s) & Prénom(s)', `${student.nom} ${student.prenom}`],
    ['Option / Parcours', p?.nom || '—'],
    ['Cycle', p?.cycle || '—'],
    ['Niveau', student.niveau],
    ['Année académique', data.p.ann],
  ];

  meta.forEach(([k, v], idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    T(k + ' :', x0, 46 + idx * 5.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    T(v, x0 + 38, 46 + idx * 5.2);
  });

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BL[0], BL[1], BL[2]);
  T('SESSION D’EXAMEN — SEMESTRE ' + sem.slice(1), x0, 46 + 6 * 5.2 + 2);

  y = 85;

  // Render UEs and ECs
  res.rows.forEach(([u, ueAvg]) => {
    const ecs = data.ec.filter((e) => e.ue === u.id);
    if (y + 7 * (ecs.length + 1) + 10 > 270) {
      doc.addPage();
      y = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    T('Unité d’Enseignement : ' + u.nom, x0, y + 4);
    const avgStr = ueAvg !== null ? ueAvg.toFixed(2) : '—';
    T('Moyenne UE : ' + avgStr, x0 + 130, y + 4);
    y += 6;

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
  doc.text('UNIVERSITÉ HENRI LOPES', 38, 16);
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
  doc.text('UNIVERSITÉ HENRI LOPES', 38, 17);
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
