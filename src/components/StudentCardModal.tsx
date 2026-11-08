import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AppData, Student } from '../types';
import { UNIVERSITY_LOGO } from '../constants/assets';
import { downloadStudentCardPdf } from '../services/pdfGenerator';
import { Download, X } from 'lucide-react';

interface Props {
  student: Student;
  data: AppData;
  onClose: () => void;
}

export const StudentCardModal: React.FC<Props> = ({ student, data, onClose }) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  const parcours = data.parcours.find((p) => p.id === student.parcours);

  useEffect(() => {
    QRCode.toDataURL(student.mat, {
      margin: 1,
      width: 160,
      color: { dark: '#1f5fae', light: '#ffffff' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Aperçu de la Carte d’Étudiant PVC
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Format normalisé ISO/IEC 7810 ID-1 (54 × 85.6 mm) avec puce QR
        </p>

        {/* Card Component */}
        <div
          className="relative w-[216px] h-[342px] rounded-2xl bg-white text-[#1f5fae] border border-slate-300 shadow-xl overflow-hidden select-none shrink-0"
          style={{ fontFamily: '"Source Sans 3", system-ui, sans-serif' }}
        >
          {/* Header */}
          <div className="absolute left-3 top-2.5 flex items-center gap-2">
            <img
              src={UNIVERSITY_LOGO}
              alt="Logo Université Henri Lopes"
              className="w-9 h-auto object-contain"
            />
            <div>
              <b className="text-[10px] leading-tight block text-[#1f5fae] font-bold">
                UNIVERSITÉ<br />HENRI LOPES
              </b>
              <span className="text-[7.5px] text-slate-500 block">Pointe-Noire · Congo</span>
            </div>
          </div>

          <h4 className="absolute left-3 top-[52px] font-bold text-xs tracking-wide text-[#1f5fae] font-['Bricolage_Grotesque']">
            CARTE D’ÉTUDIANT
          </h4>

          {/* Academic year badge */}
          <small className="absolute left-28 top-[78px] text-[7.5px] text-slate-500 font-semibold">
            Année Académique
          </small>
          <span className="absolute left-28 top-[94px] bg-[#3f9a4d] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            {data.p.ann}
          </span>

          {/* Student Photo */}
          <div className="absolute left-3 top-[76px] w-[86px] h-[106px] rounded-lg bg-[#e3ebf5] overflow-hidden flex items-center justify-center font-bold text-xl text-[#1f5fae] border border-slate-200">
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

          {/* Student Name */}
          <div className="absolute left-3 right-3 top-[190px]">
            <b className="text-[11.5px] font-bold text-[#1f5fae] block leading-tight truncate">
              {student.prenom} {student.nom}
            </b>
          </div>

          {/* Details */}
          <div className="absolute left-3 top-[215px] max-w-[110px]">
            <span className="text-[7px] text-slate-400 font-semibold block uppercase">
              Option / Filière
            </span>
            <b className="text-[9.5px] leading-tight block text-[#1f5fae] truncate">
              {parcours?.nom || 'Formation'}
            </b>
          </div>

          <div className="absolute left-3 top-[248px]">
            <span className="text-[7px] text-slate-400 font-semibold block uppercase">
              Niveau
            </span>
            <b className="text-[10.5px] text-[#1f5fae]">{student.niveau}</b>
          </div>

          {/* QR Code */}
          {qrSrc && (
            <img
              src={qrSrc}
              alt="QR Code"
              className="absolute right-3 top-[218px] w-16 h-16 rounded border border-slate-100"
            />
          )}

          {/* Matricule Badge */}
          <span className="absolute left-3 top-[276px] bg-[#3f9a4d] text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded-full">
            {student.mat}
          </span>

          {/* Bottom decorative wave */}
          <div className="absolute inset-x-0 bottom-0 h-9 bg-[#1f5fae] rounded-t-[50%_20px] shadow-[0_-3px_0_#3f9a4d] flex items-center justify-center pb-1 text-white font-bold text-[9px] tracking-wider">
            ID ÉTUDIANT OFFICIEL
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6 w-full">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f4c3a] text-white font-semibold text-sm hover:bg-[#0c3c2e] transition-colors shadow-sm disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Génération...' : 'Télécharger le PDF'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
