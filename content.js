chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendMessage" && request.client) {
    const { mensagem } = request.client;

    const trySendMessage = () => {
      const inputBox = document.querySelector('[contenteditable="true"][data-tab]');
      if (!inputBox) return setTimeout(trySendMessage, 300); // tenta novamente

      // Foca no campo e dispara evento de input real
      inputBox.focus();

      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
      });

      pasteEvent.clipboardData.setData("text/plain", clientData.mensagem);
      inputBox.dispatchEvent(pasteEvent);

      // Aguarda renderização do botão de envio
      setTimeout(() => {
        const sendButton = document.querySelector('button[aria-label="Enviar"]');
        if (sendButton) {
          sendButton.click();
          console.log("✅ Mensagem enviada.");
          sendResponse({ success: true });
        } else {
          console.error("❌ Botão de envio não encontrado.");
          sendResponse({ success: false, error: "Send button not found" });
        }
      }, 500);
    };

    trySendMessage();
    return true; // necessário para manter sendResponse aberto
  }
});
