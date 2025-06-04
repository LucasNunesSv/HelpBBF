let clientsQueue = [];
let sending = false;
let whatsappTabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendMessages") {
    if (sending) {
      sendResponse({ success: false, error: "Envio já está em andamento." });
      return;
    }
    clientsQueue = request.clients;
    sending = true;
    startSending();
    sendResponse({ success: true });
  }
  return true; // Necessário para manter sendResponse válido de forma assíncrona
});

async function startSending() {
  if (clientsQueue.length === 0) {
    sending = false;
    if (whatsappTabId !== null) {
      chrome.tabs.remove(whatsappTabId);
      whatsappTabId = null;
    }
    return;
  }

  const client = clientsQueue.shift();
  const url = `https://web.whatsapp.com/send?phone=${client.telefone}&text=${encodeURIComponent(client.mensagem)}`;

  // Reutiliza aba se já estiver aberta
  if (whatsappTabId === null) {
    chrome.tabs.create({ url, active: false }, (tab) => {
      whatsappTabId = tab.id;
      injectAndSend(client);
    });
  } else {
    chrome.tabs.update(whatsappTabId, { url }, () => {
      injectAndSend(client);
    });
  }
}

function injectAndSend(client) {
  // Espera mais tempo para garantir que a conversa carregue
  const delayBeforeInject = getRandomInt(7000, 10000); // 7 a 10 segundos

  setTimeout(() => {
    chrome.scripting.executeScript({
      target: { tabId: whatsappTabId },
      func: (clientData) => {
        const trySendMessage = () => {
          const inputBox = document.querySelector('[contenteditable="true"][data-tab]');
          if (!inputBox) return false;

          inputBox.focus();
          inputBox.textContent = clientData.mensagem;

          const inputEvent = new InputEvent("input", {
            bubbles: true,
            cancelable: true,
            inputType: "insertText",
            data: clientData.mensagem
          });
          inputBox.dispatchEvent(inputEvent);

          const sendButton = document.querySelector('button[aria-label="Enviar"]');
          if (sendButton) {
            sendButton.click();
            return true;
          }
          return false;
        };

        let attempts = 0;
        const interval = setInterval(() => {
          const sent = trySendMessage();
          if (sent || attempts > 15) {
            clearInterval(interval);
          }
          attempts++;
        }, 1000);
      },
      args: [client]
    }, () => {
      // Tempo aleatório após o envio da mensagem
      const delayAfterSend = getRandomInt(8000, 12000); // 8 a 12 segundos
      setTimeout(() => {
        startSending();
      }, delayAfterSend);
    });
  }, delayBeforeInject);
}

// Gera um número inteiro aleatório entre min e max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}