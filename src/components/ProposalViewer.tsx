import React, { useState } from 'react';
import { 
  FileText, Search, CheckSquare, Square, BookOpen, 
  Table, ChevronRight, Layers, Award, Sparkles, Printer
} from 'lucide-react';
import { 
  PROPOSAL_SECTIONS, DATA_SCHEMA_FIELDS, 
  PRE_LAUNCH_CHECKLIST, GLOSSARY_TERMS, ProposalSection 
} from '../data/proposalContent';

interface ProposalViewerProps {
  lang: 'th' | 'en';
}

export const ProposalViewer: React.FC<ProposalViewerProps> = ({ lang }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ch-1');
  const [searchDoc, setSearchDoc] = useState('');
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({
    'chk-1': true,
    'chk-2': true,
    'chk-5': true,
    'chk-7': true,
  });

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentSection = PROPOSAL_SECTIONS.find((s) => s.id === selectedChapterId) || PROPOSAL_SECTIONS[0];

  const filteredSections = PROPOSAL_SECTIONS.filter((s) => {
    if (!searchDoc.trim()) return true;
    const q = searchDoc.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q);
  });

  const completedChecklistCount = Object.values(checkedItems).filter(Boolean).length;
  const checklistProgress = Math.round((completedChecklistCount / PRE_LAUNCH_CHECKLIST.length) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>เอกสารข้อเสนอโครงการฉบับสมบูรณ์ (ร่างเพื่อพิจารณา)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            RESTPOINT / ToiletGo โครงการนวัตกรรมดิจิทัล
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            แพลตฟอร์มค้นหา รีวิว และแบ่งปันข้อมูลห้องน้ำและสิ่งอำนวยความสะดวกระหว่างเดินทาง ครอบคลุมประเทศไทยและต่างประเทศ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ / บันทึก PDF</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar TOC + Document Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Table of Contents */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col max-h-[750px]">
          
          <div className="mb-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                placeholder="ค้นหาบท, หัวข้อ, หรือคำสำคัญ..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-emerald-500"
              />
            </div>
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            สารบัญ 21 บท & ภาคผนวก
          </h3>

          {/* Chapters list */}
          <div className="overflow-y-auto space-y-1 pr-1 flex-1">
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedChapterId(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-start gap-2.5 ${
                  selectedChapterId === sec.id
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                  selectedChapterId === sec.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {sec.chapterNumber}
                </span>
                <span className="truncate flex-1">{sec.title}</span>
              </button>
            ))}

            {/* Special Appendix tabs in TOC */}
            <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
              <button
                onClick={() => setSelectedChapterId('app-a')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                  selectedChapterId === 'app-a'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>ภาคผนวก ก: โครงสร้างข้อมูล (Schema)</span>
              </button>

              <button
                onClick={() => setSelectedChapterId('app-b')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                  selectedChapterId === 'app-b'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>ภาคผนวก ข: รายการตรวจสอบ (Checklist)</span>
              </button>

              <button
                onClick={() => setSelectedChapterId('glossary')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                  selectedChapterId === 'glossary'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>คำศัพท์สำคัญ (Key Glossary)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Main Viewer: Selected Chapter or Appendix */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs min-h-[600px] overflow-y-auto">
          
          {/* RENDER APPENDIX A */}
          {selectedChapterId === 'app-a' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Appendix A Specification
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  ภาคผนวก ก: ตัวอย่างโครงสร้างข้อมูลสถานที่ (Data Schema)
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  แบบแผนโครงสร้างข้อมูลสำหรับจัดเก็บและแลกเปลี่ยนข้อมูลผ่าน API และฐานข้อมูลเชิงพื้นที่ (Geospatial)
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3 px-4">ฟิลด์ข้อมูล (Field)</th>
                      <th className="py-3 px-4">ชนิดข้อมูล (Type)</th>
                      <th className="py-3 px-4">คำอธิบายและความหมาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DATA_SCHEMA_FIELDS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-800">{row.field}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{row.type}</td>
                        <td className="py-2.5 px-4 text-slate-700">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RENDER APPENDIX B */}
          {selectedChapterId === 'app-b' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Appendix B Quality Assurance
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  ภาคผนวก ข: รายการตรวจสอบก่อนเปิดให้บริการ (Pre-Launch Checklist)
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  ตรวจสอบความพร้อม 10 มิติสำคัญก่อนการเปิดใช้งานจริงในพื้นที่นำร่อง
                </p>
              </div>

              {/* Progress Bar */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex justify-between text-xs font-bold text-emerald-900">
                  <span>ความพร้อมของระบบ: {checklistProgress}%</span>
                  <span>{completedChecklistCount} จาก {PRE_LAUNCH_CHECKLIST.length} รายการ</span>
                </div>
                <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              </div>

              {/* Interactive checklist items */}
              <div className="space-y-2.5">
                {PRE_LAUNCH_CHECKLIST.map((chk) => {
                  const isDone = !!checkedItems[chk.id];
                  return (
                    <div
                      key={chk.id}
                      onClick={() => toggleCheck(chk.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone 
                          ? 'bg-emerald-50/40 border-emerald-300 text-slate-800 font-medium' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 shrink-0" />
                        )}
                        <span className={`text-xs sm:text-sm ${isDone ? 'line-through text-slate-500' : ''}`}>
                          {chk.text}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        {chk.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RENDER GLOSSARY */}
          {selectedChapterId === 'glossary' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Project Vocabulary
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  คำศัพท์สำคัญในโครงการ (Glossary)
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  คำนิยามศัพท์เทคนิคและมาตรฐานที่ใช้ในเอกสารข้อเสนอโครงการ
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {GLOSSARY_TERMS.map((g, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <h4 className="font-extrabold text-sm text-emerald-800 font-mono">
                      {g.term}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {g.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RENDER REGULAR CHAPTER (1-21) */}
          {selectedChapterId !== 'app-a' && selectedChapterId !== 'app-b' && selectedChapterId !== 'glossary' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                    บทที่ {currentSection.chapterNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {currentSection.titleEn}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {currentSection.title}
                </h3>
                <p className="text-sm text-emerald-800 font-medium bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/70 mt-3">
                  💡 {currentSection.summary}
                </p>
              </div>

              {/* Main Content Paragraphs */}
              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                {currentSection.content.map((p, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* Key Takeaways / Points if available */}
              {currentSection.keyPoints && currentSection.keyPoints.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>สาระสำคัญและข้อพิจารณาหลัก</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc list-inside">
                    {currentSection.keyPoints.map((pt, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tables if available */}
              {currentSection.tables && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs mt-4">
                  <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm text-left">
                    <thead className="bg-slate-100 text-slate-800 font-bold">
                      <tr>
                        {currentSection.tables.headers.map((h, idx) => (
                          <th key={idx} className="py-3 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentSection.tables.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/60">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className={`py-2.5 px-4 ${cIdx === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bottom Pagination */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <span>เอกสารโครงการ RESTPOINT / ToiletGo</span>
                <span className="font-semibold text-emerald-700">หน้าเสนอพิจารณาฉบับสมบูรณ์</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
