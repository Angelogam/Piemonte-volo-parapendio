export default function LoadingOverlay() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 card-shadow">
      <div className="text-5xl anim-sun">🪂</div>
      <div className="font-bold text-gray-700 text-base">Caricamento previsioni...</div>
      <div className="text-sm text-gray-400">Connessione a Open-Meteo API</div>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-emerald-400 live-dot" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
    </div>
  );
}
