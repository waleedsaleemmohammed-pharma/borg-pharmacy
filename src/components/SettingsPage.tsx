import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  exportAllData, importAllData, 
  getTelegramConfig, saveTelegramConfig, testTelegramConnection, 
  syncToTelegram, restoreFromTelegram 
} from '@/store/pharmacyStore';
import { Download, Upload, Send, CheckCircle, Loader2, MessageCircle, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const existingConfig = getTelegramConfig();
  const [botToken, setBotToken] = useState(existingConfig?.botToken || '');
  const [chatId, setChatId] = useState(existingConfig?.chatId || '');
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(!!existingConfig);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  function handleBackup() {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'تم التصدير', description: 'تم حفظ النسخة الاحتياطية بنجاح' });
  }

  function handleRestore() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (importAllData(result)) {
        toast({ title: 'تم الاستعادة', description: 'تم استعادة البيانات بنجاح. سيتم تحديث الصفحة.' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({ title: 'خطأ', description: 'ملف غير صالح', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  }

  async function handleTestConnection() {
    if (!botToken.trim() || !chatId.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال التوكن ومعرف المحادثة', variant: 'destructive' });
      return;
    }
    setTesting(true);
    const success = await testTelegramConnection(botToken.trim(), chatId.trim());
    setTesting(false);
    if (success) {
      saveTelegramConfig({ botToken: botToken.trim(), chatId: chatId.trim() });
      setConnected(true);
      toast({ title: 'تم الاتصال', description: 'تم الاتصال بتلجرام بنجاح ✅' });
    } else {
      toast({ title: 'فشل الاتصال', description: 'تأكد من صحة التوكن ومعرف المحادثة', variant: 'destructive' });
    }
  }

  async function handleSyncToTelegram() {
    setSyncing(true);
    const success = await syncToTelegram();
    setSyncing(false);
    if (success) {
      toast({ title: 'تم المزامنة', description: 'تم رفع النسخة الاحتياطية لتلجرام ✅' });
    } else {
      toast({ title: 'خطأ', description: 'فشل في المزامنة', variant: 'destructive' });
    }
  }

  async function handleRestoreFromTelegram() {
    setRestoring(true);
    const success = await restoreFromTelegram();
    setRestoring(false);
    if (success) {
      toast({ title: 'تم الاستعادة', description: 'تم استعادة البيانات من تلجرام. سيتم تحديث الصفحة.' });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast({ title: 'خطأ', description: 'لم يتم العثور على نسخة احتياطية في تلجرام', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h3 className="font-black text-base text-foreground">النسخ الاحتياطي</h3>
        <div className="flex gap-3">
          <Button onClick={handleBackup} className="flex-1 gap-2 font-black">
            <Download className="w-4 h-4" />
            حفظ نسخة احتياطية
          </Button>
          <Button onClick={handleRestore} variant="outline" className="flex-1 gap-2 font-black">
            <Upload className="w-4 h-4" />
            استعادة نسخة احتياطية
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
      </div>

      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-black text-base text-foreground">ربط تلجرام</h3>
          {connected && <CheckCircle className="w-4 h-4 text-green-500 mr-auto" />}
        </div>
        <p className="text-xs font-bold text-muted-foreground">
          يتم حفظ قاعدة البيانات تلقائياً على بوت تلجرام عند أي تغيير. كما يتم المزامنة التلقائية عند فتح التطبيق.
        </p>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">توكن البوت (Bot Token)</label>
            <Input
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={botToken}
              onChange={e => setBotToken(e.target.value)}
              className="font-bold text-foreground text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">معرف المحادثة (Chat ID)</label>
            <Input
              placeholder="-1001234567890"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              className="font-bold text-foreground text-sm"
              dir="ltr"
            />
          </div>

          <Button onClick={handleTestConnection} disabled={testing} className="w-full gap-2 font-black">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {testing ? 'جاري الاختبار...' : 'اختبار الاتصال وحفظ'}
          </Button>

          {connected && (
            <div className="flex gap-3">
              <Button onClick={handleSyncToTelegram} disabled={syncing} variant="outline" className="flex-1 gap-2 font-black">
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                رفع نسخة لتلجرام
              </Button>
              <Button onClick={handleRestoreFromTelegram} disabled={restoring} variant="outline" className="flex-1 gap-2 font-black">
                {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                استعادة من تلجرام
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
