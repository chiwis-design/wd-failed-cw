
const inputData = document.getElementById("inputData");
const outputData = document.getElementById("outputData");
const status = document.getElementById("status");

const processBtn = document.getElementById("processBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");

function clean(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x20;/gi, " ")
    .replace(/&#32;/gi, " ")
    .replace(/&amp;/gi, "&")
    .trim();
}

function formatNominal(value) {
  const digits = clean(value).replace(/[^\d]/g, "");
  return digits ? Number(digits).toLocaleString("id-ID") : "";
}

function isPhone(value) {
  const digits = clean(value).replace(/\D/g, "");
  return /^\+?[\d\s().-]+$/.test(clean(value)) &&
    digits.length >= 9 && digits.length <= 15;
}

function isNominal(value) {
  return /^[\d.,\s]+$/.test(clean(value)) &&
    clean(value).replace(/\D/g, "").length > 0;
}

function processData() {
  const raw = inputData.value.trim();

  if (!raw) {
    outputData.value = "";
    status.textContent = "Siap membaca transaksi!";
    return;
  }

  const lines = raw
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);

  let transactions = [];

  // FORMAT TABEL PIPE
  if (lines.some(line => line.includes("|"))) {
    const rows = lines
      .filter(line => !/^\s*\|?\s*:?-{3,}/.test(line))
      .map(line => {
        let cells = line.split("|").map(clean);
        if (!cells[0]) cells.shift();
        if (!cells[cells.length - 1]) cells.pop();
        return cells;
      })
      .filter(row => row.length >= 5);

    if (rows.length) {
      const headers = rows[0].map(v => v.toUpperCase());
      const hasHeader = ["ID", "NAMA", "BANK", "NOMOR", "NOMINAL"]
        .every(h => headers.includes(h));

      const idx = hasHeader ? {
        id: headers.indexOf("ID"),
        nama: headers.indexOf("NAMA"),
        bank: headers.indexOf("BANK"),
        nomor: headers.indexOf("NOMOR"),
        nominal: headers.indexOf("NOMINAL")
      } : {
        id: 0, nama: 1, bank: 2, nomor: 3, nominal: 4
      };

      (hasHeader ? rows.slice(1) : rows).forEach(row => {
        transactions.push({
          id: row[idx.id],
          nama: row[idx.nama],
          bank: row[idx.bank],
          nomor: row[idx.nomor],
          nominal: row[idx.nominal]
        });
      });
    }
  }

  // FORMAT TIGA BARIS:
  // ID NAMA BANK
  // NOMOR HP
  // NOMINAL
  else {
    let foundThreeLine = false;

    for (let i = 1; i < lines.length - 1; i++) {
      if (
        isPhone(lines[i]) &&
        isNominal(lines[i + 1])
      ) {
        const identity = lines[i - 1].trim().split(/\s+/);

        if (identity.length >= 3) {
          transactions.push({
            id: identity[0],
            nama: identity.slice(1, -1).join(" "),
            bank: identity[identity.length - 1],
            nomor: lines[i],
            nominal: lines[i + 1]
          });

          foundThreeLine = true;
        }
      }
    }

    // FORMAT TAB 5 KOLOM
    if (!foundThreeLine && lines.some(line => line.includes("\t"))) {
      lines.forEach(line => {
        const row = line.split("\t").map(clean);
        if (row.length < 5) return;

        transactions.push({
          id: row[0],
          nama: row[1],
          bank: row[2],
          nomor: row[3],
          nominal: row[4]
        });
      });
    }

    // FORMAT LAMA 5 BARIS
    if (!foundThreeLine && !lines.some(line => line.includes("\t"))) {
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
  }

  const results = transactions
    .filter(t =>
      t.id && t.nama && t.bank && t.nomor && t.nominal
    )
    .map(t => [
      `ID : ${clean(t.id)}`,
      `${clean(t.bank)},${clean(t.nama)},${clean(t.nomor)}`,
      `NOMINAL : ${formatNominal(t.nominal)}`
    ].join("\n"));

  outputData.value = results.join("\n\n");

  status.textContent = results.length
    ? `✓ Berhasil membaca ${results.length} transaksi!`
    : "⚠ Format data belum sesuai atau belum lengkap.";
}

// PROSES OTOMATIS
inputData.addEventListener("input", processData);

// TOMBOL PROSES
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
