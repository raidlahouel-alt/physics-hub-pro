import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2, Shield, Trash2 } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
}

interface Teacher extends Profile {
  is_teacher: boolean;
}

export default function ManageTeachers() {
  const { isTeacher } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesData) {
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');

      const teacherUserIds = new Set(teacherRoles?.map(r => r.user_id) || []);
      
      const usersWithRoles = profilesData.map(profile => ({
        ...profile,
        is_teacher: teacherUserIds.has(profile.user_id)
      }));

      setUsers(usersWithRoles as Teacher[]);
    }
    
    setLoading(false);
  };

  const handleToggleTeacher = async (userId: string, isCurrentlyTeacher: boolean) => {
    try {
      if (isCurrentlyTeacher) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'teacher');

        if (error) throw error;

        toast({
          title: 'تمت الإزالة',
          description: 'تم إزالة صلاحيات المعلم',
        });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'teacher' });

        if (error) {
          if (error.code === '23505') {
            toast({
              title: 'تنبيه',
              description: 'هذا المستخدم معلم بالفعل',
            });
            return;
          }
          throw error;
        }

        toast({
          title: 'تمت الإضافة',
          description: 'تم منح صلاحيات المعلم بنجاح',
        });
      }

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  if (!isTeacher) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-destructive">غير مصرح لك بالوصول</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold gradient-text">إدارة المعلمين</h1>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              جميع المستخدمين ({users.length})
            </h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا يوجد مستخدمون
              </p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.is_teacher 
                          ? 'bg-gradient-to-br from-primary to-accent' 
                          : 'bg-muted'
                      }`}>
                        {user.is_teacher ? (
                          <Shield className="w-5 h-5 text-primary-foreground" />
                        ) : (
                          <UserPlus className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.phone || 'لا يوجد رقم'} • {user.is_teacher ? 'معلم' : 'طالب'}
                        </div>
                      </div>
                    </div>
                    {user.is_teacher ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleTeacher(user.user_id, true)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        إزالة الصلاحيات
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleTeacher(user.user_id, false)}
                      >
                        <UserPlus className="w-4 h-4 ml-2" />
                        جعله معلماً
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
