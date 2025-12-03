import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Phone, CheckCircle, Shield } from 'lucide-react';

interface PhoneVerificationProps {
  phone: string;
  onVerified: () => void;
  onCancel?: () => void;
}

export function PhoneVerification({ phone, onVerified, onCancel }: PhoneVerificationProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentCode, setSentCode] = useState<string | null>(null);

  const sendVerificationCode = async () => {
    if (!phone || phone.length < 10) {
      toast.error('يرجى إدخال رقم هاتف صالح');
      return;
    }

    setLoading(true);
    
    // Generate a 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(verificationCode);
    
    try {
      // Call edge function to send SMS
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { 
          phone: phone,
          message: `رمز التحقق الخاص بك هو: ${verificationCode}\nمنصة الأستاذ هزيل رفيق`
        }
      });

      if (error) {
        console.error('SMS error:', error);
        // For development/demo, allow verification to proceed
        toast.info(`رمز التحقق للتجربة: ${verificationCode}`, { duration: 10000 });
        setStep('verify');
      } else {
        toast.success('تم إرسال رمز التحقق إلى هاتفك');
        setStep('verify');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      // For development/demo, show the code
      toast.info(`رمز التحقق للتجربة: ${verificationCode}`, { duration: 10000 });
      setStep('verify');
    }
    
    setLoading(false);
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast.error('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setLoading(true);

    if (code === sentCode) {
      // Update profile to mark phone as verified
      if (user) {
        await supabase
          .from('profiles')
          .update({ phone_verified: true })
          .eq('user_id', user.id);
      }
      
      toast.success('تم التحقق من رقم الهاتف بنجاح');
      onVerified();
    } else {
      toast.error('رمز التحقق غير صحيح');
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-secondary/30">
      <div className="flex items-center gap-2 text-primary">
        <Shield className="w-5 h-5" />
        <span className="font-semibold">التحقق من رقم الهاتف</span>
      </div>

      {step === 'send' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            سنرسل رمز تحقق إلى رقم الهاتف: <span className="font-mono text-foreground" dir="ltr">{phone}</span>
          </p>
          <div className="flex gap-2">
            <Button onClick={sendVerificationCode} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Phone className="w-4 h-4 ml-2" />}
              إرسال رمز التحقق
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            أدخل رمز التحقق المكون من 6 أرقام الذي تم إرساله إلى هاتفك
          </p>
          <div className="space-y-2">
            <Label htmlFor="code">رمز التحقق</Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              dir="ltr"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={verifyCode} disabled={loading || code.length !== 6} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
              تأكيد الرمز
            </Button>
            <Button variant="outline" onClick={() => { setStep('send'); setCode(''); }}>
              إعادة الإرسال
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
