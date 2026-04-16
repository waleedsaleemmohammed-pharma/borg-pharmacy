import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Company, CompanyRating } from '@/types/pharmacy';
import { getCompanies, updateCompanyRating } from '@/store/pharmacyStore';
import { Search, Save, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RATING_LABELS: Record<CompanyRating, { label: string; desc: string; color: string }> = {
  A: { label: 'A', desc: '3 زيارات شهرياً', color: 'bg-green-100 text-green-800 border-green-300' },
  B: { label: 'B', desc: 'زيارتان شهرياً', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  C: { label: 'C', desc: 'زيارة واحدة شهرياً', color: 'bg-orange-100 text-orange-800 border-orange-300' },
};

export default function CompanyRatingPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [ratings, setRatings] = useState<Record<string, CompanyRating>>({});
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => { reload(); }, []);

  function reload() {
    const c = getCompanies();
    setCompanies(c);
    const r: Record<string, CompanyRating> = {};
    c.forEach(co => { r[co.id] = co.rating || 'B'; });
    setRatings(r);
  }

  function handleSave() {
    Object.entries(ratings).forEach(([id, rating]) => {
      updateCompanyRating(id, rating);
    });
    setEditing(false);
    reload();
    toast({ title: 'تم الحفظ', description: 'تم حفظ تقييمات الشركات وتحديث الجداول' });
  }

  const filtered = companies.filter(c => c.name.includes(search));

  const counts = { A: 0, B: 0, C: 0 };
  companies.forEach(c => { counts[ratings[c.id] || 'B']++; });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-3">
        {(['A', 'B', 'C'] as CompanyRating[]).map(r => (
          <div key={r} className={`rounded-xl border p-3 ${RATING_LABELS[r].color}`}>
            <p className="text-2xl font-black">{counts[r]}</p>
            <p className="text-xs font-bold">تقييم {r} - {RATING_LABELS[r].desc}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="gap-2 font-black">
          <Save className="w-4 h-4" />
          حفظ التقييمات
        </Button>
        <Button variant={editing ? 'default' : 'outline'} onClick={() => setEditing(!editing)} className="gap-2 font-black">
          <Pencil className="w-4 h-4" />
          {editing ? 'إيقاف التعديل' : 'تعديل'}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن شركة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10 font-bold text-foreground"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(company => {
          const rating = ratings[company.id] || 'B';
          const info = RATING_LABELS[rating];
          return (
            <div key={company.id} className="bg-card border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border ${info.color}`}>
                {rating}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-foreground truncate">{company.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{info.desc}</p>
              </div>
              {editing ? (
                <Select
                  value={rating}
                  onValueChange={(v) => setRatings(prev => ({ ...prev, [company.id]: v as CompanyRating }))}
                >
                  <SelectTrigger className="w-20 h-8 font-black text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className={`px-3 py-1 rounded-lg text-sm font-black border ${info.color}`}>{rating}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
