export function exportToCsv(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) {
    console.error("No data provided for CSV export.");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(fieldName => {
        let fieldValue = row[fieldName];
        if (fieldValue === null || fieldValue === undefined) {
          return '';
        }
        // Escape quotes and handle commas
        let stringValue = String(fieldValue);
        if (stringValue.includes('"') || stringValue.includes(',')) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}