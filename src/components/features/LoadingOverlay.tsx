export default function LoadingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="text-6xl anim-sun">🪂</div>
      <div className="text-[hsl(215_14%_60%)] text-sm font-medium">
        Caricamento previsioni volo…
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-[hsl(142_76%_50%)]"
            style={{ animation: `live-pulse 1.4s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}
