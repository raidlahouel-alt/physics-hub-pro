import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StudentLevel } from '@/lib/types';
import { User, Phone, GraduationCap, Loader2, Atom } from 'lucide-react';

const levelOptions: { value: StudentLevel; label: string }[] = [
  { value: 'second_year', label: 'السنة الثانية ثانوي' },
  { value: 'baccalaureate', label: 'البكالوريا' },
];

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState<StudentLevel | ''>('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone || '');
      setLevel(profile.level || '');
    }
  }, [profile]);

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
      <div className="min-h-[calc(100vh-4rem)] py-20 relative overflow-hidden">
        {/* Cosmic background */}
        <div className="absolute top-1/4 right-1/3 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[120px] animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '-3s', background: 'hsl(280 75% 65% / 0.04)' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center mx-auto mb-4 animate-gradient glow-effect">
                <Atom className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold gradient-text animate-slide-up">الملف الشخصي</h1>
              <p className="text-muted-foreground text-sm mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                قم بتحديث معلوماتك الشخصية
              </p>
            </div>

            {/* Profile Form */}
            <div className="glass-card p-6 md:p-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
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
                      className="w-full h-10 pr-10 pl-3 rounded-xl border border-border bg-secondary text-foreground transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
