import { BookOpen, Mail, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function Footer() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <footer ref={ref} className="bg-card/50 border-t border-border/30 mt-auto">
      <div className={`container mx-auto px-4 py-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className={`transition-all duration-500 delay-100 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">أ. هزيل رفيق</span>
            </div>
            <p className="text-muted-foreground text-sm">
              منصة تعليمية متخصصة في الفيزياء لطلاب السنة الثانية ثانوي والبكالوريا
            </p>
          </div>

          {/* Quick Links */}
          <div className={`transition-all duration-500 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <h4 className="font-semibold text-foreground mb-4">روابط سريعة</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                الرئيسية
              </Link>
              <Link to="/levels" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                الدروس
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className={`transition-all duration-500 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <h4 className="font-semibold text-foreground mb-4">تواصل معنا</h4>
            <div className="flex flex-col gap-3">
              <a 
                href="mailto:rafikhh203@gmail.com" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                rafikhh203@gmail.com
              </a>
              <a 
                href="https://www.facebook.com/share/19P9q5FHke/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Facebook className="w-4 h-4" />
                صفحة الفيسبوك
              </a>
            </div>
          </div>
        </div>

        <div className={`border-t border-border/30 mt-8 pt-8 text-center transition-all duration-500 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} أ. هزيل رفيق - جميع الحقوق محفوظة
          </p>
          <p className="text-primary text-xs mt-2 font-english font-semibold tracking-wider">
            THIS PLATFORM DESIGNED BY RAID LAHOUEL
          </p>
        </div>
      </div>
    </footer>
  );
}
