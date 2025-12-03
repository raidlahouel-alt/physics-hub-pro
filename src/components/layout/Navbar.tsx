import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Menu, X, BookOpen, User, LogOut, LayoutDashboard, Shield, HelpCircle } from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">أ. هزيل رفيق</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
              الرئيسية
            </Link>
            {user && (
              <Link to="/levels" className="text-foreground/80 hover:text-foreground transition-colors">
                الدروس
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            {user ? (
              <>
                {isTeacher && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/teacher">
                        <LayoutDashboard className="w-4 h-4 ml-2" />
                        لوحة التحكم
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/teacher-questions">
                        <HelpCircle className="w-4 h-4 ml-2" />
                        الأسئلة
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/manage-teachers">
                        <Shield className="w-4 h-4 ml-2" />
                        إدارة المعلمين
                      </Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/profile">
                    <User className="w-4 h-4 ml-2" />
                    {profile?.full_name || 'حسابي'}
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">تسجيل الدخول</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth?mode=signup">إنشاء حساب</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/30 animate-fade-in">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-foreground/80">تغيير المظهر</span>
                <ThemeToggle />
              </div>
              <Link to="/" className="py-2 text-foreground/80 hover:text-foreground" onClick={() => setIsOpen(false)}>
                الرئيسية
              </Link>
              {user ? (
                <>
                  <Link to="/levels" className="py-2 text-foreground/80 hover:text-foreground" onClick={() => setIsOpen(false)}>
                    الدروس
                  </Link>
                  {isTeacher && (
                    <>
                      <Link to="/teacher" className="py-2 text-primary" onClick={() => setIsOpen(false)}>
                        لوحة التحكم
                      </Link>
                      <Link to="/teacher-questions" className="py-2 text-primary" onClick={() => setIsOpen(false)}>
                        الأسئلة
                      </Link>
                      <Link to="/manage-teachers" className="py-2 text-primary" onClick={() => setIsOpen(false)}>
                        إدارة المعلمين
                      </Link>
                    </>
                  )}
                  <Link to="/profile" className="py-2 text-foreground/80 hover:text-foreground" onClick={() => setIsOpen(false)}>
                    حسابي
                  </Link>
                  <Button variant="ghost" onClick={() => { handleSignOut(); setIsOpen(false); }} className="justify-start">
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="py-2" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full">تسجيل الدخول</Button>
                  </Link>
                  <Link to="/auth?mode=signup" className="py-2" onClick={() => setIsOpen(false)}>
                    <Button variant="hero" className="w-full">إنشاء حساب</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
