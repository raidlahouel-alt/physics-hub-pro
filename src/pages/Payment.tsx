import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethod } from '@/lib/types';
import { CreditCard, Loader2, CheckCircle, Upload } from 'lucide-react';

const months = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const currentYear = new Date().getFullYear();

export default function Payment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ccp');
  const [transactionRef, setTransactionRef] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(`${months[new Date().getMonth()]} ${currentYear}`);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      let receiptUrl = null;

      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment-receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('payment-receipts')
          .getPublicUrl(fileName);
        
        receiptUrl = publicUrl;
      }

      const { error } = await supabase.from('payments').insert({
        user_id: user.id,
        amount: 2500,
        payment_method: paymentMethod,
        transaction_reference: transactionRef || null,
        month_paid_for: selectedMonth,
        receipt_url: receiptUrl,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'تم إرسال طلب الدفع',
        description: 'سيتم التحقق من الدفع وتأكيده قريباً',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال طلب الدفع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20">
          <div className="text-center animate-slide-up">
            <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              تم إرسال طلب الدفع بنجاح!
            </h1>
            <p className="text-muted-foreground mb-6">
              سيتم مراجعة طلبك وتأكيده من قبل الأستاذ في أقرب وقت
            </p>
            <Button variant="outline" onClick={() => setSuccess(false)}>
              إرسال طلب دفع آخر
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-2">دفع الاشتراك</h1>
              <p className="text-muted-foreground">2,500 دج شهرياً</p>
            </div>

            {/* Payment Info */}
            <div className="glass-card p-6 mb-6">
              <h3 className="font-semibold text-foreground mb-4">معلومات الدفع</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم CCP:</span>
                  <span className="text-foreground font-mono" dir="ltr">00799999 XX CLE XX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم البطاقة الذهبية:</span>
                  <span className="text-foreground font-mono" dir="ltr">XXXX XXXX XXXX XXXX</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  * سيتم تزويدك بالأرقام الصحيحة لاحقاً
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="glass-card p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Payment Method */}
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ccp')}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        paymentMethod === 'ccp'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary hover:border-primary/50'
                      }`}
                    >
                      <span className="font-semibold">CCP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('golden_card')}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        paymentMethod === 'golden_card'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary hover:border-primary/50'
                      }`}
                    >
                      <span className="font-semibold">البطاقة الذهبية</span>
                    </button>
                  </div>
                </div>

                {/* Month */}
                <div className="space-y-2">
                  <Label htmlFor="month">الشهر المدفوع له</Label>
                  <select
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-secondary text-foreground"
                  >
                    {months.map((month) => (
                      <option key={month} value={`${month} ${currentYear}`}>
                        {month} {currentYear}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Reference */}
                <div className="space-y-2">
                  <Label htmlFor="ref">رقم العملية (اختياري)</Label>
                  <Input
                    id="ref"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="أدخل رقم العملية"
                    dir="ltr"
                  />
                </div>

                {/* Receipt Upload */}
                <div className="space-y-2">
                  <Label>صورة الوصل (اختياري)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="receipt"
                    />
                    <label htmlFor="receipt" className="cursor-pointer">
                      {receiptFile ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <CheckCircle className="w-5 h-5" />
                          <span>{receiptFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-8 h-8" />
                          <span className="text-sm">اضغط لرفع صورة الوصل</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  إرسال طلب الدفع
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
