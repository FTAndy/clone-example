type SourceSubtitleData = {
  body: [
    {
      from: number;
      to: number;
      location: number;
      // "[Dave Chappelle] <i>This... is... surreal.</i>"
      content: string;
    },
  ];
};

export const formatSrtTime = (time: number) => {
  if (!time) return '00:00:00,000';

  const hours = Math.floor(time / 60 / 60);
  const minutes = Math.floor((time / 60) % 60);
  const seconds = Math.floor(time % 60);
  const ms = Math.floor((time % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms
    .toString()
    .padStart(3, '0')}`;
};

// copy from https://github.com/IndieKKY/bilibili-subtitle/blob/d9d905facbfeadbddc90f4e708ad572008f30ffe/src/biz/MoreBtn.tsx
export function generateSrtSubtitle(sourceJSONData: SourceSubtitleData) {
  let s = '';
  for (const [index, item] of sourceJSONData.body.entries()) {
    const ss =
      index +
      1 +
      '\n' +
      formatSrtTime(item.from) +
      ' --> ' +
      formatSrtTime(item.to) +
      '\n' +
      (item.content?.trim() ?? '') +
      '\n\n';
    s += ss;
  }
  s = s.substring(0, s.length - 1); // remove last '\n'
  return s;
  // fileName = 'download.srt'
}
