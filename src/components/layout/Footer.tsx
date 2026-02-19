import { BookOpen, Mail, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function Footer() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <footer ref={ref} className="bg-card/40 backdrop-blur-sm border-t border-border/30 mt-auto">
      <div className={`container mx-auto px-4 py-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold gradient-text">أ. هزيل رفيق</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              منصة تعليمية متخصصة في الفيزياء لطلاب السنة الثانية ثانوي والبكالوريا
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">روابط سريعة</h4>
            <div className="flex flex-col gap-1.5">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
                الرئيسية
              </Link>
              <Link to="/levels" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
                الدروس
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">تواصل معنا</h4>
            <div className="flex flex-col gap-2">
              <a 
                href="mailto:rafikhh203@gmail.com" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                rafikhh203@gmail.com
              </a>
              <a 
                href="https://www.facebook.com/share/19P9q5FHke/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs"
              >
                <Facebook className="w-3.5 h-3.5" />
                صفحة الفيسبوك
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-7 pt-7 text-center">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} أ. هزيل رفيق - جميع الحقوق محفوظة
          </p>
          <p className="text-primary/60 text-[10px] mt-1.5 font-english font-medium tracking-wider">
            DESIGNED BY RAID LAHOUEL
          </p>
        </div>
      </div>
    </footer>
  );
}
