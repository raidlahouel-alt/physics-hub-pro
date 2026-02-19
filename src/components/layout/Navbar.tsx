import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUnansweredQuestions } from '@/hooks/useUnansweredQuestions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Menu, X, BookOpen, User, LogOut, LayoutDashboard, Shield, HelpCircle, ChevronLeft } from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut, isTeacher } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const unansweredCount = useUnansweredQuestions(isTeacher);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-background/80 backdrop-blur-2xl border-b border-border/40 shadow-sm' 
        : 'bg-transparent backdrop-blur-none border-b border-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">أ. هزيل رفيق</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/" 
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive('/') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              الرئيسية
            </Link>
            {user && (
              <Link 
                to="/levels" 
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive('/levels') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                الدروس
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            {user ? (
              <>
                {isTeacher && (
                  <>
                    <Button variant="ghost" size="sm" asChild className="rounded-xl">
                      <Link to="/teacher">
                        <LayoutDashboard className="w-4 h-4 ml-1.5" />
                        لوحة التحكم
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="relative rounded-xl">
                      <Link to="/teacher-questions">
                        <HelpCircle className="w-4 h-4 ml-1.5" />
                        الأسئلة
                        {unansweredCount > 0 && (
                          <span className="absolute -top-0.5 -left-0.5 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
                            {unansweredCount > 9 ? '9+' : unansweredCount}
                          </span>
                        )}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="rounded-xl">
                      <Link to="/manage-teachers">
                        <Shield className="w-4 h-4 ml-1.5" />
                        إدارة المعلمين
                      </Link>
                    </Button>
                  </>
                )}
                <div className="w-px h-6 bg-border/50 mx-1" />
                <Button variant="ghost" size="sm" asChild className="rounded-xl">
                  <Link to="/profile">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ml-1.5">
                      <User className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    {profile?.full_name || 'حسابي'}
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-xl text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="rounded-xl">
                  <Link to="/auth">تسجيل الدخول</Link>
                </Button>
                <Button variant="hero" asChild className="rounded-xl">
                  <Link to="/auth?mode=signup">إنشاء حساب</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationBell />
            <button
              className="p-2 rounded-xl text-foreground hover:bg-secondary/60 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-400 ease-out ${
          isOpen ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}>
          <div className="flex flex-col gap-1 pt-2 border-t border-border/30">
            <Link to="/" className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
              isActive('/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}>
              الرئيسية
              <ChevronLeft className="w-4 h-4 opacity-40" />
            </Link>
            {user ? (
              <>
                <Link to="/levels" className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/levels') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}>
                  الدروس
                  <ChevronLeft className="w-4 h-4 opacity-40" />
                </Link>
                {isTeacher && (
                  <>
                    <Link to="/teacher" className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive('/teacher') ? 'bg-primary/10 text-primary' : 'text-primary/80 hover:bg-primary/5'
                    }`}>
                      <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> لوحة التحكم</span>
                      <ChevronLeft className="w-4 h-4 opacity-40" />
                    </Link>
                    <Link to="/teacher-questions" className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive('/teacher-questions') ? 'bg-primary/10 text-primary' : 'text-primary/80 hover:bg-primary/5'
                    }`}>
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" /> الأسئلة
                        {unansweredCount > 0 && (
                          <span className="w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                            {unansweredCount > 9 ? '9+' : unansweredCount}
                          </span>
                        )}
                      </span>
                      <ChevronLeft className="w-4 h-4 opacity-40" />
                    </Link>
                    <Link to="/manage-teachers" className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive('/manage-teachers') ? 'bg-primary/10 text-primary' : 'text-primary/80 hover:bg-primary/5'
                    }`}>
                      <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> إدارة المعلمين</span>
                      <ChevronLeft className="w-4 h-4 opacity-40" />
                    </Link>
                  </>
                )}
                <Link to="/profile" className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/profile') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}>
                  <span className="flex items-center gap-2"><User className="w-4 h-4" /> حسابي</span>
                  <ChevronLeft className="w-4 h-4 opacity-40" />
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-destructive/80 hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/auth" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl">تسجيل الدخول</Button>
                </Link>
                <Link to="/auth?mode=signup" className="flex-1">
                  <Button variant="hero" className="w-full rounded-xl">إنشاء حساب</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
