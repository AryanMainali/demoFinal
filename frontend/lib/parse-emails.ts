import * as XLSX from 'xlsx';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WARHAWKS_DOMAIN = '@warhawks.ulm.edu';

// Required Canvas column: SIS Login ID (used to construct email)
// Optional but expected: LastName, FirstName, ID, SIS User ID
const CANVAS_REQUIRED_COLS = ['sis login id'];
const CANVAS_EXPECTED_COLS = ['lastname', 'firstname', 'id', 'sis user id', 'sis login id'];

export interface CanvasParseResult {
    emails: string[];
    /** Rows where SIS Login ID was missing/blank */
    missing: string[];
    /** True only if the file has valid Canvas-format headers */
    isValidFormat: boolean;
    /** Human-readable reason if format is invalid */
    invalidReason?: string;
    /** Parsed Canvas student records (for individual enrollment use) */
    students: CanvasStudent[];
}

export interface CanvasStudent {
    email: string;
    first_name: string;
    last_name: string;
    canvas_user_id: string;
    cwid: string;
    sis_login_id: string;
}

function isValidEmail(s: string): boolean {
    return !!s.trim() && EMAIL_REGEX.test(s.trim().toLowerCase());
}

function extractEmails(text: string): string[] {
    return text
        .split(/[\n,;\t]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(isValidEmail);
}

/** Simple CSV line parser that handles quoted values */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if ((c === ',' || c === '\t') && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += c;
        }
    }
    result.push(current.trim());
    return result;
}

function findColumnIndex(headers: string[], keywords: string[]): number {
    return headers.findIndex((h) =>
        keywords.some((kw) => h.toLowerCase().replace(/\s+/g, ' ').trim() === kw)
    );
}

function findColumnIndexLoose(headers: string[], keywords: string[]): number {
    return headers.findIndex((h) =>
        keywords.some((kw) => h.toLowerCase().includes(kw))
    );
}

function validateCanvasHeaders(headerCells: string[]): { valid: boolean; reason?: string } {
    const normalized = headerCells.map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim());
    const hasRequired = CANVAS_REQUIRED_COLS.every((col) =>
        normalized.some((h) => h === col || h.includes(col))
    );
    if (!hasRequired) {
        const found = normalized.filter(Boolean).join(', ');
        return {
            valid: false,
            reason: `Missing required column "SIS Login ID". Found columns: ${found || '(none)'}`,
        };
    }
    return { valid: true };
}

/**
 * Parse a Canvas People export CSV text.
 * Expected columns: LastName, FirstName, ID, SIS User ID, SIS Login ID
 */
