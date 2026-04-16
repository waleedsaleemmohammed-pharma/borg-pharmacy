import { useState, useEffect } from 'react';
import { DayOfWeek, Shift } from '@/types/pharmacy';
import { getCompanyByName, recordVisit, getVisitPrintCount } from '@/store/pharmacyStore';
import { ArrowRight, Printer, CheckCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LOGO_BASE64 } from '@/data/logoBase64';

interface Props {
  companyName: string;
  day: DayOfWeek;
  shift: Shift;
  weekNumber: number;
  selectedDate: Date;
  onBack: () => void;
}

function generateBarcode(data: string): string {
  const chars = data.split('');
  let bars = '';
  let x = 0;
  chars.forEach((char) => {
    const code = char.charCodeAt(0);
    const widths = [(code % 3) + 1, ((code >> 2) % 2) + 1, ((code >> 4) % 3) + 1, ((code >> 1) % 2) + 1];
    widths.forEach((w, j) => {
      if (j % 2 === 0) {
        bars += `<rect x="${x}" y="0" width="${w}" height="30" fill="#000"/>`;
      }
      x += w;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} 30" width="${Math.min(x, 160)}" height="30">${bars}</svg>`;
}

export default function CompanyRepsPage({ companyName, day, shift, weekNumber, selectedDate, onBack }: Props) {
  const company = getCompanyByName(companyName);
  const todayISO = selectedDate.toISOString().split('T')[0];
  const [printingRepId, setPrintingRepId] = useState<string | null>(null);
  const [printCounts, setPrintCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!company) return;
    const counts: Record<string, number> = {};
    company.representatives.forEach(rep => {
      counts[rep.id] = getVisitPrintCount(rep.id, todayISO, shift);
    });
    setPrintCounts(counts);
  }, [company, todayISO, shift]);

  function handlePrint(repId: string, repName: string) {
    setPrintingRepId(repId);

    recordVisit({
      companyName,
      representativeName: repName,
      representativeId: repId,
      day,
      shift,
      date: todayISO,
      weekNumber,
      month: selectedDate.getMonth(),
      year: selectedDate.getFullYear(),
      printed: true,
      printCount: 1,
    });

    setPrintCounts(prev => ({ ...prev, [repId]: (prev[repId] || 0) + 1 }));

    setTimeout(() => {
      window.print();
      setPrintingRepId(null);
    }, 100);
  }

  const dateStr = selectedDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const dayFullName = selectedDate.toLocaleDateString('ar-SA', { weekday: 'long' });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-primary mb-3 hover:underline">
          <ArrowRight className="w-4 h-4" />
          العودة لجدول اليوم
        </button>

        <div className="bg-card border-2 border-primary/20 rounded-xl p-4">
          <h2 className="text-base sm:text-lg font-black text-foreground">{companyName}</h2>
          <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">
            {day} - {shift} - الأسبوع {weekNumber}
          </p>
        </div>
      </div>

      {!company || company.representatives.length === 0 ? (
        <div className="bg-card border rounded-xl p-8 text-center no-print">
          <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-black text-foreground">لا يوجد مناديب مسجلين</p>
          <p className="text-sm font-bold text-muted-foreground mt-1">
            قم بإضافة مناديب من صفحة الشركات والمناديب
          </p>
        </div>
      ) : (
        <div className="space-y-2 no-print">
          {company.representatives.map(rep => {
            const count = printCounts[rep.id] || 0;
            const isPrinted = count > 0;
            return (
              <div
                key={rep.id}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all ${
                  isPrinted
                    ? 'bg-green-50 border-green-300'
                    : 'bg-card border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isPrinted ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {isPrinted ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xs sm:text-sm text-foreground truncate">{rep.name}</p>
                  {rep.phone && <p className="text-[10px] sm:text-xs font-bold text-muted-foreground">{rep.phone}</p>}
                  {isPrinted && (
                    <p className="text-[10px] sm:text-xs font-bold text-green-700">✓ تم تسجيل الحضور - عدد الطباعة: {count}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handlePrint(rep.id, rep.name)}
                  className="gap-1 text-xs shrink-0"
                  variant={isPrinted ? 'outline' : 'default'}
                >
                  <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{isPrinted ? `إعادة (${count})` : 'طباعة'}</span>
                  <span className="sm:hidden">{isPrinted ? count : '🖨'}</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {printingRepId && company && (() => {
        const rep = company.representatives.find(r => r.id === printingRepId);
        if (!rep) return null;
        const barcodeData = `${companyName.substring(0, 10)}-${rep.name.substring(0, 8)}-${day}`;
        const barcodeSvg = generateBarcode(barcodeData);
        const count = printCounts[rep.id] || 1;

        return (
          <div className="hidden print:block print-permit" style={{ width: '58mm', margin: '0 auto', overflow: 'hidden' }}>
            <div style={{
              padding: '2mm 3mm',
              fontFamily: 'Cairo, sans-serif',
              direction: 'rtl',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#fff',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5mm' }}>
                <div style={{
                  width: '20mm',
                  height: '20mm',
                  borderRadius: '50%',
                  border: '2px solid #1a3a5c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  overflow: 'hidden',
                }}>
                  <img src={LOGO_BASE64} alt="logo" style={{
                    width: '16mm',
                    height: '16mm',
                    objectFit: 'cover',
                  }} />
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                width: '100%',
                border: '2px solid #1a3a5c',
                padding: '1.5mm 1mm',
                marginBottom: '1.5mm',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 900, color: '#1a3a5c', margin: 0, lineHeight: '1.3' }}>مستشفى برج الأطباء</p>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#333', margin: '1px 0 0' }}>تصريح زيارة مندوب أدوية</p>
              </div>

              <div style={{
                width: '100%',
                border: '2px solid #1a3a5c',
                padding: '2mm',
                marginBottom: '1.5mm',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '9px', fontWeight: 900, color: '#1a3a5c', margin: 0 }}>الشركة: {companyName}</p>
                <div style={{ borderTop: '1px solid #ccc', margin: '1.5mm 0' }} />
                <p style={{ fontSize: '9px', fontWeight: 900, color: '#1a3a5c', margin: 0 }}>المندوب: {rep.name}</p>
              </div>

              <div style={{
                width: '100%',
                padding: '1mm 2mm',
                marginBottom: '1.5mm',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', lineHeight: '2.2' }}>
                  <span style={{ fontWeight: 900, color: '#1a3a5c' }}>اليوم:</span>
                  <span style={{ fontWeight: 900, color: '#000' }}>{dayFullName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', lineHeight: '2.2' }}>
                  <span style={{ fontWeight: 900, color: '#1a3a5c' }}>التاريخ:</span>
                  <span style={{ fontWeight: 900, color: '#000' }}>{dateStr}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', lineHeight: '2.2' }}>
                  <span style={{ fontWeight: 900, color: '#1a3a5c' }}>الفترة:</span>
                  <span style={{ fontWeight: 900, color: '#000' }}>{shift}</span>
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                borderTop: '1px dashed #999',
                paddingTop: '1.5mm',
                width: '100%',
              }}>
                <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                <p style={{ fontSize: '6px', fontWeight: 700, marginTop: '1px', color: '#666' }}>طباعة #{count}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
