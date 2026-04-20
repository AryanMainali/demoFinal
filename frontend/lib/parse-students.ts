import * as XLSX from 'xlsx';

export interface ParsedStudentRow {
    email: string;
    full_name?: string;
    student_id: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ULM_STUDENT_DOMAIN = 'warhawks.ulm.edu';

function isValidEmail(s: string): boolean {
    return EMAIL_REGEX.test((s || '').trim().toLowerCase());
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if ((c === ',' || c === '\t') && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += c;
        }
    }

    result.push(current);
    return result;
}

function normalizeHeader(h: string): string {
    return (h || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function deriveNameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || '';
    const tokens = localPart.split(/[._\-\s]+/).filter(Boolean);
    if (!tokens.length) return 'Student';
    return tokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
}

function normalizeLoginToEmail(value: string): string {
    const login = (value || '').trim().toLowerCase();
    if (!login) return '';
    if (isValidEmail(login)) return login;
    return `${login}@${ULM_STUDENT_DOMAIN}`;
}

function getByHeaders(
    cells: string[],
    headerToIndex: Map<string, number>,
    keys: string[]
): string {
    for (const key of keys) {
        const idx = headerToIndex.get(key);
        if (idx === undefined) continue;
        const value = (cells[idx] || '').trim();
        if (value) return value;
    }
    return '';
}

function mapRowByHeaders(cells: string[], headers: string[]): ParsedStudentRow | null {
    const headerToIndex = new Map<string, number>();
    headers.forEach((h, i) => headerToIndex.set(normalizeHeader(h), i));

    // Accept both Kriterion template and Canvas exports.
    const email = getByHeaders(cells, headerToIndex, ['email', 'student_email', 'studentemail']).toLowerCase()
        || normalizeLoginToEmail(getByHeaders(cells, headerToIndex, ['sis_login_id', 'sis_loginid', 'login_id', 'loginid']));
    if (!isValidEmail(email)) return null;

    const fullNameRaw = getByHeaders(cells, headerToIndex, ['full_name', 'name', 'student_name']);
    const firstName = getByHeaders(cells, headerToIndex, ['first_name', 'firstname']);
    const lastName = getByHeaders(cells, headerToIndex, ['last_name', 'lastname']);
    const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const studentIdRaw = getByHeaders(cells, headerToIndex, ['student_id', 'studentid', 'sis_userid', 'sis_user_id', 'cwid']);
    if (!studentIdRaw) return null;

    return {
        email,
        full_name: fullNameRaw || combinedName || deriveNameFromEmail(email),
        student_id: studentIdRaw,
    };
}

function dedupeRows(rows: ParsedStudentRow[]): ParsedStudentRow[] {
    const seen = new Set<string>();
    const out: ParsedStudentRow[] = [];
    for (const row of rows) {
        if (seen.has(row.email)) continue;
        seen.add(row.email);
        out.push(row);
    }
    return out;
}

export async function parseStudentsFromFile(file: File): Promise<ParsedStudentRow[]> {
    const ext = (file.name || '').toLowerCase().split('.').pop();

    if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (!lines.length) return [];

        const headers = parseCSVLine(lines[0]).map((h) => h.trim());
        const startRow = headers.some((h) => normalizeHeader(h).includes('email')) ? 1 : 0;

        const rows: ParsedStudentRow[] = [];
        for (let i = startRow; i < lines.length; i++) {
            const cells = parseCSVLine(lines[i]).map((c) => c.trim());
            const parsed = mapRowByHeaders(cells, headers);
            if (parsed) rows.push(parsed);
        }

        return dedupeRows(rows);
    }

    if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const workbook = XLSX.read(buf, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) return [];

        const sheet = workbook.Sheets[firstSheet];
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, {
            header: 1,
            defval: '',
        }) as string[][];
        if (!data.length) return [];

        const headers = (data[0] || []).map((c) => String(c || '').trim());
        const startRow = headers.some((h) => normalizeHeader(h).includes('email')) ? 1 : 0;

        const rows: ParsedStudentRow[] = [];
        for (let i = startRow; i < data.length; i++) {
            const cells = (data[i] || []).map((c) => String(c || '').trim());
            const parsed = mapRowByHeaders(cells, headers);
            if (parsed) rows.push(parsed);
        }

        return dedupeRows(rows);
    }

    return [];
}
