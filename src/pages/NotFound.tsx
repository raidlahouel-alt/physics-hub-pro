import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Home, ArrowRight } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGoBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center px-4">
          <h1 className="mb-4 text-8xl font-bold gradient-text">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">عذراً! الصفحة غير موجودة</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowRight className="w-4 h-4 ml-2" />
              الرجوع للخلف
            </Button>
            <Button variant="hero" asChild>
              <Link to="/">
                <Home className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
