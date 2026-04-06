import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import arabicReshaper from 'arabic-reshaper';

// Types
type TableRow = { id: number; indicator: string; evaluation: string; score: string; };
type Section = { id: number; title: string; content: string[]; };
type FormData = {
    title: string;
    name: string;
    education: string;
    tableRows: TableRow[];
    strengths: Section[];
    weaknesses: Section[];
    summary: string;
    componentsHeader: string;
    scoringHeader: string;
    summaryTitle: string;
};

// Helper: Reshape Persian text
const reshapePersian = (text: string): string => {
    if (!text) return '';
    try {
        return arabicReshaper.convertArabic(text);
    } catch (e) {
        return text;
    }
};

export const generateVectorPDF = async (data: FormData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // --- FONT LOADING ---
    const fontPath = '/fonts/Vazirmatn-VariableFont_wght.ttf';

    try {
        const response = await fetch(fontPath);
        if (!response.ok) throw new Error('Font file not found');

        const fontBlob = await response.blob();
        const arrayBuffer = await fontBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        uint8Array.forEach((byte) => {
            binaryString += String.fromCharCode(byte);
        });
        const base64Font = btoa(binaryString);

        doc.addFileToVFS('Vazirmatn-VariableFont_wght.ttf', base64Font);
        doc.addFont('Vazirmatn-VariableFont_wght.ttf', 'Vazirmatn', 'normal');
        doc.addFont('Vazirmatn-VariableFont_wght.ttf', 'Vazirmatn', 'bold');

    } catch (error) {
        console.error('Font loading error:', error);
        alert('خطا: فایل فونت یافت نشد.');
        return;
    }

    // --- CONSTANTS & COLORS ---
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    let cursorY = 10;

    const colors = {
        blueHeader: '#eff6ff',
        orangeHeader: '#fff7ed',
        redSection: '#fef2f2',
        grayBorder: '#d1d5db',
        grayText: '#1f2937',
        orangeScore: '#ea580c',
    };

    // --- HELPER: TEXT RENDERING ---
    const addRtlText = (text: string, x: number, y: number, size: number, align: 'right' | 'center' | 'left' = 'right', style: 'normal' | 'bold' = 'normal') => {
        doc.setFont('Vazirmatn', style);
        doc.setFontSize(size);
        const reshapedText = reshapePersian(text);
        // Use the passed 'x' directly. For center, 'x' must be the center point.
        // For right, 'x' must be the right edge.
        doc.text(reshapedText, x, y, { align: align, baseline: 'top' });
    };

    // --- HEADER ---
    doc.setFillColor(colors.blueHeader);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setDrawColor(colors.grayBorder);
    doc.line(0, 25, pageWidth, 25);

    addRtlText(data.title, pageWidth / 2, 8, 18, 'center', 'bold');
    cursorY = 30;

    // --- INFO SECTION (FIXED) ---
    const infoHeight = 12;
    const cellWidth = contentWidth / 2;

    // Right Cell (Name) -> Center point is margin + cellWidth/2
    doc.setFillColor('#f9fafb');
    doc.rect(margin, cursorY, cellWidth, infoHeight, 'FD');
    // FIX: Calculate specific center point for this cell
    addRtlText(data.name, margin + (cellWidth / 2), cursorY + 3, 12, 'center', 'bold');

    // Left Cell (Education) -> Center point is margin + cellWidth + cellWidth/2
    doc.setFillColor('#ffffff');
    doc.rect(margin + cellWidth, cursorY, cellWidth, infoHeight, 'FD');
    // FIX: Calculate specific center point for this cell
    addRtlText(data.education, margin + cellWidth + (cellWidth / 2), cursorY + 3, 12, 'center', 'normal');

    cursorY += infoHeight + 5;

    // --- COMPONENTS HEADER ---
    doc.setFillColor(colors.orangeHeader);
    doc.rect(margin, cursorY, contentWidth, 8, 'F');
    doc.line(margin, cursorY, margin + contentWidth, cursorY);
    doc.line(margin, cursorY + 8, margin + contentWidth, cursorY + 8);
    addRtlText(data.componentsHeader, pageWidth / 2, cursorY + 1, 12, 'center', 'bold');
    cursorY += 10;

    // --- MAIN TABLE ---
    const tableBody = data.tableRows.map(row => [
        row.score,
        reshapePersian(row.evaluation),
        reshapePersian(row.indicator)
    ]);

    autoTable(doc, {
        startY: cursorY,
        head: [[
            reshapePersian('نمره'),
            reshapePersian('ارزشیابی'),
            reshapePersian('عنوان شاخص')
        ]],
        body: tableBody,
        theme: 'grid',
        margin: { left: margin, right: margin },
        headStyles: {
            fillColor: '#f3f4f6',
            textColor: colors.grayText,
            halign: 'center',
            font: 'Vazirmatn',
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 2,
            lineColor: colors.grayBorder,
        },
        bodyStyles: {
            halign: 'right',
            cellPadding: 2,
            font: 'Vazirmatn',
            fontStyle: 'normal',
            fontSize: 9,
            lineColor: colors.grayBorder,
        },
        columnStyles: {
            0: { cellWidth: 25, halign: 'center', textColor: colors.orangeScore, fontStyle: 'bold' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 45, fontStyle: 'bold' }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY || cursorY;
    cursorY = finalY + 2;

    // --- DYNAMIC SECTIONS (Strengths / Weaknesses) ---
    const renderSection = (section: Section, bgColor: string) => {
        doc.setFillColor(bgColor);
        doc.rect(margin, cursorY, contentWidth, 8, 'F');
        addRtlText(section.title, pageWidth / 2, cursorY + 1, 11, 'center', 'bold');
        cursorY += 10;

        const textContent = section.content.map(reshapePersian).join('\n');
        const lines = doc.splitTextToSize(textContent, contentWidth - 4);
        const textHeight = lines.length * 5 + 4;

        doc.setDrawColor(colors.grayBorder);
        doc.rect(margin, cursorY, contentWidth, textHeight);
        doc.text(lines, pageWidth - margin - 2, cursorY + 2, { align: 'right', baseline: 'top' });
        cursorY += textHeight + 2;
    };

    // Render all Strengths
    data.strengths.forEach(s => renderSection(s, colors.orangeHeader));

    // Render all Weaknesses
    data.weaknesses.forEach(s => renderSection(s, colors.redSection));

    // --- SCORING SECTION ---
    doc.setFillColor(colors.blueHeader);
    doc.rect(margin, cursorY, contentWidth, 8, 'F');
    doc.line(margin, cursorY, margin + contentWidth, cursorY);
    addRtlText(data.scoringHeader, pageWidth / 2, cursorY + 1, 11, 'center', 'bold');
    cursorY += 10;

    autoTable(doc, {
        startY: cursorY,
        head: [[
            reshapePersian('35-45'),
            reshapePersian('20-35'),
            reshapePersian('5-20'),
            reshapePersian('0-5')
        ]],
        body: [[
            reshapePersian('مورد و حسن بیکی'),
            reshapePersian('تصحیح و سوالات'),
            reshapePersian('تأمیم درسی نیاز'),
            reshapePersian('مضعف')
        ]],
        theme: 'grid',
        margin: { left: margin, right: margin },
        headStyles: {
            fillColor: '#f9fafb',
            textColor: colors.orangeScore,
            halign: 'center',
            font: 'Vazirmatn',
            fontStyle: 'bold',
            fontSize: 10,
        },
        bodyStyles: {
            halign: 'center',
            font: 'Vazirmatn',
            fontStyle: 'normal',
            fontSize: 9,
        },
        columnStyles: {
            0: { cellWidth: contentWidth / 4 },
            1: { cellWidth: contentWidth / 4 },
            2: { cellWidth: contentWidth / 4 },
            3: { cellWidth: contentWidth / 4 }
        }
    });

    const finalScoreY = (doc as any).lastAutoTable.finalY || cursorY;
    cursorY = finalScoreY + 2;

    // --- SUMMARY ---
    doc.setFillColor(colors.blueHeader);
    doc.rect(margin, cursorY, contentWidth, 8, 'F');
    addRtlText(data.summaryTitle, pageWidth / 2, cursorY + 1, 11, 'center', 'bold');
    cursorY += 10;

    const summaryText = reshapePersian(data.summary);
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 4);
    const summaryHeight = summaryLines.length * 5 + 4;

    doc.setFillColor('#ffffff');
    doc.rect(margin, cursorY, contentWidth, summaryHeight, 'F');

    doc.setDrawColor('#9ca3af');
    (doc as any).setLineDash([1, 1]);
    doc.rect(margin, cursorY, contentWidth, summaryHeight);
    (doc as any).setLineDash([]);

    doc.text(summaryLines, pageWidth - margin - 2, cursorY + 2, { align: 'right', baseline: 'top' });

    doc.save('teacher-assessment.pdf');
};