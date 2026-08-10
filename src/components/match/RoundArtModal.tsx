"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Image as ImageIcon, X } from "lucide-react";

interface MatchArtData {
  homeTeamName: string;
  homeTeamBadge?: string;
  awayTeamName: string;
  awayTeamBadge?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
}

interface RoundArtModalProps {
  isOpen: boolean;
  onClose: () => void;
  championshipName: string;
  roundName: string;
  matches: MatchArtData[];
}

export function RoundArtModal({
  isOpen,
  onClose,
  championshipName,
  roundName,
  matches,
}: RoundArtModalProps) {
  const artRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!artRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(artRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `arte-${roundName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-emerald-400"/>
            <h3 className="text-lg font-bold">Arte da Rodada para Download</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5"/>
          </button>
        </div>

        {/* Card de Pré-visualização da Arte */}
        <div className="my-6 flex justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-2">
          <div
            ref={artRef}
            className="relative flex flex-col justify-between w-[480px] min-h-[600px] p-8 text-white font-sans"
            style={{
              background: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #020617 100%)",
            }}
          >
            {/* Detalhes Decorativos de Fundo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Cabeçalho da Arte */}
            <div className="text-center space-y-2 z-10">
              <div className="inline-block px-4 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-md shadow-lg">
                {championshipName}
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-100">
                {roundName}
              </h1>
              <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
            </div>

            {/* Grid de Confrontos */}
            <div className="my-6 grid grid-cols-2 gap-4 z-10">
              {matches.map((match, idx) => {
                const isFinished = match.status === "finished" || match.status === "FINALIZADO";
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 backdrop-blur-sm"
                  >
                    {/* Time Mandante */}
                    <div className="flex flex-col items-center flex-1 text-center">
                      {match.homeTeamBadge ? (
                        <img
                          src={match.homeTeamBadge}
                          alt=""
                          className="w-10 h-10 object-contain mb-1"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-800 rounded-full mb-1 flex items-center justify-center font-bold text-xs">
                          {match.homeTeamName?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-slate-300 uppercase line-clamp-1">
                        {match.homeTeamName}
                      </span>
                    </div>

                    {/* Placar ou X */}
                    <div className="px-2 font-black text-amber-400 text-sm">
                      {isFinished ? (
                        <span className="text-white bg-slate-800 px-2 py-0.5 rounded text-xs">
                          {match.homeScore} - {match.awayScore}
                        </span>
                      ) : (
                        "X"
                      )}
                    </div>

                    {/* Time Visitante */}
                    <div className="flex flex-col items-center flex-1 text-center">
                      {match.awayTeamBadge ? (
                        <img
                          src={match.awayTeamBadge}
                          alt=""
                          className="w-10 h-10 object-contain mb-1"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-800 rounded-full mb-1 flex items-center justify-center font-bold text-xs">
                          {match.awayTeamName?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-slate-300 uppercase line-clamp-1">
                        {match.awayTeamName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé / Marca D'água */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 z-10 text-[10px] text-slate-400 font-medium">
              <span>VKX SPORTS</span>
              <span>CONFIRA NO SITE OFICIAL</span>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal com Botões */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4"/>
            {downloading ? "Gerando..." : "Baixar Imagem (.PNG)"}
          </button>
        </div>
      </div>
    </div>
  );
}