export function parseCanvasCSV(text: string): CanvasParseResult {
    // Strip BOM if present
    const cleaned = text.replace(/^\uFEFF/, '');
    const lines = cleaned.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length === 0) {
        return { emails: [], missing: [], students: [], isValidFormat: false, invalidReason: 'File is empty.' };
    }

    const headerCells = parseCSVLine(lines[0]);
    const validation = validateCanvasHeaders(headerCells);
    if (!validation.valid) {
        return { emails: [], missing: [], students: [], isValidFormat: false, invalidReason: validation.reason };
    }

    const norm = headerCells.map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim());
    const sisLoginIdx = findColumnIndex(norm, ['sis login id']) >= 0
        ? findColumnIndex(norm, ['sis login id'])
        : findColumnIndexLoose(norm, ['sis login id', 'login id']);
    const firstNameIdx = findColumnIndexLoose(norm, ['firstname', 'first name', 'first_name']);
    const lastNameIdx = findColumnIndexLoose(norm, ['lastname', 'last name', 'last_name']);
    const canvasIdIdx = findColumnIndexLoose(norm, ['canvas user id', 'canvas_user_id']);
    // "ID" column - careful: look for exact "id" to avoid matching "sis user id"
    const idIdx = norm.findIndex((h) => h === 'id');
    const sisUserIdIdx = findColumnIndexLoose(norm, ['sis user id', 'sis_user_id']);

    const emails: string[] = [];
    const missing: string[] = [];
    const students: CanvasStudent[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cells = parseCSVLine(lines[i]);
        if (cells.every((c) => !c)) continue;

        const sisLogin = sisLoginIdx >= 0 ? (cells[sisLoginIdx] || '') : '';
        const firstName = firstNameIdx >= 0 ? (cells[firstNameIdx] || '') : '';
        const lastName = lastNameIdx >= 0 ? (cells[lastNameIdx] || '') : '';
        const canvasId = canvasIdIdx >= 0 ? (cells[canvasIdIdx] || '') : (idIdx >= 0 ? (cells[idIdx] || '') : '');
        const cwid = sisUserIdIdx >= 0 ? (cells[sisUserIdIdx] || '') : '';

        if (sisLogin) {
            const email = sisLogin.includes('@') ? sisLogin.toLowerCase() : `${sisLogin.toLowerCase()}${WARHAWKS_DOMAIN}`;
            emails.push(email);
            students.push({ email, first_name: firstName, last_name: lastName, canvas_user_id: canvasId, cwid, sis_login_id: sisLogin });
        } else {
            const name = [firstName, lastName].filter(Boolean).join(' ') || `Row ${i + 1}`;
            missing.push(name);
        }
    }

    return { emails: [...new Set(emails)], missing, students, isValidFormat: true };
}

export async function parseCanvasCSVFile(file: File): Promise<CanvasParseResult> {
    const text = await file.text();
    return parseCanvasCSV(text);
}

/**
 * Generic file parser for bulk enrollment.
 * - CSV/XLSX: tries Canvas format first, falls back to email column
 * - TXT: splits by delimiters
 */
export async function parseEmailsFromFile(file: File): Promise<string[]> {
    const ext = (file.name || '').toLowerCase().split('.').pop();

    if (ext === 'txt') {
        const text = await file.text();
        return extractEmails(text);
    }

    if (ext === 'csv') {
        const text = await file.text();
        const result = parseCanvasCSV(text);
        if (result.isValidFormat) return result.emails;
        // Fallback: email column
        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
        const header = (lines[0] || '').toLowerCase();
        const startRow = header.includes('email') ? 1 : 0;
        const emails: string[] = [];
        for (let i = startRow; i < lines.length; i++) {
            const cells = parseCSVLine(lines[i]);
            const cell = (cells[0] || '').toLowerCase();
            if (isValidEmail(cell)) emails.push(cell);
        }
        return emails;
    }

    if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const firstSheet = wb.SheetNames[0];
        if (!firstSheet) return [];
        const sheet = wb.Sheets[firstSheet];
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
        if (data.length === 0) return [];
        const headerRow = (data[0] || []).map((c) => String(c || '').toLowerCase().replace(/\s+/g, ' ').trim());
        const sisLoginIdx = headerRow.findIndex((h) => h === 'sis login id' || h.includes('sis login'));
        if (sisLoginIdx >= 0) {
            const emails: string[] = [];
            for (let i = 1; i < data.length; i++) {
                const val = String((data[i] || [])[sisLoginIdx] ?? '').trim();
                if (val) {
                    const email = val.includes('@') ? val.toLowerCase() : `${val.toLowerCase()}${WARHAWKS_DOMAIN}`;
                    emails.push(email);
                }
            }
            return [...new Set(emails)];
        }
        // Fallback: email column
        const emailColIdx = headerRow.findIndex((h) => h.includes('email'));
        const startRow = emailColIdx >= 0 ? 1 : 0;
        const emails: string[] = [];
        for (let i = startRow; i < data.length; i++) {
            const cell = String((data[i] || [])[emailColIdx >= 0 ? emailColIdx : 0] ?? '').trim().toLowerCase();
            if (isValidEmail(cell)) emails.push(cell);
        }
        return emails;
    }

    const text = await file.text();
    return extractEmails(text);
}
