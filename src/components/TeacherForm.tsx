"use client";

import { useState } from 'react';
import { generateVectorPDF } from '@/utils/pdfGenerator';

type TableRow = {
    id: number;
    indicator: string;
    evaluation: string;
    score: string;
};

type Section = {
    id: number;
    title: string;
    content: string[];
};

export default function TeacherForm() {
    // Main Data States
    const [title, setTitle] = useState("استاندارد حرفه‌ای معلم");
    const [name, setName] = useState("رایان");
    const [education, setEducation] = useState("مقاطع تحصیلی:");
    const [componentsHeader, setComponentsHeader] = useState("مؤلفه‌های تحصیلی");
    const [scoringHeader, setScoringHeader] = useState("تأمیم امتیاز تحصیلی (45 نمره)");
    const [summaryTitle, setSummaryTitle] = useState("جمع بندی نهایی:");

    // State for Scoring Table Content
    const [scoreHeaders, setScoreHeaders] = useState(["35-45", "20-35", "5-20", "0-5"]);
    const [scoreBody, setScoreBody] = useState(["مورد و حسن بیکی", "تصحیح و سوالات", "تأمیم درسی نیاز", "مضعف"]);

    const [tableRows, setTableRows] = useState<TableRow[]>([
        { id: 1, indicator: "توقیف واهل و معلمان فهم", evaluation: "• مفاهیم درس را به درستی شناخت...", score: "8/10" },
        { id: 2, indicator: "نقش و کلاس خوب", evaluation: "• کلاس درس مدیریت می‌کند...", score: "7/10" },
        { id: 3, indicator: "پلان درسی مفصل و کمال", evaluation: "• محتوای درس را به طور کامل تشریح نماید...", score: "9/10" },
        { id: 4, indicator: "محضر و انگیزه دانش", evaluation: "• با استفاده از احتمالات و مهارت...", score: "8/10" },
        { id: 5, indicator: "همیشه به موفقیت آور", evaluation: "• برای دانستن پیشرفت‌های دانش آموزان...", score: "9/10" },
        { id: 6, indicator: "دوری از تقلب، قیاس به مؤلفه", evaluation: "• شعور و عکس العمل‌های خود را ارزیابی نماید...", score: "8/10" },
    ]);

    const [strengths, setStrengths] = useState<Section[]>([
        { id: 1, title: "تأمل قوت", content: ["توقیف واهل و قیافه‌های درسی", "وقاحت و لسان بهره برداری آموزشی", "محضربت همین فضایی..."] }
    ]);

    const [weaknesses, setWeaknesses] = useState<Section[]>([
        { id: 1, title: "تأمل ضعف", content: ["در رزروی حصوص، انتقالی بیک تکامل مهمه...", "تنوع در وسایلکشی مؤخره تشخیص شده..."] }
    ]);

    const [summary, setSummary] = useState("استاد حضرت رضایه کم محضر هنگام...");
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [layoutSettings, setLayoutSettings] = useState({
      titleSize: 18,
      headerSize: 12,
      tableSize: 9,
      sectionSize: 10
    });

    const handleExport = async () => {
        setIsGenerating(true);
        try {
            await generateVectorPDF({
                title,
                name,
                education,
                tableRows,
                strengths,
                weaknesses,
                summary,
                componentsHeader,
                scoringHeader,
                summaryTitle,
                scoreHeaders, // Pass new data
                scoreBody,    // Pass new data
                settings: layoutSettings
            });
        } catch (error) {
            console.error(error);
            alert("خطا در ایجاد PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Handlers
    const handleContentChange = (sectionIndex: number, type: 'strengths' | 'weaknesses', value: string) => {
        const lines = value.split('\n');
        if (type === 'strengths') {
            const updated = [...strengths];
            updated[sectionIndex].content = lines;
            setStrengths(updated);
        } else {
            const updated = [...weaknesses];
            updated[sectionIndex].content = lines;
            setWeaknesses(updated);
        }
    };

    const addTableRow = () => {
        const newRow: TableRow = {
            id: Date.now(),
            indicator: "عنوان جدید",
            evaluation: "توضیحات...",
            score: "0/10"
        };
        setTableRows([...tableRows, newRow]);
    };

    const addStrengthSection = () => {
        setStrengths([...strengths, { id: Date.now(), title: "تأمل قوت جدید", content: ["متن..."] }]);
    };

    const addWeaknessSection = () => {
        setWeaknesses([...weaknesses, { id: Date.now(), title: "تأمل ضعف جدید", content: ["متن..."] }]);
    };

    const removeSection = (id: number, type: 'strengths' | 'weaknesses') => {
        if (type === 'strengths') {
            setStrengths(strengths.filter(s => s.id !== id));
        } else {
            setWeaknesses(weaknesses.filter(s => s.id !== id));
        }
    };

    const updateSetting = (key: keyof typeof layoutSettings, value: number) => {
      setLayoutSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4" dir="rtl">
            
            {/* Settings Button */}
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="fixed top-5 left-5 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform print:hidden"
            >
                ⚙️
            </button>

            {/* Settings Panel */}
            {showSettings && (
                <div className="fixed top-20 left-5 z-40 bg-white p-6 rounded-xl shadow-2xl w-80 border-2 border-gray-100 print:hidden overflow-y-auto max-h-[90vh]">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2 text-gray-800">تنظیمات</h3>
                    
                    <div className="flex flex-col gap-3 mb-4">
                        <button onClick={addTableRow} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold transition">+ افزودن ردیف جدول</button>
                        <button onClick={addStrengthSection} className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 py-2 rounded-lg text-sm font-bold transition">+ افزودن بخش قوت</button>
                        <button onClick={addWeaknessSection} className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg text-sm font-bold transition">+ افزودن بخش ضعف</button>
                    </div>

                    <div className="border-t pt-4 mt-2 space-y-4">
                        <h4 className="font-bold text-sm text-gray-600">اندازه‌ها (PDF & وب)</h4>
                        
                        <div>
                            <label className="text-xs text-gray-500 flex justify-between">
                                <span>عنوان اصلی</span> <span>{layoutSettings.titleSize}px</span>
                            </label>
                            <input type="range" min="12" max="30" value={layoutSettings.titleSize} 
                                onChange={(e) => updateSetting('titleSize', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 flex justify-between">
                                <span>سربرگ‌ها</span> <span>{layoutSettings.headerSize}px</span>
                            </label>
                            <input type="range" min="8" max="20" value={layoutSettings.headerSize} 
                                onChange={(e) => updateSetting('headerSize', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>

                         <div>
                            <label className="text-xs text-gray-500 flex justify-between">
                                <span>جدول</span> <span>{layoutSettings.tableSize}px</span>
                            </label>
                            <input type="range" min="6" max="16" value={layoutSettings.tableSize} 
                                onChange={(e) => updateSetting('tableSize', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>

                         <div>
                            <label className="text-xs text-gray-500 flex justify-between">
                                <span>بخش‌ها</span> <span>{layoutSettings.sectionSize}px</span>
                            </label>
                            <input type="range" min="6" max="16" value={layoutSettings.sectionSize} 
                                onChange={(e) => updateSetting('sectionSize', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>

                    <hr className="my-4"/>
                    <button 
                        onClick={handleExport}
                        disabled={isGenerating}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition shadow-md disabled:opacity-50"
                    >
                        {isGenerating ? 'در حال ساخت...' : 'دانلود PDF'}
                    </button>
                </div>
            )}

            {/* Main Form Container */}
            <div className="w-full max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden font-sans text-gray-800 text-sm leading-6">

                {/* Header */}
                <div className="bg-blue-50 p-4 text-center border-b border-gray-300 mb-6">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ fontSize: `${layoutSettings.titleSize}px` }}
                        className="w-full font-bold text-center bg-transparent border-none focus:outline-none"
                    />
                </div>

                {/* Info Section */}
                <div className="flex border-b border-gray-300 mb-6">
                    <div className="flex-1 p-3 bg-gray-50 border-l border-gray-300 text-center">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ fontSize: `${layoutSettings.headerSize}px` }}
                            className="w-full bg-transparent text-center font-bold"
                        />
                    </div>
                    <div className="flex-1 p-3 text-center">
                        <input
                            type="text"
                            value={education}
                            onChange={(e) => setEducation(e.target.value)}
                            style={{ fontSize: `${layoutSettings.headerSize}px` }}
                            className="w-full bg-transparent text-center"
                        />
                    </div>
                </div>

                {/* Components Header */}
                <div className="bg-orange-50 p-2 text-center font-bold border-b border-gray-300 mb-0">
                     <input 
                        type="text"
                        value={componentsHeader}
                        onChange={(e) => setComponentsHeader(e.target.value)}
                        style={{ fontSize: `${layoutSettings.headerSize}px` }}
                        className="w-full bg-transparent text-center font-bold"
                     />
                </div>

                {/* Assessment Table */}
                <div className="mb-6 overflow-x-auto border-l border-r border-b border-gray-300">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border-b border-gray-300 p-2 text-right w-1/4">عنوان شاخص</th>
                                <th className="border-b border-gray-300 p-2 text-right w-1/2">ارزشیابی</th>
                                <th className="border-b border-gray-300 p-2 text-center w-1/4">نمره</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, index) => (
                                <tr key={row.id}>
                                    <td className="border-b border-l border-gray-300 p-2 align-top">
                                        <input
                                            type="text"
                                            value={row.indicator}
                                            onChange={(e) => {
                                                const updated = [...tableRows];
                                                updated[index].indicator = e.target.value;
                                                setTableRows(updated);
                                            }}
                                            style={{ fontSize: `${layoutSettings.tableSize}px` }}
                                            className="w-full bg-transparent font-bold"
                                        />
                                    </td>
                                    <td className="border-b border-l border-gray-300 p-2 align-top">
                                        <textarea
                                            value={row.evaluation}
                                            onChange={(e) => {
                                                const updated = [...tableRows];
                                                updated[index].evaluation = e.target.value;
                                                setTableRows(updated);
                                            }}
                                            style={{ fontSize: `${layoutSettings.tableSize}px` }}
                                            className="w-full bg-transparent resize-none h-16"
                                        />
                                    </td>
                                    <td className="border-b border-gray-300 p-2 text-center align-top text-orange-600 font-bold">
                                        <input
                                            type="text"
                                            value={row.score}
                                            onChange={(e) => {
                                                const updated = [...tableRows];
                                                updated[index].score = e.target.value;
                                                setTableRows(updated);
                                            }}
                                            style={{ fontSize: `${layoutSettings.tableSize}px` }}
                                            className="w-full bg-transparent text-center"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Dynamic Sections */}
                <div className="grid grid-cols-1 gap-0 mb-6">
                    {/* Strengths */}
                    {strengths.map((section, index) => (
                        <div key={section.id} className="bg-orange-50 border border-gray-300 p-4 border-l-0 border-r-0 relative group">
                            <button 
                                onClick={() => removeSection(section.id, 'strengths')}
                                className="absolute left-2 top-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition print:hidden"
                            >✕</button>
                            <div className="font-bold mb-2 text-center">
                                <input 
                                    type="text" 
                                    value={section.title} 
                                    onChange={(e) => {
                                        const updated = [...strengths];
                                        updated[index].title = e.target.value;
                                        setStrengths(updated);
                                    }}
                                    style={{ fontSize: `${layoutSettings.sectionSize}px` }}
                                    className="w-full bg-transparent text-center"
                                />
                            </div>
                            <textarea
                                className="w-full bg-transparent text-sm h-20 border-none p-0 focus:outline-none"
                                style={{ fontSize: `${layoutSettings.sectionSize}px` }}
                                value={section.content.join('\n')}
                                onChange={(e) => handleContentChange(index, 'strengths', e.target.value)}
                            />
                        </div>
                    ))}

                    {/* Weaknesses */}
                    {weaknesses.map((section, index) => (
                        <div key={section.id} className="bg-red-50 border border-gray-300 border-t-0 border-l-0 border-r-0 p-4 relative group">
                             <button 
                                onClick={() => removeSection(section.id, 'weaknesses')}
                                className="absolute left-2 top-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition print:hidden"
                            >✕</button>
                            <div className="font-bold mb-2 text-center">
                                <input 
                                    type="text" 
                                    value={section.title} 
                                    onChange={(e) => {
                                        const updated = [...weaknesses];
                                        updated[index].title = e.target.value;
                                        setWeaknesses(updated);
                                    }}
                                    style={{ fontSize: `${layoutSettings.sectionSize}px` }}
                                    className="w-full bg-transparent text-center"
                                />
                            </div>
                            <textarea
                                className="w-full bg-transparent text-sm h-20 border-none p-0 focus:outline-none"
                                style={{ fontSize: `${layoutSettings.sectionSize}px` }}
                                value={section.content.join('\n')}
                                onChange={(e) => handleContentChange(index, 'weaknesses', e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                {/* Scoring Header */}
                <div className="bg-blue-50 p-2 text-center font-bold border border-gray-300 border-l-0 border-r-0">
                    <input 
                        type="text"
                        value={scoringHeader}
                        onChange={(e) => setScoringHeader(e.target.value)}
                        style={{ fontSize: `${layoutSettings.headerSize}px` }}
                        className="w-full bg-transparent text-center font-bold"
                    />
                </div>

                {/* Scoring Table - NOW EDITABLE */}
                <table className="w-full border-collapse border border-gray-300 border-t-0 mb-6 text-center">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border-l border-gray-300 p-2 text-orange-600">
                                <input 
                                    type="text" 
                                    value={scoreHeaders[0]} 
                                    onChange={(e) => {
                                        const updated = [...scoreHeaders];
                                        updated[0] = e.target.value;
                                        setScoreHeaders(updated);
                                    }}
                                    className="w-full bg-transparent text-center font-bold text-orange-600"
                                />
                            </th>
                            <th className="border-l border-gray-300 p-2 text-orange-600">
                                <input 
                                    type="text" 
                                    value={scoreHeaders[1]} 
                                    onChange={(e) => {
                                        const updated = [...scoreHeaders];
                                        updated[1] = e.target.value;
                                        setScoreHeaders(updated);
                                    }}
                                    className="w-full bg-transparent text-center font-bold text-orange-600"
                                />
                            </th>
                            <th className="border-l border-gray-300 p-2 text-orange-600">
                                <input 
                                    type="text" 
                                    value={scoreHeaders[2]} 
                                    onChange={(e) => {
                                        const updated = [...scoreHeaders];
                                        updated[2] = e.target.value;
                                        setScoreHeaders(updated);
                                    }}
                                    className="w-full bg-transparent text-center font-bold text-orange-600"
                                />
                            </th>
                            <th className="p-2 text-orange-600">
                                <input 
                                    type="text" 
                                    value={scoreHeaders[3]} 
                                    onChange={(e) => {
                                        const updated = [...scoreHeaders];
                                        updated[3] = e.target.value;
                                        setScoreHeaders(updated);
                                    }}
                                    className="w-full bg-transparent text-center font-bold text-orange-600"
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border-l border-t border-gray-300 p-2">
                                <input 
                                    type="text" 
                                    value={scoreBody[0]} 
                                    onChange={(e) => {
                                        const updated = [...scoreBody];
                                        updated[0] = e.target.value;
                                        setScoreBody(updated);
                                    }}
                                    className="w-full bg-transparent text-center"
                                />
                            </td>
                            <td className="border-l border-t border-gray-300 p-2">
                                <input 
                                    type="text" 
                                    value={scoreBody[1]} 
                                    onChange={(e) => {
                                        const updated = [...scoreBody];
                                        updated[1] = e.target.value;
                                        setScoreBody(updated);
                                    }}
                                    className="w-full bg-transparent text-center"
                                />
                            </td>
                            <td className="border-l border-t border-gray-300 p-2">
                                <input 
                                    type="text" 
                                    value={scoreBody[2]} 
                                    onChange={(e) => {
                                        const updated = [...scoreBody];
                                        updated[2] = e.target.value;
                                        setScoreBody(updated);
                                    }}
                                    className="w-full bg-transparent text-center"
                                />
                            </td>
                            <td className="border-t border-gray-300 p-2">
                                <input 
                                    type="text" 
                                    value={scoreBody[3]} 
                                    onChange={(e) => {
                                        const updated = [...scoreBody];
                                        updated[3] = e.target.value;
                                        setScoreBody(updated);
                                    }}
                                    className="w-full bg-transparent text-center"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Summary */}
                <div className="bg-blue-50 p-4 border border-gray-300 border-l-0 border-r-0 rounded">
                    <div className="font-bold mb-2 text-center">
                        <input 
                            type="text"
                            value={summaryTitle}
                            onChange={(e) => setSummaryTitle(e.target.value)}
                            style={{ fontSize: `${layoutSettings.sectionSize}px` }}
                            className="w-full bg-transparent text-center"
                        />
                    </div>
                    <textarea
                        className="w-full bg-white bg-opacity-50 text-sm p-2 border border-dashed border-gray-400 rounded h-20"
                        style={{ fontSize: `${layoutSettings.sectionSize}px` }}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                    />
                </div>

            </div>
        </div>
    );
}
