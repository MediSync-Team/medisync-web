export interface OpenPrintDocumentOptions {
  /** Pop-up-blocked alert message (already localized). */
  popupBlockedMessage: string;
  /** `window.open` features string. Defaults to a standard PDF window. */
  features?: string;
  /** Delay before triggering the print dialog, so layout/images can settle. */
  printDelayMs?: number;
}

/**
 * Open a new browser window, write a full HTML document into it and trigger the
 * print dialog.
 *
 * Centralizes the pop-up handling shared by every PDF/print generator
 * (certificate, prescription, clinical history, visit history): if the window
 * is blocked it alerts and bails; otherwise it writes the document and prints
 * after a short delay.
 */
export function openPrintDocument(html: string, options: OpenPrintDocumentOptions): void {
  const { popupBlockedMessage, features = 'width=900,height=750', printDelayMs = 600 } = options;

  const win = window.open('', '_blank', features);
  if (!win) {
    alert(popupBlockedMessage);
    return;
  }

  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), printDelayMs);
}
