/**
 * Utilitários para exportação de dados em CSV.
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] ?? "";
        // Escapar aspas e vírgulas para CSV
        const escaped = ("" + value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")
    )
  ];
  
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Placeholder para exportação PDF (reutilizando lógica se disponível no projeto).
 */
export function exportToPDF(elementId: string, filename: string) {
  console.log(`Solicitada exportação PDF para ${elementId} -> ${filename}`);
  // No navegador real, isso usaria bibliotecas como jspdf + html2canvas
}
