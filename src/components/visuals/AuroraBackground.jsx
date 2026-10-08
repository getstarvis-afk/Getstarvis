/**
 * The dark-premium backdrop: deep-navy base + drifting azure/iris aurora blobs,
 * a faint masked grid, and a fine noise grain to kill digital flatness.
 * Purely decorative — sits behind content, captures no pointer events.
 */
export default function AuroraBackground({ className = '', showGrid = true }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-navy-900" />

      {/* Aurora light field */}
      <div className="absolute -left-[12%] -top-[22%] h-[58vh] w-[58vh] rounded-full bg-azure/25 blur-[130px] animate-aurora" />
      <div className="absolute right-[-12%] top-[4%] h-[52vh] w-[52vh] rounded-full bg-iris/25 blur-[130px] animate-aurora [animation-delay:-6s]" />
      <div className="absolute bottom-[-24%] left-[28%] h-[48vh] w-[48vh] rounded-full bg-[#4f7dff]/20 blur-[130px] animate-aurora [animation-delay:-11s]" />

      {/* Engineering grid */}
      {showGrid && (
        <div className="absolute inset-0 bg-grid-faint bg-[size:46px_46px] [mask-image:radial-gradient(ellipse_at_50%_30%,black,transparent_72%)]" />
      )}

      {/* Grain */}
      <div className="absolute inset-0 noise" />
    </div>
  );
}
