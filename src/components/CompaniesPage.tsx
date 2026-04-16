import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Company, CompanyRating } from '@/types/pharmacy';
import { getCompanies, addCompany, deleteCompany, addRepresentative, removeRepresentative, updateCompanyName } from '@/store/pharmacyStore';
import { Plus, Trash2, UserPlus, Search, ChevronDown, ChevronUp, Users, Building2, Pencil, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyRating, setNewCompanyRating] = useState<CompanyRating>('B');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newRepName, setNewRepName] = useState('');
  const [newRepPhone, setNewRepPhone] = useState('');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { toast } = useToast();

  useEffect(() => { reload(); }, []);

  function reload() { setCompanies(getCompanies()); }

  function handleAddCompany(e: React.FormEvent) {
    e.preventDefault();
    const name = newCompanyName.trim();
    if (!name) return;
    if (companies.some(c => c.name === name)) {
      toast({ title: 'خطأ', description: 'هذه الشركة موجودة بالفعل', variant: 'destructive' });
      return;
    }
    addCompany(name, newCompanyRating);
    setNewCompanyName('');
    setNewCompanyRating('B');
    reload();
    toast({ title: 'تمت الإضافة', description: `تم إضافة شركة ${name} بتقييم ${newCompanyRating}` });
  }

  function handleDeleteCompany(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف شركة "${name}"؟`)) return;
    deleteCompany(id);
    reload();
    toast({ title: 'تم الحذف', description: `تم حذف شركة ${name}` });
  }

  function handleEditCompany(id: string) {
    const name = editingName.trim();
    if (!name) return;
    updateCompanyName(id, name);
    setEditingCompanyId(null);
    reload();
    toast({ title: 'تم التعديل', description: `تم تعديل اسم الشركة` });
  }

  function handleAddRep(companyId: string) {
    const name = newRepName.trim();
    if (!name) return;
    addRepresentative(companyId, name, newRepPhone.trim() || undefined);
    setNewRepName('');
    setNewRepPhone('');
    reload();
    toast({ title: 'تمت الإضافة', description: `تم إضافة المندوب ${name}` });
  }

  function handleRemoveRep(companyId: string, repId: string) {
    removeRepresentative(companyId, repId);
    reload();
  }

  const filtered = companies.filter(c => c.name.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{companies.length}</p>
            <p className="text-xs font-bold text-muted-foreground">شركة</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{companies.reduce((sum, c) => sum + c.representatives.length, 0)}</p>
            <p className="text-xs font-bold text-muted-foreground">مندوب</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleAddCompany} className="flex gap-2 flex-wrap">
        <Input
          placeholder="اسم الشركة الجديدة..."
          value={newCompanyName}
          onChange={e => setNewCompanyName(e.target.value)}
          className="flex-1 min-w-[150px] font-bold text-foreground"
        />
        <Select value={newCompanyRating} onValueChange={v => setNewCompanyRating(v as CompanyRating)}>
          <SelectTrigger className="w-24 font-black">
            <SelectValue placeholder="تقييم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C">C</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" className="gap-2 font-black">
          <Plus className="w-4 h-4" />
          إضافة شركة
        </Button>
      </form>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن شركة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10 font-bold text-foreground"
        />
      </div>

      <div className="space-y-3">
        {filtered.map(company => (
          <div key={company.id} className="bg-card border rounded-xl overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
            >
              <div className="flex-1">
                {editingCompanyId === company.id ? (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      className="text-sm font-bold h-8"
                      autoFocus
                    />
                    <button onClick={() => handleEditCompany(company.id)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCompanyId(null)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-black text-xs sm:text-sm text-foreground truncate">{company.name}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground">
                      ID: {company.id.substring(0, 8)} • {company.representatives.length} مندوب
                    </p>
                  </>
                )}
              </div>
              {editingCompanyId !== company.id && (
                <button
                  onClick={e => { e.stopPropagation(); setEditingCompanyId(company.id); setEditingName(company.name); }}
                  className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {expandedId === company.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              <button
                onClick={e => { e.stopPropagation(); handleDeleteCompany(company.id, company.name); }}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {expandedId === company.id && (
              <div className="border-t px-4 py-3 bg-muted/20 space-y-3">
                {company.representatives.length > 0 && (
                  <div className="space-y-2">
                    {company.representatives.map(rep => (
                      <div key={rep.id} className="flex items-center gap-2 text-sm bg-card rounded-lg px-3 py-2 border">
                        <span className="flex-1 font-black text-foreground">{rep.name}</span>
                        {rep.phone && <span className="text-xs font-bold text-muted-foreground">{rep.phone}</span>}
                        <button
                          onClick={() => handleRemoveRep(company.id, rep.id)}
                          className="text-destructive hover:bg-destructive/10 rounded p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="اسم المندوب"
                    value={expandedId === company.id ? newRepName : ''}
                    onChange={e => setNewRepName(e.target.value)}
                    className="flex-1 text-sm font-bold text-foreground"
                  />
                  <Input
                    placeholder="رقم الهاتف (اختياري)"
                    value={expandedId === company.id ? newRepPhone : ''}
                    onChange={e => setNewRepPhone(e.target.value)}
                    className="w-36 text-sm font-bold text-foreground"
                  />
                  <Button size="sm" onClick={() => handleAddRep(company.id)} className="gap-1 font-black">
                    <UserPlus className="w-3 h-3" />
                    إضافة
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
