import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import logo from "@/assets/logo-rafael-prudente.png";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

const Login = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated - navegação imediata
  useEffect(() => {
    console.log('🔄 Login useEffect:', { 
      isAuthenticated, 
      authLoading, 
      hasUser: !!useAuth().user 
    });
    
    if (isAuthenticated) {
      console.log('✅ Navegando para dashboard...');
      const from = (location.state as any)?.from || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, authLoading]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      loginSchema.parse(loginData);
      await login(loginData.email, loginData.password);
      // Navigation será feita automaticamente pelo useEffect quando isAuthenticated mudar
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      signupSchema.parse(signupData);
      const success = await signup(signupData.email, signupData.password, signupData.name);
      
      if (success) {
        // Auto-login after successful signup
        setTimeout(async () => {
          await login(signupData.email, signupData.password);
        }, 500);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Container com borda neon */}
        <div className="border-2 border-primary-400 rounded-2xl p-8 shadow-[0_0_20px_rgba(251,146,60,0.3)] bg-white/95 backdrop-blur-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={logo} 
              alt="Rafael Prudente - Deputado Federal" 
              className="w-[400px] h-[150px] mx-auto object-cover object-center"
            />
          </div>

          {/* Login/Signup Form */}
          <Card className="card-default border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center">Bem-vindo</CardTitle>
              <CardDescription className="text-center">
                Entre com suas credenciais ou crie uma conta
              </CardDescription>
            </CardHeader>
            <CardContent>
        {/* Cadastro desativado - usuários serão aprovados por administradores no futuro */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6">
            <TabsTrigger value="login">Entrar</TabsTrigger>
          </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => {
                          setLoginData(prev => ({ ...prev, email: e.target.value }));
                          setError("");
                        }}
                        disabled={isSubmitting}
                        required
                        className="focus-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => {
                            setLoginData(prev => ({ ...prev, password: e.target.value }));
                            setError("");
                          }}
                          disabled={isSubmitting}
                          required
                          className="pr-10 focus-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <Link 
                        to="/forgot-password" 
                        className="text-sm text-primary-500 hover:text-primary-600"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary-500 hover:bg-primary-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={signupData.name}
                        onChange={(e) => {
                          setSignupData(prev => ({ ...prev, name: e.target.value }));
                          setError("");
                        }}
                        disabled={isSubmitting}
                        required
                        className="focus-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-mail</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => {
                          setSignupData(prev => ({ ...prev, email: e.target.value }));
                          setError("");
                        }}
                        disabled={isSubmitting}
                        required
                        className="focus-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupData.password}
                          onChange={(e) => {
                            setSignupData(prev => ({ ...prev, password: e.target.value }));
                            setError("");
                          }}
                          disabled={isSubmitting}
                          required
                          className="pr-10 focus-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                      <Input
                        id="signup-confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupData.confirmPassword}
                        onChange={(e) => {
                          setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }));
                          setError("");
                        }}
                        disabled={isSubmitting}
                        required
                        className="focus-ring"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary-500 hover:bg-primary-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2025 Rafael Prudente - Deputado Federal
        </p>
      </div>
    </div>
  );
};

export default Login;
