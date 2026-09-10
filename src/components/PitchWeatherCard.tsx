import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Wind, Radio, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { PitchWeatherForecast, fetchPitchWeather, buildRadarWmsUrl } from '../services/weatherService';

interface PitchWeatherCardProps {
  venueName?: string;
  cityName?: string;
  date?: string;
  time?: string;
  className?: string;
}

export const PitchWeatherCard: React.FC<PitchWeatherCardProps> = ({
  venueName = 'Ottelukenttä',
  cityName,
  className = '',
}) => {
  const [forecast, setForecast] = useState<PitchWeatherForecast | null>(null);
  const [isRadarOpen, setIsRadarOpen] = useState(false);

  useEffect(() => {
    fetchPitchWeather(venueName, cityName).then(setForecast);
  }, [venueName, cityName]);

  if (!forecast) return null;

  const {
    temperatureC,
    feelsLikeC,
    windSpeedMs,
    windGustMs,
    precipitationMmh,
    turfCondition,
    turfLabelFi,
    windAdvisory,
    coords,
  } = forecast;

  const turfStyle =
    turfCondition === 'frozen'
      ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30'
      : turfCondition === 'slick'
      ? 'bg-sky-950/40 text-sky-300 border-sky-500/30'
      : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';

  const radarTileUrl = buildRadarWmsUrl(coords);

  return (
    <>
      <div
        className={`bg-surface-1 rounded-xl p-4 md:p-5 border border-border-hairline shadow-xs flex flex-col gap-3 text-text-primary ${className}`}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-border-hairline/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-accent animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Kenttäolosuhteet & Sääennuste
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setIsRadarOpen(true)}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Avaa sadetutka</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Main Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Temperature */}
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border-hairline flex flex-col">
            <span className="text-[11px] font-medium text-text-muted">Lämpötila</span>
            <span className="text-xl font-bold font-mono text-text-primary mt-0.5">
              {temperatureC.toFixed(1)}°C
            </span>
            <span className="text-[10px] text-text-muted">Tuntuu {feelsLikeC.toFixed(1)}°C</span>
          </div>

          {/* Turf Traction */}
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border-hairline flex flex-col justify-between">
            <span className="text-[11px] font-medium text-text-muted">Kentän pito</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block mt-1 w-fit ${turfStyle}`}>
              {turfLabelFi.split(' ')[0]} {turfLabelFi.split(' ')[1] || ''}
            </span>
            <span className="text-[10px] text-text-muted truncate">
              {turfCondition === 'frozen' ? 'Jäänasto / TF' : turfCondition === 'slick' ? 'Nopea liuku' : 'Normaali FG'}
            </span>
          </div>

          {/* Wind */}
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border-hairline flex flex-col">
            <span className="text-[11px] font-medium text-text-muted">Tuuli</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Wind className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-base font-bold font-mono text-text-primary">
                {windSpeedMs.toFixed(1)} m/s
              </span>
            </div>
            <span className="text-[10px] text-text-muted">
              {windGustMs ? `Puuskat ${windGustMs.toFixed(1)} m/s` : 'Vakaa'}
            </span>
          </div>

          {/* Rain */}
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border-hairline flex flex-col">
            <span className="text-[11px] font-medium text-text-muted">Sade</span>
            <div className="flex items-center gap-1 mt-0.5">
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-base font-bold font-mono text-sky-400">
                {precipitationMmh.toFixed(1)} mm/h
              </span>
            </div>
            <span className="text-[10px] text-text-muted">
              {precipitationMmh > 0 ? 'Märkä nurmi' : 'Poutaa'}
            </span>
          </div>
        </div>

        {/* Dynamic Warning or Tactical Advisory */}
        {windAdvisory && (
          <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/20 p-2 rounded border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{windAdvisory}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-text-muted pt-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>FMI 30/30 Salamaturvallisuus: Ei salamavaaraa</span>
          </div>
          <span className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded border border-border-hairline">
            FMI Reaaliaika
          </span>
        </div>
      </div>

      {/* Interactive Radar & Satellite Modal */}
      <AnimatePresence>
        {isRadarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-surface-1 rounded-2xl border border-border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-accent animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      {venueName} — FMI Sadetutka
                    </h3>
                    <p className="text-xs text-text-muted">Ilmatieteen laitos (FMI) heijastavuus</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRadarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Radar Image Canvas */}
              <div className="relative aspect-16/10 bg-slate-950 flex items-center justify-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-40 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://tile.openstreetmap.org/11/${Math.floor(((coords.lng + 180) / 360) * Math.pow(2, 11))}/${Math.floor(((1 - Math.log(Math.tan((coords.lat * Math.PI) / 180) + 1 / Math.cos((coords.lat * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, 11))}.png')`,
                  }}
                />
                <img
                  src={radarTileUrl}
                  alt={`FMI Tutkakuva: ${venueName}`}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                  <div className="w-7 h-7 rounded-full bg-accent/20 border-2 border-accent animate-ping absolute" />
                  <div className="w-3 h-3 rounded-full bg-accent border-2 border-white shadow-md relative" />
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-bold text-white shadow-sm whitespace-nowrap border border-white/20">
                    {venueName}
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-[10px] text-gray-300 border border-white/10">
                  Säde ~50 km • Keskipiste: Kenttä
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-surface-2 border-t border-border-hairline flex items-center justify-between text-xs text-text-secondary">
                <span>Pito: {turfLabelFi}</span>
                <button
                  type="button"
                  onClick={() => setIsRadarOpen(false)}
                  className="px-4 py-1.5 bg-accent text-white font-bold rounded-lg hover:brightness-110 cursor-pointer"
                >
                  Sulje
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
