import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AppData, Student } from '../types';
import { UNIVERSITY_LOGO } from '../constants/assets';
import { downloadStudentCardPdf } from '../services/pdfGenerator';
import {
  Download,
  X,
  Phone,
  Mail,
  BookOpen,
  GraduationCap,
  RotateCw,
  ShieldCheck,
  MapPin,
  UserCheck,
} from 'lucide-react';

interface Props {
  student: Student;
  data: AppData;
  onClose: () => void;
}

export const StudentCardModal: React.FC<Props> = ({ student, data, onClose }) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [activeSide, setActiveSide] = useState<'both' | 'recto' | 'verso'>('both');

  const parcours = data.parcours.find((p) => p.id === student.parcours);
  const filiereName = student.fil || parcours?.dom || 'Sciences & Technologies';
  const optionName = parcours?.nom || 'Formation Supérieure LMD';

  useEffect(() => {
    QRCode.toDataURL(student.mat, {
      margin: 1,
      width: 180,
      color: { dark: '#0f3b2e', light: '#ffffff' },
    })
      .then(setQrSrc)
      .catch((err) => console.error(err));
  }, [student.mat]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadStudentCardPdf(student, data);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-5 sm:p-7 flex flex-col items-center my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-lg mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Format normalisé ISO/IEC 7810 ID-1 (54 × 85.6 mm)</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Bricolage_Grotesque'] tracking-tight">
            Carte d’Étudiant Officielle PVC (Recto & Verso)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Génération conforme avec alignement des titres institutionnels, puces QR de contrôle et verso d'authentification.
          </p>
        </div>

        {/* Side Selector Tabs (Mobile & Quick Toggle) */}
        <div className="flex sm:hidden items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs mb-4">
          <button
            type="button"
            onClick={() => setActiveSide('recto')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSide === 'recto'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Recto (Face avant)
          </button>
          <button
            type="button"
            onClick={() => setActiveSide('verso')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSide === 'verso'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Verso (Face arrière)
          </button>
        </div>

        {/* Two-Sided Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 justify-items-center w-full max-w-2xl">
          {/* ========================================================================= */}
          {/* RECTO (FACE AVANT)                                                        */}
          {/* ========================================================================= */}
          {(activeSide === 'both' || activeSide === 'recto') && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <span>Face Avant</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-semibold">
                  Recto
                </span>
              </span>

              {/* Physical card mockup (CR80 ratio ~ 230px x 365px) */}
              <div
                className="relative w-[230px] h-[365px] rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl overflow-hidden select-none flex flex-col justify-between"
                style={{ fontFamily: '"Source Sans 3", system-ui, sans-serif' }}
              >
                {/* Header Band */}
                <div className="bg-gradient-to-b from-[#0f3b2e] to-[#155341] text-white p-2.5 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white p-0.5 shrink-0 shadow-sm flex items-center justify-center">
                      <img
                        src={UNIVERSITY_LOGO}
                        alt="Logo Université Henri Lopes"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 leading-tight">
                      <h4 className="text-[10px] font-extrabold tracking-wide uppercase font-['Bricolage_Grotesque'] leading-tight">
                        Université Henri Lopes
                      </h4>
                      <p className="text-[7.5px] text-emerald-200">
                        Pointe-Noire · République du Congo
                      </p>
                    </div>
                  </div>

                  {/* Document Title Banner */}
                  <div className="mt-2 py-1 px-2 rounded-md bg-[#e8b923] text-slate-950 text-center shadow-xs">
                    <span className="block text-[10px] font-black tracking-wider uppercase font-['Bricolage_Grotesque']">
                      Carte d’Étudiant
                    </span>
                  </div>
                </div>

                {/* Body Area */}
                <div className="px-3 py-2 flex-1 flex flex-col justify-between text-xs">
                  {/* Photo & Badges Row */}
                  <div className="flex items-start gap-2.5">
                    {/* Portrait Photo */}
                    <div className="w-[88px] h-[108px] rounded-xl bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center font-bold text-xl text-[#0f3b2e] shadow-xs shrink-0">
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{(student.prenom[0] || 'E') + (student.nom[0] || 'H')}</span>
                      )}
                    </div>

                    {/* Right Meta Column */}
                    <div className="flex-1 space-y-1.5 pt-0.5">
                      <div>
                        <span className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">
                          Année académique
                        </span>
                        <span className="inline-block bg-[#0f3b2e] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md mt-0.5">
                          {data.p.ann}
                        </span>
                      </div>

                      <div>
                        <span className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">
                          Cycle & Niveau
                        </span>
                        <b className="text-[10px] text-[#0f3b2e] block leading-tight font-extrabold">
                          {parcours?.cycle || 'Licence'} · {student.niveau}
                        </b>
                      </div>

                      <div>
                        <span className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wider">
                          Matricule
                        </span>
                        <span className="inline-block text-[8.5px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                          {student.mat}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Student Full Name: 100% unobstructed, full width, high contrast */}
                  <div className="mt-2 p-1.5 bg-slate-50/90 rounded-lg border border-slate-200/80">
                    <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-wider">
                      Nom(s) & Prénom(s)
                    </span>
                    <b className="text-[11px] font-extrabold text-[#0f3b2e] block leading-snug uppercase tracking-wide break-words">
                      {student.nom} {student.prenom}
                    </b>
                  </div>

                  {/* Filière & Option */}
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    <div>
                      <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-wider">
                        Filière
                      </span>
                      <p className="text-[8.5px] font-bold text-slate-800 leading-tight truncate">
                        {filiereName}
                      </p>
                    </div>

                    <div>
                      <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-wider">
                        Option
                      </span>
                      <p className="text-[8.5px] font-bold text-[#0f3b2e] leading-tight truncate">
                        {optionName}
                      </p>
                    </div>
                  </div>

                  {/* Security & QR Code Section: Bottom right corner, away from student name */}
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/80">
                    <div className="text-[7.5px] text-slate-500 leading-tight pr-2">
                      <span className="block font-bold text-emerald-950 uppercase tracking-wider text-[8px]">
                        ID Certifié · Sécurité
                      </span>
                      <span className="text-slate-400 block text-[6.5px] mt-0.5">Scan contrôle guérite & présences</span>
                      <div className="mt-1">
                        <span className="inline-block text-[7px] font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs">
                          {student.mat}
                        </span>
                      </div>
                    </div>
                    {qrSrc && (
                      <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-xs shrink-0 aspect-square">
                        <img
                          src={qrSrc}
                          alt={`QR Code ${student.mat}`}
                          className="w-11 h-11 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Reduced Slim Footer Ribbon: Yellow accent border + Green UHL band */}
                <div className="h-5 bg-[#0f3b2e] text-white flex items-center justify-center text-[7.5px] font-bold tracking-wider uppercase border-t-[1.5px] border-[#e8b923] shrink-0">
                  République du Congo · UHL
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VERSO (FACE ARRIÈRE) — AVEC TÉLÉPHONE, EMAIL, FILIÈRE ET OPTION           */}
          {/* ========================================================================= */}
          {(activeSide === 'both' || activeSide === 'verso') && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <span>Face Arrière</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full font-semibold">
                  Verso
                </span>
              </span>

              {/* Physical card mockup (CR80 ratio ~ 230px x 365px) */}
              <div
                className="relative w-[230px] h-[365px] rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl overflow-hidden select-none flex flex-col justify-between"
                style={{ fontFamily: '"Source Sans 3", system-ui, sans-serif' }}
              >
                {/* Verso Header */}
                <div className="bg-[#0f3b2e] text-white p-2.5 pb-2 border-b-2 border-[#e8b923]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold tracking-wide uppercase text-amber-300">
                      Université Henri Lopes
                    </span>
                    <span className="text-[8px] text-emerald-200">Pointe-Noire</span>
                  </div>
                  <h4 className="text-[10.5px] font-black uppercase tracking-wider text-center font-['Bricolage_Grotesque'] mt-1">
                    Authentification & Contact
                  </h4>
                </div>

                {/* Verso Metadata Block */}
                <div className="p-3 flex-1 flex flex-col justify-between text-xs space-y-2">
                  {/* Student Contact Info (Requested explicitly by user) */}
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    {/* Téléphone */}
                    <div className="flex items-start gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-tight">
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block">
                          Numéro de Téléphone
                        </span>
                        <b className="text-[9px] text-slate-900 font-mono">
                          {student.tel || '+242 06 000 00 00'}
                        </b>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-tight truncate">
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block">
                          Adresse Email
                        </span>
                        <b className="text-[8.5px] text-slate-900 truncate block">
                          {student.email || `${student.prenom.toLowerCase()}.${student.nom.toLowerCase()}@universite-henrilopes.cg`}
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Filière & Option Block (Requested explicitly by user) */}
                  <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
                    {/* Filière */}
                    <div className="flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-tight">
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block">
                          Filière Académique
                        </span>
                        <b className="text-[9px] text-[#0f3b2e] block leading-tight">
                          {filiereName}
                        </b>
                      </div>
                    </div>

                    {/* Option */}
                    <div className="flex items-start gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-tight">
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block">
                          Option de Spécialité
                        </span>
                        <b className="text-[9px] text-slate-900 block leading-tight">
                          {optionName}
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Emergency & Civil Details */}
                  <div className="space-y-1 text-[7.5px] text-slate-600 border-t border-slate-100 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date & lieu naiss. :</span>
                      <span className="font-semibold">{student.naiss || '2004-01-01'} à {student.lieu || 'Pointe-Noire'}</span>
                    </div>
                    {student.tut && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Contact d'urgence :</span>
                        <span className="font-semibold">{student.tut} ({student.ttut || student.tel})</span>
                      </div>
                    )}
                  </div>

                  {/* Official Terms of Use */}
                  <div className="bg-slate-100 rounded-lg p-1.5 text-[6.5px] text-slate-500 leading-tight text-center">
                    <p className="font-semibold text-slate-700 mb-0.5">AVIS RÉGLEMENTAIRE</p>
                    Cette carte est strictement personnelle et demeure la propriété de l'Université Henri Lopes.
                    En cas de perte, rapporter à la Scolarité : BP 1254 Pointe-Noire.
                  </div>

                  {/* Signature block */}
                  <div className="flex items-end justify-between pt-1 border-t border-slate-200 text-[7px]">
                    <div>
                      <span className="block text-slate-400 font-semibold">Direction de la Scolarité</span>
                      <span className="font-bold text-[#0f3b2e]">Dr. M. Mavoungou</span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.5 border border-dashed border-emerald-600 text-emerald-800 rounded font-mono font-bold text-[7px]">
                        UHL-CERTIFIED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Barcode Strip */}
                <div className="h-6 bg-slate-900 text-slate-300 flex items-center justify-center font-mono text-[8px] tracking-widest">
                  ||||| {student.mat} |||||||||||||
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full max-w-md">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#0f4c3a] to-[#155341] text-white font-bold text-sm hover:from-[#0c3c2e] hover:to-[#0f3b2e] transition-all shadow-md shadow-emerald-950/20 disabled:opacity-60 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-300" />
            {downloading ? 'Génération du PDF 2 faces...' : 'Télécharger la Carte PDF (Recto & Verso)'}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
