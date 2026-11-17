
const inputData = document.getElementById("inputData");
const outputData = document.getElementById("outputData");
const status = document.getElementById("status");

const processBtn = document.getElementById("processBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");

// FORMAT NOMINAL
function formatNominal(value) {
  const number = String(value).replace(/[^\d]/g, "");
  if (!number) return value;

  return Number(number).toLocaleString("id-ID");
}

// PROSES DATA
function processData() {
  const raw = inputData.value.trim();

  if (!raw) {
    outputData.value = "";
    status.textContent = "Siap membaca transaksi!";
    return;
  }

  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== "");

  let transactions = [];

  // FORMAT TABEL DENGAN PEMISAH | ATAU TAB
  if (
    lines.some(line => line.includes("|") || line.includes("\t"))
  ) {
    const rows = lines.map(line =>
      line.split(/\s*\|\s*|\t/).map(v => v.trim())
    );

    const headerIndex = rows.findIndex(row =>
      row.some(cell => cell.toUpperCase() === "BANK") &&
      row.some(cell => cell.toUpperCase() === "NOMOR")
    );

    if (headerIndex !== -1) {
      const headers = rows[headerIndex].map(v => v.toUpperCase());

      const bankIndex = headers.indexOf("BANK");
      const nomorIndex = headers.indexOf("NOMOR");
      const namaIndex = headers.indexOf("NAMA");
      const nominalIndex = headers.indexOf("NOMINAL");
      const idIndex = headers.indexOf("ID");

      rows.slice(headerIndex + 1).forEach(row => {
        if (row.length < headers.length) return;

        transactions.push({
          bank: row[bankIndex],
          nomor: row[nomorIndex],
          nama: row[namaIndex],
          nominal: row[nominalIndex],
          id: row[idIndex]
        });
      });
    } else {
      rows.forEach(row => {
        if (row.length >= 5) {
          transactions.push({
            bank: row[0],
            nomor: row[1],
            nama: row[2],
            nominal: row[3],
            id: row[4]
          });
        }
      });
    }
  }

  // FORMAT 5 BARIS PER TRANSAKSI
  else {
    for (let i = 0; i + 4 < lines.length; i += 5) {
      transactions.push({
        bank: lines[i],
        nomor: lines[i + 1],
        nama: lines[i + 2],
        nominal: lines[i + 3],
        id: lines[i + 4]
      });
    }
  }

  // SUSUN HASIL
  const results = transactions
    .filter(t =>
      t.bank && t.nomor && t.nama && t.nominal && t.id
    )
    .map(t => {
      return [
        `ID : ${t.id}`,
        `${t.bank},${t.nama},${t.nomor}`,
        `NOMINAL : ${formatNominal(t.nominal)}`
      ].join("\n");
    });

  outputData.value = results.join("\n\n");

  if (results.length > 0) {
    status.textContent =
      `✓ Berhasil membaca ${results.length} transaksi!`;
  } else {
    status.textContent =
      "⚠ Format data belum sesuai atau belum lengkap.";
  }
}

// OTOMATIS SAAT MENGETIK / PASTE
inputData.addEventListener("input", processData);

// TOMBOL PROSES MANUAL TETAP BISA DIGUNAKAN
if (processBtn) {
  processBtn.addEventListener("click", processData);
}

// RESET
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    inputData.value = "";
    outputData.value = "";
    status.textContent = "Siap membaca transaksi!";
  });
}

// SALIN HASIL
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    if (!outputData.value.trim()) {
      status.textContent = "⚠ Belum ada hasil untuk disalin!";
      return;
    }

    try {
      await navigator.clipboard.writeText(outputData.value);
      status.textContent = "✓ Hasil berhasil disalin!";
    } catch (error) {
      outputData.select();
      document.execCommand("copy");
      status.textContent = "✓ Hasil berhasil disalin!";
    }
  });
}
