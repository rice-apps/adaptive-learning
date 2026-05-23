"use client";

interface Props {
  text: string;
  className?: string;
}

// Render inline: **bold**, *italic*, `code`, $math$
function renderInline(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Order matters: $$ before $, ** before *
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\$\$(.+?)\$\$|\$([^$]+?)\$)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) {
      parts.push(line.slice(last, match.index));
    }

    if (match[2] !== undefined) {
      // **bold**
      parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // *italic*
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      // `code`
      parts.push(
        <code key={match.index} className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono text-gray-800">
          {match[4]}
        </code>
      );
    } else if (match[5] !== undefined) {
      // $$block math inline$$ (rare but handle it)
      parts.push(
        <span key={match.index} className="font-mono italic text-gray-800 bg-gray-50 px-1 rounded">
          {match[5]}
        </span>
      );
    } else if (match[6] !== undefined) {
      // $inline math$
      parts.push(
        <span key={match.index} className="font-mono italic text-gray-800">
          {match[6]}
        </span>
      );
    }

    last = match.index + match[0].length;
  }

  if (last < line.length) {
    parts.push(line.slice(last));
  }

  return parts;
}

export default function FeedbackMarkdown({ text, className }: Props) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // Skip blank lines
    if (line === "") {
      i++;
      continue;
    }

    // Block math $$...$$  (full line)
    if (line.startsWith("$$") && line.endsWith("$$") && line.length > 4) {
      const math = line.slice(2, -2).trim();
      elements.push(
        <div key={i} className="my-3 flex justify-center">
          <span className="font-mono italic text-gray-800 bg-gray-100 rounded px-3 py-1 text-base">
            {math}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Heading #, ##, ###
    if (/^#{1,3}\s/.test(line)) {
      const level = (line.match(/^#+/) as RegExpMatchArray)[0].length;
      const content = line.replace(/^#+\s/, "");
      const cls =
        level === 1
          ? "text-lg font-bold text-gray-900 mt-4 mb-1"
          : level === 2
          ? "text-base font-bold text-gray-800 mt-3 mb-1"
          : "text-sm font-semibold text-gray-800 mt-2 mb-0.5";
      elements.push(
        <p key={i} className={cls}>
          {renderInline(content)}
        </p>
      );
      i++;
      continue;
    }

    // Horizontal rule ---
    if (/^-{3,}$/.test(line)) {
      elements.push(<hr key={i} className="border-gray-200 my-3" />);
      i++;
      continue;
    }

    // Bullet list - or *
    if (/^[-*•]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^[-*•]\s/, "");
        items.push(
          <li key={i} className="text-gray-700">
            {renderInline(content)}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2 pl-2">
          {items}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^\d+\.\s/, "");
        items.push(
          <li key={i} className="text-gray-700">
            {renderInline(content)}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-2 pl-2">
          {items}
        </ol>
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-gray-700 leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {elements}
    </div>
  );
}
