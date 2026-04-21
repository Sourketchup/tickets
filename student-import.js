document.addEventListener('DOMContentLoaded', () => {
  const apiBase = 'https://tickets.sourketchup.workers.dev';
  const studentImportPath = '/students/add';

  const csvFileInput = document.getElementById('csvFile');
  const csvText = document.getElementById('csvText');
  const previewButton = document.getElementById('previewButton');
  const importButton = document.getElementById('importButton');
  const downloadSampleButton = document.getElementById('downloadSampleButton');
  const refreshStudentsButton = document.getElementById('refreshStudentsButton');
  const previewTableBody = document.getElementById('previewTableBody');
  const existingStudentsTableBody = document.getElementById('existingStudentsTableBody');
  const rowCount = document.getElementById('rowCount');
  const validCount = document.getElementById('validCount');
  const invalidCount = document.getElementById('invalidCount');
  const existingCount = document.getElementById('existingCount');
  const duplicateCount = document.getElementById('duplicateCount');

  const notyf = new Notyf({
    types: [
      {
        type: 'info',
        background: '#0c4eb1',
        icon: true
      },
      {
        type: 'error',
        background: '#b10c0c',
        icon: true
      }
    ]
  });

  let parsedRows = [];
  let existingStudents = [];
  let existingStudentIds = new Set();

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showInfo(message) {
    notyf.open({
      type: 'info',
      message,
      icon: '<i class="fas fa-check-circle"></i>'
    });
  }

  function showError(message) {
    notyf.open({
      type: 'error',
      message,
      icon: '<i class="fas fa-times-circle"></i>'
    });
  }

  function normalizeHeader(header) {
    return String(header || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }

  function findValue(record, aliases) {
    for (const alias of aliases) {
      if (record[alias] !== undefined && record[alias] !== null && String(record[alias]).trim() !== '') {
        return String(record[alias]).trim();
      }
    }

    return '';
  }

  function parseCsvLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const nextChar = line[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue);
    return values.map((value) => value.trim());
  }

  function parseCsv(csv) {
    const lines = csv
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!lines.length) {
      return [];
    }

    const rawHeaders = parseCsvLine(lines[0]);
    const headers = rawHeaders.map(normalizeHeader);

    return lines.slice(1).map((line, index) => {
      const values = parseCsvLine(line);
      const record = {};

      headers.forEach((header, headerIndex) => {
        record[header] = values[headerIndex] || '';
      });

      return {
        csvRow: index + 2,
        record
      };
    });
  }

  function normalizeExistingStudent(entry) {
    const normalizedRecord = {};

    Object.entries(entry || {}).forEach(([key, value]) => {
      normalizedRecord[normalizeHeader(key)] = value;
    });

    const studentNumber = findValue(normalizedRecord, ['studentid', 'studentnumber', 'id']);
    const firstName = findValue(normalizedRecord, ['studentfirstname', 'firstname', 'first']);
    const lastName = findValue(normalizedRecord, ['studentlastname', 'lastname', 'last']);
    const timeAdded = findValue(normalizedRecord, ['timeadded']);

    return {
      studentNumber,
      firstName,
      lastName,
      timeAdded
    };
  }

  function applyDuplicateValidation(rows) {
    const csvStudentIds = new Map();

    rows.forEach((row) => {
      if (row.studentNumber) {
        csvStudentIds.set(row.studentNumber, (csvStudentIds.get(row.studentNumber) || 0) + 1);
      }
    });

    rows.forEach((row) => {
      const baseErrors = row.errors.filter((error) => error !== 'Student already exists' && error !== 'Duplicate StudentID in CSV');

      if (row.studentNumber && existingStudentIds.has(row.studentNumber)) {
        baseErrors.push('Student already exists');
      }

      if (row.studentNumber && (csvStudentIds.get(row.studentNumber) || 0) > 1) {
        baseErrors.push('Duplicate StudentID in CSV');
      }

      row.errors = baseErrors;
      row.valid = row.errors.length === 0;
    });
  }

  function toStudentRow(parsedEntry) {
    const record = parsedEntry.record;
    const studentNumber = findValue(record, ['studentid']);
    const firstName = findValue(record, ['studentfirstname']);
    const lastName = findValue(record, ['studentlastname']);
    const timeAdded = findValue(record, ['timeadded']);

    const errors = [];

    if (!studentNumber) {
      errors.push('Missing StudentID');
    }

    if (!firstName) {
      errors.push('Missing StudentFirstName');
    }

    if (!lastName) {
      errors.push('Missing StudentLastName');
    }

    const row = {
      csvRow: parsedEntry.csvRow,
      studentNumber,
      firstName,
      lastName,
      timeAdded,
      valid: errors.length === 0,
      errors
    };

    return row;
  }

  function renderTable(rows) {
    if (!rows.length) {
      previewTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No CSV loaded yet.</td></tr>';
      return;
    }
    previewTableBody.innerHTML = rows.map((row, index) => {
      const statusClass = row.valid ? 'text-success' : 'text-danger';
      const statusText = escapeHtml(row.valid ? 'Ready' : row.errors.join(', '));
      const fullName = escapeHtml(`${row.firstName} ${row.lastName}`.trim() || 'N/A');
      const studentNumber = escapeHtml(row.studentNumber || 'N/A');
      const timeAdded = escapeHtml(row.timeAdded || 'N/A');

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${studentNumber}</td>
          <td>${fullName}</td>
          <td>${timeAdded}</td>
          <td class="${statusClass}">${statusText}</td>
          <td class="text-end">
            <button type="button" class="btn btn-outline-danger btn-sm remove-preview-row" data-row-index="${index}">
              <i class="fa-solid fa-trash"></i> Remove
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderExistingStudentsTable(rows) {
    if (!rows.length) {
      existingStudentsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-4">No students returned from /students/list.</td></tr>';
      return;
    }

    existingStudentsTableBody.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.studentNumber || 'N/A')}</td>
        <td>${escapeHtml(row.lastName || 'N/A')}</td>
        <td>${escapeHtml(row.firstName || 'N/A')}</td>
        <td>${escapeHtml(row.timeAdded || 'N/A')}</td>
      </tr>
    `).join('');
  }

  function updateSummary(rows) {
    rowCount.textContent = rows.length;
    validCount.textContent = rows.filter((row) => row.valid).length;
    invalidCount.textContent = rows.filter((row) => !row.valid).length;
    duplicateCount.textContent = rows.filter((row) => row.errors.includes('Student already exists') || row.errors.includes('Duplicate StudentID in CSV')).length;
    importButton.disabled = !rows.some((row) => row.valid);
  }

  function updateExistingSummary(rows) {
    existingCount.textContent = rows.length;
  }

  async function loadExistingStudents() {
    existingStudentsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-4">Loading student list...</td></tr>';

    try {
      const response = await fetch(`${apiBase}/students/list`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load students list.');
      }

      const rawList = Array.isArray(data) ? data : Array.isArray(data?.students) ? data.students : Array.isArray(data?.data) ? data.data : [];
      existingStudents = rawList
        .map(normalizeExistingStudent)
        .filter((student) => student.studentNumber);

      existingStudentIds = new Set(existingStudents.map((student) => student.studentNumber));
      renderExistingStudentsTable(existingStudents);
      updateExistingSummary(existingStudents);

      if (parsedRows.length) {
        applyDuplicateValidation(parsedRows);
        renderTable(parsedRows);
        updateSummary(parsedRows);
      }
    } catch (error) {
      console.error('Student list error:', error);
      existingStudents = [];
      existingStudentIds = new Set();
      existingStudentsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Could not load /students/list.</td></tr>';
      updateExistingSummary(existingStudents);

      if (parsedRows.length) {
        applyDuplicateValidation(parsedRows);
        renderTable(parsedRows);
        updateSummary(parsedRows);
      }

      showError('Could not load existing students list.');
    }
  }

  async function readCsvSource() {
    if (csvFileInput.files && csvFileInput.files[0]) {
      return csvFileInput.files[0].text();
    }

    return csvText.value.trim();
  }

  async function previewCsv() {
    const csv = await readCsvSource();

    if (!csv) {
      parsedRows = [];
      renderTable(parsedRows);
      updateSummary(parsedRows);
      showError('Choose a CSV file or paste CSV text first.');
      return;
    }

    const parsed = parseCsv(csv).map(toStudentRow);

    if (!parsed.length) {
      parsedRows = [];
      renderTable(parsedRows);
      updateSummary(parsedRows);
      showError('No student rows were found in the CSV.');
      return;
    }

    applyDuplicateValidation(parsed);
    parsedRows = parsed;
    renderTable(parsedRows);
    updateSummary(parsedRows);
    showInfo('CSV preview loaded.');
  }

  function removePreviewRow(index) {
    if (index < 0 || index >= parsedRows.length) {
      return;
    }

    parsedRows.splice(index, 1);
    applyDuplicateValidation(parsedRows);
    renderTable(parsedRows);
    updateSummary(parsedRows);
  }

  async function importStudents() {
    const rowsToImport = parsedRows.filter((row) => row.valid);

    if (!rowsToImport.length) {
      showError('Preview a valid CSV before importing.');
      return;
    }

    importButton.disabled = true;
    importButton.textContent = 'Importing...';

    let successCount = 0;
    let failureCount = 0;

    for (const row of rowsToImport) {
      try {
        const response = await fetch(`${apiBase}${studentImportPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            StudentID: row.studentNumber,
            StudentNumber: row.studentNumber,
            StudentFirstName: row.firstName,
            StudentLastName: row.lastName,
            Time_Added: row.timeAdded || null
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          failureCount += 1;
          row.valid = false;
          row.errors = [errorData?.error || `Import failed (row ${row.csvRow})`];
          continue;
        }

        successCount += 1;
        row.valid = false;
        row.errors = ['Imported'];
      } catch (error) {
        console.error('Import error:', error);
        failureCount += 1;
        row.valid = false;
        row.errors = ['Network or server error'];
      }
    }

    renderTable(parsedRows);
    updateSummary(parsedRows);
    importButton.textContent = 'Import Students';

    if (successCount) {
      await loadExistingStudents();
    }

    if (successCount) {
      showInfo(`Imported ${successCount} student${successCount === 1 ? '' : 's'}.`);
    }

    if (failureCount) {
      showError(`${failureCount} row${failureCount === 1 ? '' : 's'} failed to import.`);
    }
  }

  function downloadSampleCsv() {
    const sampleCsv = [
      'StudentID,StudentLastName,StudentFirstName,Time_Added',
      '12345,Doe,Jane,1713571200',
      '12346,Smith,John,1713571300'
    ].join('\n');

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-import-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  previewButton.addEventListener('click', previewCsv);
  importButton.addEventListener('click', importStudents);
  downloadSampleButton.addEventListener('click', downloadSampleCsv);
  refreshStudentsButton.addEventListener('click', loadExistingStudents);
  previewTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('.remove-preview-row');

    if (!button) {
      return;
    }

    const rowIndex = Number(button.dataset.rowIndex);
    removePreviewRow(rowIndex);
  });

  loadExistingStudents();
});
