import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import arabicReshaper from 'arabic-reshaper';

// Types
type TableRow = { id: number; indicator: string; evaluation: string; score: string; };
type Section = { id: number; title: string; content: string[]; };

type LayoutSettings = {
  titleSize: number;
  headerSize: number;
  tableSize: number;
  sectionSize: number;
};

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
  scoreHeaders: string[]; // New
  scoreBody: string[];    // New
  settings: LayoutSettings;
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
  // --- 1. INITIAL SETUP ---
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // --- FONT LOADING ---
  const fontPath = '/fonts/Vazirmatn-VariableFont_wght.ttf'; 
  let base64Font: string = '';

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
    base64Font = btoa(binaryString);

    doc.addFileToVFS('Vazirmatn-VariableFont_wght.ttf', base64Font);
    doc.addFont('Vazirmatn-VariableFont_wght.ttf', 'Vazirmatn', 'normal');
    doc.addFont('Vazirmatn-VariableFont_wght.ttf', 'Vazirmatn', 'bold');
    
  } catch (error) {
    console.error('Font loading error:', error);
    alert('خطا: فایل فونت یافت نشد.');
    return;
  }

  // --- 2. CALCULATE HEIGHTS (MEASURE PASS) ---
  const { titleSize, headerSize, tableSize, sectionSize } = data.settings;
  const pageHeight = doc.internal.pageSize.getHeight(); 
  const pageWidth = doc.internal.pageSize.getWidth();   
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  const colors = {
    blueHeader: '#eff6ff',
    orangeHeader: '#fff7ed',
    redSection: '#fef2f2',
    grayBorder: '#d1d5db',
    grayText: '#1f2937',
    orangeScore: '#ea580c',
  };

  const getTextHeight = (text: string, fontSize: number) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(reshapePersian(text), contentWidth - 4);
    return lines.length * (fontSize * 0.5) + 4;
  };

  const headerHeight = 25;
  const infoHeight = 17; 
  const compHeaderHeight = 13; 
  const scoringHeight = 35; 
  const summaryTitleHeight = 18;
  
  const calcSectionHeight = (section: Section) => {
    const contentText = section.content.map(reshapePersian).join('\n');
    const textH = getTextHeight(contentText, sectionSize);
    return 10 + textH + 2; 
  };

  let totalDynamicHeight = 0;
  data.strengths.forEach(s => totalDynamicHeight += calcSectionHeight(s));
  data.weaknesses.forEach(s => totalDynamicHeight += calcSectionHeight(s));

  const summaryText = reshapePersian(data.summary);
  const summaryTextHeight = getTextHeight(summaryText, sectionSize);

  const tempDoc = new jsPDF();
  tempDoc.addFileToVFS('Vazirmatn-VariableFont_wght.ttf', base64Font);
  tempDoc.addFont('Vazirmatn-VariableFont_wght.ttf', 'Vazirmatn', 'normal');
  
  const tableBody = data.tableRows.map(row => [
    row.score,
    reshapePersian(row.evaluation),
    reshapePersian(row.indicator)
  ]);

  autoTable(tempDoc, {
    head: [[reshapePersian('نمره'), reshapePersian('ارزشیابی'), reshapePersian('عنوان شاخص')]],
    body: tableBody,
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: { fontSize: tableSize, cellPadding: 2 },
    bodyStyles: { fontSize: tableSize, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 45 } }
  });
  
  const tableHeight = (tempDoc as any).lastAutoTable.finalY || 50;

  const totalContentHeight = 
    headerHeight + 
    infoHeight + 
    compHeaderHeight + 
    tableHeight + 
    totalDynamicHeight + 
    scoringHeight + 
    summaryTitleHeight + 
    summaryTextHeight;

  let scale = 1;
  let startY = margin; 
  const availableHeight = pageHeight - (margin * 2);

  if (totalContentHeight > availableHeight) {
    scale = availableHeight / totalContentHeight;
    if (scale < 0.6) scale = 0.6; 
  } else {
    startY = (pageHeight - totalContentHeight) / 2;
    if (startY < margin) startY = margin; 
  }

  let cursorY = startY;

  const addRtlText = (text: string, x: number, y: number, size: number, align: 'right' | 'center' | 'left' = 'right', style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('Vazirmatn', style);
    doc.setFontSize(size * scale); 
    const reshapedText = reshapePersian(text);
    doc.text(reshapedText, x, y, { align: align, baseline: 'top' });
  };

  // --- HEADER ---
  doc.setFillColor(colors.blueHeader);
  doc.rect(0, cursorY, pageWidth, 25, 'F'); 
  doc.setDrawColor(colors.grayBorder);
  doc.line(0, cursorY + 25, pageWidth, cursorY + 25);
  addRtlText(data.title, pageWidth / 2, cursorY + 8, titleSize, 'center', 'bold');
  cursorY += 30;

  // --- INFO SECTION ---
  const cellWidth = contentWidth / 2;
  doc.setFillColor('#f9fafb');
  doc.rect(margin, cursorY, cellWidth, 12, 'FD');
  addRtlText(data.name, margin + (cellWidth / 2), cursorY + 3, headerSize, 'center', 'bold');

  doc.setFillColor('#ffffff');
  doc.rect(margin + cellWidth, cursorY, cellWidth, 12, 'FD');
  addRtlText(data.education, margin + cellWidth + (cellWidth / 2), cursorY + 3, headerSize, 'center', 'normal');
  cursorY += 17;

  // --- COMPONENTS HEADER ---
  doc.setFillColor(colors.orangeHeader);
  doc.rect(margin, cursorY, contentWidth, 8, 'F');
  doc.line(margin, cursorY, margin + contentWidth, cursorY);
  doc.line(margin, cursorY + 8, margin + contentWidth, cursorY + 8);
  addRtlText(data.componentsHeader, pageWidth / 2, cursorY + 1, headerSize, 'center', 'bold');
  cursorY += 13;

  // --- MAIN TABLE ---
  autoTable(doc, {
    startY: cursorY,
    head: [[reshapePersian('نمره'), reshapePersian('ارزشیابی'), reshapePersian('عنوان شاخص')]],
    body: tableBody,
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: { 
      fillColor: '#f3f4f6', textColor: colors.grayText, halign: 'center',
      font: 'Vazirmatn', fontStyle: 'bold', fontSize: tableSize * scale, cellPadding: 2 * scale, lineColor: colors.grayBorder,
    },
    bodyStyles: {
      halign: 'right', cellPadding: 2 * scale, font: 'Vazirmatn', fontStyle: 'normal',
      fontSize: tableSize * scale, lineColor: colors.grayBorder,
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center', textColor: colors.orangeScore, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 45, fontStyle: 'bold' }
    }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 5;

  // --- DYNAMIC SECTIONS ---
  const renderSection = (section: Section, bgColor: string) => {
    doc.setFillColor(bgColor);
    doc.rect(margin, cursorY, contentWidth, 8, 'F');
    addRtlText(section.title, pageWidth / 2, cursorY + 1, sectionSize, 'center', 'bold');
    cursorY += 10;

    const textContent = section.content.map(reshapePersian).join('\n');
    const lines = doc.splitTextToSize(textContent, contentWidth - 4);
    const textHeight = lines.length * (sectionSize * 0.5 * scale) + 4;
    
    doc.setDrawColor(colors.grayBorder);
    doc.rect(margin, cursorY, contentWidth, textHeight);
    doc.text(lines, pageWidth - margin - 2, cursorY + 2, { align: 'right', baseline: 'top' });
    cursorY += textHeight + 2;
  };

  data.strengths.forEach(s => renderSection(s, colors.orangeHeader));
  data.weaknesses.forEach(s => renderSection(s, colors.redSection));

  // --- SCORING SECTION ---
  doc.setFillColor(colors.blueHeader);
  doc.rect(margin, cursorY, contentWidth, 8, 'F');
  doc.line(margin, cursorY, margin + contentWidth, cursorY);
  addRtlText(data.scoringHeader, pageWidth / 2, cursorY + 1, headerSize, 'center', 'bold');
  cursorY += 10;

  // Use dynamic data for scoring table
  autoTable(doc, {
    startY: cursorY,
    head: [[
      reshapePersian(data.scoreHeaders[0]), 
      reshapePersian(data.scoreHeaders[1]), 
      reshapePersian(data.scoreHeaders[2]), 
      reshapePersian(data.scoreHeaders[3])
    ]],
    body: [[
      reshapePersian(data.scoreBody[0]), 
      reshapePersian(data.scoreBody[1]), 
      reshapePersian(data.scoreBody[2]), 
      reshapePersian(data.scoreBody[3])
    ]],
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: { fillColor: '#f9fafb', textColor: colors.orangeScore, halign: 'center', font: 'Vazirmatn', fontStyle: 'bold', fontSize: tableSize * scale },
    bodyStyles: { halign: 'center', font: 'Vazirmatn', fontSize: tableSize * scale },
    columnStyles: { 
      0: { cellWidth: contentWidth/4 }, 
      1: { cellWidth: contentWidth/4 }, 
      2: { cellWidth: contentWidth/4 }, 
      3: { cellWidth: contentWidth/4 } 
    }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 2;

  // --- SUMMARY ---
  doc.setFillColor(colors.blueHeader);
  doc.rect(margin, cursorY, contentWidth, 8, 'F');
  addRtlText(data.summaryTitle, pageWidth / 2, cursorY + 1, sectionSize, 'center', 'bold');
  cursorY += 10;

  const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 4);
  const summaryHeight = summaryLines.length * (sectionSize * 0.5 * scale) + 4;

  doc.setFillColor('#ffffff'); 
  doc.rect(margin, cursorY, contentWidth, summaryHeight, 'F');
  doc.setDrawColor('#9ca3af');
  (doc as any).setLineDash([1, 1]);
  doc.rect(margin, cursorY, contentWidth, summaryHeight);
  (doc as any).setLineDash([]);
  doc.text(summaryLines, pageWidth - margin - 2, cursorY + 2, { align: 'right', baseline: 'top' });

  doc.save('teacher-assessment.pdf');
};
