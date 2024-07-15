export const pdfProcessor = (content: string) => {

  const pdfRegex =
    /\[([^\]]+)\]\(\s*(?:<a[^>]*href=")?(https?:\/\/[^\s)]+\.pdf)(?:"[^>]*>.*?<\/a>)?\s*\)/g;

  const pdfEmbed = (text: string, pdfLink: string) => {

    const filenameMatch = pdfLink.match(/\/([^/]+\.pdf)$/);
    const filename = filenameMatch ? filenameMatch[1] : 'Unknown File';

    return `<div class="bg-gray-300 p-2 my-2 w-auto inline-flex rounded-xl">
            <a href="${pdfLink}" target="_blank" class="flex items-center gap-2">
          <img src="/svgs/notesvgs/pdf.svg" alt="${text} pdf" class="w-7 h-7" />
          <p>${filename}</p>
      </a>
    </div>`;
  };

  content = content.replace(pdfRegex, (_, text, pdfLink) =>
    pdfEmbed(text, pdfLink),
  );
  
  return content;
};
