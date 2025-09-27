import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@shared/types';
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});
type LoginFormData = z.infer<typeof loginSchema>;
const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuth((state) => state.login);
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      login(response.user, response.token);
      toast.success('Login successful! Welcome back.');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-background p-4">
      <Card className="mx-auto max-w-sm w-full animate-fade-in shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Timer className="h-8 w-8 text-blue-800" />
            <span className="text-3xl font-bold font-display">ChronoFlow</span>
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="underline text-blue-800 hover:text-blue-600">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default LoginPage;