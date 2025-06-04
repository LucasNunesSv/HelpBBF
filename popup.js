document.getElementById("sendBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("Selecione uma planilha primeiro!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    const clients = [];

    json.forEach((row) => {
      const nome = row["nome"];
      const tels = [row["TEL_1"], row["TEL_2"], row["TEL_3"]].filter(Boolean);

      tels.forEach((tel) => {
        const numero = tel.replace(/\D/g, ""); // remove tudo que não é número
        if (numero.length >= 10) {
          clients.push({
            nome,
            telefone: "55" + numero,
            mensagem: `Ola ${nome}, tudo bem?

            te amo meu nenem`
          });
        }
      });
    });

    if (clients.length === 0) {
      alert("Nenhum número válido encontrado.");
      return;
    }

    chrome.runtime.sendMessage({ action: "sendMessages", clients });
  };

  reader.readAsArrayBuffer(file);
});
