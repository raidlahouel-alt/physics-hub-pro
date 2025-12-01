import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X, BookOpen, User, LogOut, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
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
              <>
                <Link to="/levels" className="text-foreground/80 hover:text-foreground transition-colors">
                  الدروس
                </Link>
                <Link to="/chat" className="text-foreground/80 hover:text-foreground transition-colors">
                  المساعد الذكي
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {profile?.is_teacher && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/teacher">
                      <LayoutDashboard className="w-4 h-4 ml-2" />
                      لوحة التحكم
                    </Link>
                  </Button>
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
              <Link to="/" className="py-2 text-foreground/80 hover:text-foreground" onClick={() => setIsOpen(false)}>
                الرئيسية
              </Link>
              {user ? (
                <>
                  <Link to="/levels" className="py-2 text-foreground/80 hover:text-foreground" onClick={() => setIsOpen(false)}>
                    الدروس
                  </Link>
                  <Link to="/chat" className="py-2 text-foreground/80 hover:text-foreground" onClick={() => setIsOpen(false)}>
                    المساعد الذكي
                  </Link>
                  {profile?.is_teacher && (
                    <Link to="/teacher" className="py-2 text-primary" onClick={() => setIsOpen(false)}>
                      لوحة التحكم
                    </Link>
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
