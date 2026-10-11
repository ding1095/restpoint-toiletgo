import React, { useState } from 'react';
import { 
  Server, Database, Cloud, ShieldCheck, MapPin, 
  Smartphone, BarChart2, TrendingUp, AlertTriangle, 
  Coins, CheckCircle2, ArrowRight, Activity, Cpu
} from 'lucide-react';

export const ArchitectureKpiDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'kpis' | 'budget' | 'risks'>('architecture');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>สถาปัตยกรรมเทคโนโลยี & แดชบอร์ดตัวชี้วัด (PDF บทที่ 12, 16, 17, 18)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Architecture & Executive KPIs
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            ภาพรวมโครงสร้างเชิงวิศวกรรมซอฟต์แวร์ ฐานข้อมูลเชิงพื้นที่ (Geospatial) แผนงบประมาณ 3 ระยะ และกรอบวัดผลความสำเร็จ 8 มิติ
          </p>
        </div>

        {/* Sub Navigation pills */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          {[
            { id: 'architecture', label: 'สถาปัตยกรรมระบบ (Architecture)', icon: Server },
            { id: 'kpis', label: 'ตัวชี้วัดความสำเร็จ (8 KPIs)', icon: BarChart2 },
            { id: 'budget', label: 'แนวทางจัดสรรงบประมาณ (3 ทางเลือก)', icon: Coins },
            { id: 'risks', label: 'การบริหารความเสี่ยง (Risk Matrix)', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB 1: ARCHITECTURE */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                ผังการทำงานของสถาปัตยกรรมระบบ (End-to-End System Topology)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ออกแบบตามหลัก Microservices & Event-Driven รองรับการขยายตัว (Scalability) และการตรวจสอบย้อนกลับ (Auditability)
              </p>
            </div>

            {/* Architecture Visual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              
              {/* Frontend Layer */}
              <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                <div className="flex items-center gap-2 text-sky-800 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>1. Presentation Layer</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Responsive Web / PWA</span>
                    <span className="text-[11px] text-slate-500">Next.js / React + Tailwind CSS สำหรับเปิดผ่านลิงก์ทันที</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Mobile App (ระยะถัดไป)</span>
                    <span className="text-[11px] text-slate-500">Flutter / React Native รองรับ Offline & Push Notification</span>
                  </div>
                </div>
              </div>

              {/* API & Backend Layer */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <Server className="w-4 h-4" />
                  <span>2. Backend & Services</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block">RESTful / GraphQL API</span>
                    <span className="text-[11px] text-slate-500">Node.js หรือ Python/FastAPI จัดการ Business Logic & Auth</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Trust & Verification Engine</span>
                    <span className="text-[11px] text-slate-500">ตรวจสอบรีวิวปลอม ป้องกันสแปม คำนวณคะแนน 6 มิติ</span>
                  </div>
                </div>
              </div>

              {/* Geospatial & Storage Layer */}
              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center gap-2 text-purple-800 font-bold">
                  <Database className="w-4 h-4" />
                  <span>3. Geospatial & Data</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block">PostgreSQL + PostGIS</span>
                    <span className="text-[11px] text-slate-500">จัดเก็บพิกัด ค้นหารัศมี คำนวณระยะทางบนเส้นทางจริง</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Cloud Object Storage</span>
                    <span className="text-[11px] text-slate-500">จัดเก็บและแปลงขนาดภาพ ป้องกันข้อมูลส่วนบุคคล</span>
                  </div>
                </div>
              </div>

              {/* External Services Layer */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <Cloud className="w-4 h-4" />
                  <span>4. Integrations & Security</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Maps & Geocoding</span>
                    <span className="text-[11px] text-slate-500">Google Maps Platform & OpenStreetMap Hybrid</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block">PDPA & Privacy Shield</span>
                    <span className="text-[11px] text-slate-500">คัดกรองภาพถ่าย ตรวจจับใบหน้า ไม่เก็บประวัติเดินทาง</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Technical API Comparison Table */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3">
                การเปรียบเทียบบริการภายนอก (External API Analysis - PDF 12.1)
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 text-left">บริการ / API</th>
                      <th className="py-2.5 px-3 text-left">การใช้งานในโครงการ</th>
                      <th className="py-2.5 px-3 text-left">ข้อควรพิจารณาและแนวทางบริหารต้นทุน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">Google Maps Platform</td>
                      <td className="py-2.5 px-3 text-slate-600">แผนที่, Geocoding และคำนวณเส้นทาง</td>
                      <td className="py-2.5 px-3 text-slate-600">มีค่าใช้จ่ายตามปริมาณเรียกใช้ ต้องกำหนดโควตาและแคชผลลัพธ์</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">OpenStreetMap Ecosystem</td>
                      <td className="py-2.5 px-3 text-slate-600">แผนที่พื้นฐานแบบเปิดและข้อมูลทางกายภาพ</td>
                      <td className="py-2.5 px-3 text-slate-600">ประหยัดต้นทุน ต้องให้เครดิตลิขสิทธิ์และไม่ใช้เซิร์ฟเวอร์สาธารณะโดยตรง</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">Cloud Storage / R2</td>
                      <td className="py-2.5 px-3 text-slate-600">จัดเก็บภาพถ่ายรีวิวและป้ายสถานที่</td>
                      <td className="py-2.5 px-3 text-slate-600">จัดการสิทธิ์ Metadata ป้องกันการละเมิดความเป็นส่วนตัวตาม PDPA</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB 2: KPIS */}
      {activeSubTab === 'kpis' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              metric: 'ความครอบคลุม (Coverage)',
              target: '1,000+ จุด',
              current: '240 จุดนำร่อง',
              desc: 'จำนวนจุดห้องน้ำที่มีข้อมูลและพิกัดครบถ้วนบนเส้นทางหลัก',
              color: 'emerald',
            },
            {
              metric: 'ความน่าเชื่อถือ (Trust Rate)',
              target: '85%+',
              current: '92% ยืนยันแล้ว',
              desc: 'สัดส่วนสถานที่ที่ผ่านการตรวจสอบโดยทีมงานหรือเจ้าของสถานที่',
              color: 'sky',
            },
            {
              metric: 'ความถูกต้อง (Accuracy)',
              target: '< 3% Error',
              current: '1.2% แจ้งผิด',
              desc: 'อัตราการรายงานพิกัดหรือสิ่งอำนวยความสะดวกคลาดเคลื่อน',
              color: 'purple',
            },
            {
              metric: 'การใช้งานจริง (Navigation)',
              target: '50,000+ ครั้ง/ด.',
              current: '12,400 ครั้ง',
              desc: 'จำนวนการค้นหาและกดเลือกนำทางสำเร็จระหว่างเดินทาง',
              color: 'amber',
            },
            {
              metric: 'การมีส่วนร่วม (Crowdsource)',
              target: '5,000+ รีวิว',
              current: '1,280 รีวิว',
              desc: 'จำนวนรีวิว ภาพถ่าย และการแก้ไขข้อมูลจากชุมชน',
              color: 'indigo',
            },
            {
              metric: 'การเข้าถึงเท่าเทียม (Universal)',
              target: '100% สเปกครบ',
              current: '88% มีขนาดประตู',
              desc: 'ข้อมูลความกว้างประตู ทางลาด ราวจับ สำหรับผู้พิการ/สูงอายุ',
              color: 'teal',
            },
            {
              metric: 'ความพึงพอใจ (CSAT)',
              target: '4.5 / 5.0 ดาว',
              current: '4.7 ดาวเฉลี่ย',
              desc: 'คะแนนความพึงพอใจของประชาชนผู้ใช้งานระบบจริง',
              color: 'rose',
            },
            {
              metric: 'ความยั่งยืน (Retention)',
              target: '> 60% กลับมาใช้',
              current: '68% ใช้ซ้ำ',
              desc: 'อัตราผู้ใช้ที่บันทึกรายการโปรดและกลับมาเปิดซ้ำระหว่างทริป',
              color: 'emerald',
            },
          ].map((kpi, idx) => (
            <div key={idx} className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{kpi.metric}</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {kpi.current}
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                เป้าหมาย: {kpi.target}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {kpi.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: BUDGET TIERS */}
      {activeSubTab === 'budget' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              tier: 'ทางเลือกที่ 1: ตรวจสอบแนวคิด (PoC)',
              highlight: 'ต้นแบบความเร็วสูง',
              badge: 'Fast Track',
              badgeColor: 'bg-blue-100 text-blue-800',
              scope: 'สำรวจ 100 จุดในพื้นที่นำร่อง 1 เส้นทาง (เช่น มอเตอร์เวย์ ทล.7)',
              features: [
                'Responsive Web App ทดสอบบนเบราว์เซอร์',
                'แผนที่ OpenStreetMap (ลดค่า API แผนที่)',
                'ฐานข้อมูลเริ่มต้น 100 จุดยืนยันแล้ว',
                'แบบสำรวจความพึงพอใจกลุ่มตัวอย่าง 50 คน',
              ],
            },
            {
              tier: 'ทางเลือกที่ 2: MVP ทดลองใช้จริง (แนะนำ)',
              highlight: 'โมเดลสมบูรณ์แบบ',
              badge: 'Recommended',
              badgeColor: 'bg-emerald-100 text-emerald-800',
              scope: 'สำรวจ 500 จุด ครอบคลุม 4 เส้นทางท่องเที่ยวหลักทั่วไทย',
              features: [
                'Web App + PWA พร้อมระบบผู้ใช้งาน',
                'API แผนที่ไฮบริด (OSM + Google Directions)',
                'ระบบรีวิว 6 มิติ และรายงานอุปกรณ์ชำรุด',
                'ฟังก์ชัน Route Rest Planner และตัวกรองเจาะลึก',
                'การทดสอบร่วมกับผู้ใช้รถเข็นและผู้สูงอายุจริง',
              ],
            },
            {
              tier: 'ทางเลือกที่ 3: ระบบเชิงพาณิชย์ & สากล',
              highlight: 'ขยายผลเต็มรูปแบบ',
              badge: 'Full Scale',
              badgeColor: 'bg-purple-100 text-purple-800',
              scope: 'ครอบคลุมทั่วประเทศและเชื่อมต่อข้อมูลกับต่างประเทศ',
              features: [
                'Mobile App สมบูรณ์ (iOS & Android)',
                'ระบบ B2B Business Profile สำหรับเจ้าของสถานที่',
                'รองรับ 4 ภาษา (ไทย, อังกฤษ, จีน, ญี่ปุ่น)',
                'ความร่วมมือกับ ททท. และกรมทางหลวง',
                'ระบบตรวจจับภาพและคัดกรองเนื้อหา AI อัตโนมัติ',
              ],
            },
          ].map((b, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${b.badgeColor}`}>
                    {b.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900">{b.tier}</h3>
                <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  ขอบเขต: {b.scope}
                </p>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">องค์ประกอบหลัก:</span>
                  {b.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 4: RISK MITIGATION MATRIX */}
      {activeSubTab === 'risks' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              ตารางวิเคราะห์ความเสี่ยงและแนวทางบริหาร (Risk Mitigation Matrix)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ครอบคลุมความเสี่ยงด้านข้อมูล กฎหมายความเป็นส่วนตัว เทคโนโลยี และการขับขี่ปลอดภัย
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {[
              {
                title: 'ข้อมูลไม่ครบหรือล้าสมัย',
                impact: 'ผู้ใช้ไปถึงแล้วห้องน้ำปิดหรืออุปกรณ์ใช้การไม่ได้',
                solution: 'แสดงวันยืนยันข้อมูลชัดเจน ให้ชุมชนกดรายงาน และให้เจ้าของสถานที่ร่วมยืนยัน',
              },
              {
                title: 'รีวิวปลอม / ปั่นคะแนนเชิงลบ',
                impact: 'ความน่าเชื่อถือของแพลตฟอร์มและสถานที่ลดลง',
                solution: 'ตรวจจับพฤติกรรมผิดปกติ จำกัดการส่งซ้ำ และมีกระบวนการอุทธรณ์ตรวจสอบโดยมนุษย์',
              },
              {
                title: 'ข้อมูลการเข้าถึงคนพิการคลาดเคลื่อน',
                impact: 'ผู้ใช้รถเข็นหรือผู้สูงอายุได้รับผลกระทบทางกายภาพ',
                solution: 'แยกสถานะ "ยืนยันแล้ว" กับ "ยังไม่ทราบ" ชัดเจน บันทึกขนาดทางลาดและภาพถ่ายประตู',
              },
              {
                title: 'ค่าใช้จ่าย API แผนที่สูงเกินคาด',
                impact: 'ต้นทุนดำเนินงานเพิ่มขึ้นเมื่อผู้ใช้เติบโตเร็ว',
                solution: 'ทดลองใช้งาน ตั้งเพดานโควตา แคชพิกัดในเครื่อง และใช้ OpenStreetMap สลับกับ Google Maps',
              },
              {
                title: 'ภาพถ่ายละเมิดความเป็นส่วนตัว (PDPA)',
                impact: 'เกิดความเสียหาย เสี่ยงถูกฟ้องร้องดำเนินคดี',
                solution: 'แนวทางห้ามถ่ายติดบุคคลในห้องน้ำชัดเจน ระบบกลั่นกรอง และปุ่มแจ้งขอลบภาพทันที',
              },
              {
                title: 'การใช้งานโทรศัพท์ขณะขับรถ',
                impact: 'เสี่ยงต่อการเกิดอุบัติเหตุทางถนน',
                solution: 'ระบบแจ้งเตือนด้วยเสียงล่วงหน้า แนะนำให้ผู้ร่วมเดินทางหรือผู้โดยสารเป็นผู้เปิดดู',
              },
            ].map((r, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{r.title}</span>
                </div>
                <p className="text-xs text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                  <strong>ผลกระทบ:</strong> {r.impact}
                </p>
                <p className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                  <strong>แนวทางลดความเสี่ยง:</strong> {r.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
