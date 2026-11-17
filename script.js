
const inputData = document.getElementById("inputData");
const outputData = document.getElementById("outputData");
const status = document.getElementById("status");

const processBtn = document.getElementById("processBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");

// MEMBERSIHKAN DATA
function clean(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x20;/gi, " ")
    .replace(/&#32;/gi, " ")
    .replace(/&amp;/gi, "&")
    .trim();
}

// FORMAT NOMINAL
function formatNominal(value) {
  const number = clean(value).replace(/[^\d]/g, "");
  if (!number) return "";

  return Number(number).toLocaleString("id-ID");
}

// PROSES DATA OTOMATIS
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
    .filter(Boolean);

  let transactions = [];

  // FORMAT 2: TABEL MARKDOWN / PIPE
  if (lines.some(line => line.includes("|"))) {

    const rows = lines
      .filter(line => !/^\s*\|?\s*:?-{3,}/.test(line))
      .map(line =>
        line.split("|")
          .map(cell => clean(cell))
          .filter((cell, index, arr) =>
            !(index === 0 && cell === "") &&
            !(index === arr.length - 1 && cell === "")
          )
      );

    const headers = rows[0].map(h =>
      h.toUpperCase().trim()
    );

    const idIndex = headers.indexOf("ID");
    const namaIndex = headers.indexOf("NAMA");
    const bankIndex = headers.indexOf("BANK");
    const nomorIndex = headers.indexOf("NOMOR");
    const nominalIndex = headers.indexOf("NOMINAL");

    if ([idIndex, namaIndex, bankIndex, nomorIndex, nominalIndex]
      .some(index => index === -1)) {
      status.textContent = "⚠ Kolom tabel tidak dikenali!";
      outputData.value = "";
      return;
    }

    rows.slice(1).forEach(row => {
      if (row.length < headers.length) return;

      transactions.push({
        id: row[idIndex],
        nama: row[namaIndex],
        bank: row[bankIndex],
        nomor: row[nomorIndex],
        nominal: row[nominalIndex]
      });
    });

  }

  // FORMAT 1: LIMA BARIS PER TRANSAKSI
  else {

    for (let i = 0; i + 4 < lines.length; i += 5) {
      transactions.push({
        bank: clean(lines[i]),
        nomor: clean(lines[i + 1]),
        nama: clean(lines[i + 2]),
        nominal: clean(lines[i + 3]),
        id: clean(lines[i + 4])
      });
    }

  }

  // SUSUN HASIL AKHIR
  const results = transactions
    .filter(t =>
      t.id && t.nama && t.bank && t.nomor && t.nominal
    )
    .map(t => {
      return [
        `ID : ${clean(t.id)}`,
        `${clean(t.bank)},${clean(t.nama)},${clean(t.nomor)}`,
        `NOMINAL : ${formatNominal(t.nominal)}`
      ].join("\n");
    });

  outputData.value = results.join("\n\n");

  status.textContent = results.length
    ? `✓ Berhasil membaca ${results.length} transaksi!`
    : "⚠ Data belum sesuai format!";
}

// OTOMATIS SAAT INPUT / PASTE
inputData.addEventListener("input", processData);

// TOMBOL PROSES TETAP BERFUNGSI
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
      status.textContent = "⚠ Belum ada hasil!";
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
