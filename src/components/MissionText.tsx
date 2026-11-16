import { isSafeUrl } from "@/lib/types";

export function MissionText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/gi);
  return (
    <div className="mission">
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return <span key={index}>{part}</span>;
        const href = part.replace(/[),.;]+$/, "").replace(/[가-힣]+$/u, "");
        const trail = part.slice(href.length);
        if (!isSafeUrl(href)) return <span key={index}>{part}</span>;
        return (
          <span key={index}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {href}
            </a>
            {trail}
          </span>
        );
      })}
    </div>
  );
}
