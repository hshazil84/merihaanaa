export function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(score);
        const partial = !filled && i < score;
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", width: "14px", height: "14px" }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="rgb(210,190,150)"
                strokeWidth="1.5"
                fill="rgb(240,234,220)"
              />
            </svg>
            {(filled || partial) && (
              <span style={{
                position: "absolute", top: 0, left: 0,
                width: partial ? `${(score % 1) * 100}%` : "100%",
                overflow: "hidden", display: "inline-block",
              }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="rgb(200,160,60)">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
      <span style={{
        fontFamily: '"MVTypewriter", sans-serif',
        fontSize: "11px",
        color: "rgb(140,130,100)",
        marginRight: "4px",
        lineHeight: 1,
      }}>
        {score}/5
      </span>
    </div>
  );
}
