import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Payment, StudentLevel } from '@/lib/types';
import { User, Phone, GraduationCap, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const levelOptions: { value: StudentLevel; label: string }[] = [
  { value: 'second_year', label: 'السنة الثانية ثانوي' },
  { value: 'baccalaureate', label: 'البكالوريا' },
];

const statusConfig = {
  pending: { label: 'قيد المراجعة', color: 'text-warning', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'text-success', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'text-destructive', icon: XCircle },
};

export default function Profile() {
  const { profile, updateProfile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState<StudentLevel | ''>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone || '');
      setLevel(profile.level || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data as Payment[]);
      }
      setLoadingPayments(false);
    };

    fetchPayments();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile({
      full_name: fullName,
      phone: phone || null,
      level: level || null,
    });

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الملف الشخصي',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث ملفك الشخصي بنجاح',
      });
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">الملف الشخصي</h1>
            </div>

            {/* Profile Form */}
            <div className="glass-card p-6 mb-8">
              <h2 className="font-semibold text-foreground mb-6">معلوماتك الشخصية</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0X XX XX XX XX"
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">المستوى الدراسي</Label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select
                      id="level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value as StudentLevel)}
                      className="w-full h-10 pr-10 pl-3 rounded-lg border border-border bg-secondary text-foreground"
                    >
                      <option value="">اختر المستوى</option>
                      {levelOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  حفظ التغييرات
                </Button>
              </form>
            </div>

            {/* Payment History */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-foreground mb-6">سجل المدفوعات</h2>
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد مدفوعات بعد
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const status = statusConfig[payment.status];
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                      >
                        <div>
                          <div className="font-medium text-foreground">{payment.month_paid_for}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(payment.created_at), 'dd MMMM yyyy', { locale: ar })}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">{payment.amount} دج</span>
                          <div className={`flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm">{status.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
