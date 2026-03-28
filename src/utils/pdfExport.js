/**
 * PDF export via html2pdf.js — tuned so output matches the on-screen preview
 * (fonts, images, width, no clipping from overflow:hidden).
 */

function waitForImages(container) {
  const imgs = [...container.querySelectorAll("img")];
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        })
    )
  );
}

/**
 * @param {HTMLElement} element - Root to capture (e.g. #document-preview)
 * @param {string} filename - Download filename
 */
export async function exportHtmlToPdf(element, filename = "document.pdf") {
  if (!element) return;

  await waitForImages(element);
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );

  element.scrollIntoView({ block: "start", behavior: "instant" });

  const html2pdf = (await import("html2pdf.js")).default;

  const opt = {
    margin: [8, 8, 8, 8],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: -window.scrollY,
      // Use real viewport so Tailwind breakpoints match the on-screen preview
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById(element.id);
        if (!el) return;
        el.style.overflow = "visible";
        el.style.maxHeight = "none";
      },
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    },
    pagebreak: {
      mode: ["css", "legacy"],
    },
  };

  await html2pdf().set(opt).from(element).save();
}
