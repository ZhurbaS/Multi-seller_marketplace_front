import React from "react";

// Безпечний показ тексту оферти (без HTML): ## / ### заголовки, «- » списки, **жирний**, абзаци через порожній рядок.
const inline = (text, keyPrefix) =>
  String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
      )
    );

export function LegalText({ text }) {
  const blocks = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-col gap-3 leading-relaxed">
      {blocks.map((b, i) => {
        if (b.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-2">{inline(b.slice(4), i)}</h3>;
        if (b.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-4">{inline(b.slice(3), i)}</h2>;
        if (b.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-4">{inline(b.slice(2), i)}</h1>;
        if (b.split("\n").every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc pl-6 flex flex-col gap-1">
              {b.split("\n").map((l, j) => (
                <li key={j}>{inline(l.slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {inline(b, i)}
          </p>
        );
      })}
    </div>
  );
}
