import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethod } from '@/lib/types';
import { CreditCard, Loader2, CheckCircle, Upload, Shield, Clock, Banknote, Smartphone } from 'lucide-react';

const months = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const currentYear = new Date().getFullYear();
const SUBSCRIPTION_PRICE = 2500;

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
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }
    
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
        amount: SUBSCRIPTION_PRICE,
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
      console.error('Payment error:', error);
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
          <div className="text-center animate-slide-up max-w-md mx-auto px-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mx-auto mb-6 animate-float">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              تم إرسال طلب الدفع بنجاح!
            </h1>
            <p className="text-muted-foreground mb-6">
              سيتم مراجعة طلبك وتأكيده من قبل الأستاذ في أقرب وقت. ستتلقى إشعاراً عند التأكيد.
            </p>
            <div className="glass-card p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الشهر:</span>
                <span className="font-semibold">{selectedMonth}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">المبلغ:</span>
                <span className="font-semibold text-primary">{SUBSCRIPTION_PRICE} دج</span>
              </div>
            </div>
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
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center mx-auto mb-6 shadow-glow">
                <CreditCard className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-3">دفع الاشتراك الشهري</h1>
              <p className="text-muted-foreground text-lg">اشترك الآن واحصل على جميع الدروس والملخصات والتمارين</p>
            </div>

            {/* Price Card */}
            <div className="glass-card p-8 mb-8 text-center border-primary/20">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                اشتراك شهري آمن
              </div>
              <div className="text-5xl font-bold gradient-text mb-2">{SUBSCRIPTION_PRICE.toLocaleString('ar-DZ')}</div>
              <div className="text-xl text-muted-foreground mb-6">دينار جزائري / شهر</div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { icon: '📚', text: 'جميع الدروس' },
                  { icon: '📝', text: 'الملخصات' },
                  { icon: '✏️', text: 'التمارين' },
                  { icon: '🤖', text: 'المساعد الذكي' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center justify-center gap-2 p-3 bg-secondary/50 rounded-lg">
                    <span>{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Payment Info */}
              <div className="glass-card p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-primary" />
                  معلومات التحويل
                </h3>
                
                <div className="space-y-4">
                  {/* CCP Info */}
                  <div className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'ccp' ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <span className="text-lg">📮</span>
                      </div>
                      <div>
                        <div className="font-semibold">CCP - بريد الجزائر</div>
                        <div className="text-xs text-muted-foreground">التحويل البريدي</div>
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg font-mono text-center text-lg tracking-wider">
                      00799999 XX CLE XX
                    </div>
                    <div className="text-xs text-center text-muted-foreground mt-2">
                      باسم: هزيل رفيق
                    </div>
                  </div>

                  {/* Golden Card Info */}
                  <div className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'golden_card' ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-lg">💳</span>
                      </div>
                      <div>
                        <div className="font-semibold">البطاقة الذهبية</div>
                        <div className="text-xs text-muted-foreground">Carte Dorée</div>
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg font-mono text-center text-lg tracking-wider">
                      XXXX XXXX XXXX XXXX
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  ⚠️ الأرقام الموضحة أعلاه هي أرقام توضيحية. سيتم تزويدك بالأرقام الصحيحة عند التواصل مع الأستاذ.
                </p>
              </div>

              {/* Form */}
              <div className="glass-card p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  تأكيد الدفع
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>طريقة الدفع</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('ccp')}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          paymentMethod === 'ccp'
                            ? 'border-primary bg-primary/10 text-primary shadow-md'
                            : 'border-border bg-secondary hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-1">📮</span>
                        <span className="font-semibold">CCP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('golden_card')}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          paymentMethod === 'golden_card'
                            ? 'border-primary bg-primary/10 text-primary shadow-md'
                            : 'border-border bg-secondary hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-1">💳</span>
                        <span className="font-semibold">البطاقة الذهبية</span>
                      </button>
                    </div>
                  </div>

                  {/* Month */}
                  <div className="space-y-2">
                    <Label htmlFor="month" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      الشهر المدفوع له
                    </Label>
                    <select
                      id="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-secondary text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
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
                      placeholder="أدخل رقم العملية من الوصل"
                      dir="ltr"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label>صورة الوصل (مستحسن)</Label>
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-primary/50 ${receiptFile ? 'border-success bg-success/5' : 'border-border'}`}>
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
                            <CheckCircle className="w-6 h-6" />
                            <div>
                              <div className="font-medium">{receiptFile.name}</div>
                              <div className="text-xs text-muted-foreground">انقر لتغيير الصورة</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="w-10 h-10" />
                            <span>اضغط لرفع صورة الوصل</span>
                            <span className="text-xs">PNG, JPG حتى 5MB</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full h-14 text-lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 ml-2" />
                        إرسال طلب الدفع
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
