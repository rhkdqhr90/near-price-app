export interface HighlightPart {
  text: string;
  highlighted: boolean;
}

/**
 * ES highlight 문자열의 <em>...</em> 태그를 파싱해 부분별 배열로 반환
 * 예: "<em>양파</em> 1kg" → [{ text: "양파", highlighted: true }, { text: " 1kg", highlighted: false }]
 */
export const parseHighlight = (html: string): HighlightPart[] => {
  const result: HighlightPart[] = [];
  const parts = html.split(/(<em>.*?<\/em>)/g);

  for (const part of parts) {
    const match = /^<em>(.*?)<\/em>$/.exec(part);
    if (match) {
      result.push({ text: match[1], highlighted: true });
    } else if (part) {
      result.push({ text: part, highlighted: false });
    }
  }

  return result;
};
