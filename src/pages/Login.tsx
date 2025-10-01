import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo-rafael-prudente.png";

const Login = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signUp, isAuthenticated, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const from = (location.state as any)?.from || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginData.email || !loginData.password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    const result = await login(loginData.email, loginData.password);

    if (result.error) {
      setError(result.error);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!signupData.email || !signupData.password || !signupData.name || !signupData.confirmPassword) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (signupData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    const result = await signUp(signupData.email, signupData.password, signupData.name);

    if (result.error) {
      setError(result.error);
    } else {
      setError("");
      setLoginData({ email: signupData.email, password: "" });
    }
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    setError("");
  };

  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="border-2 border-primary-400 rounded-2xl p-8 shadow-[0_0_20px_rgba(251,146,60,0.3)] bg-white/95 backdrop-blur-sm">
          <div className="text-center mb-8">
            <img 
              src={logo} 
              alt="Rafael Prudente - Deputado Federal" 
              className="w-[400px] h-[150px] mx-auto object-cover object-center"
            />
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-xl">Sistema de Gestão</CardTitle>
              <CardDescription>
                Entre ou crie sua conta para acessar
              </CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit}>
                  <CardContent className="space-y-4 pt-0">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={handleLoginInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={handleLoginInputChange}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label htmlFor="remember" className="text-sm font-medium leading-none">
                          Lembrar-me
                        </label>
                      </div>
                      <a href="/forgot-password" className="text-sm text-primary hover:underline">
                        Esqueceu a senha?
                      </a>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4 pt-4">
                    <Button type="submit" className="w-full">
                      Entrar
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignupSubmit}>
                  <CardContent className="space-y-4 pt-0">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome"
                        value={signupData.name}
                        onChange={handleSignupInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={handleSignupInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={handleSignupInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupData.confirmPassword}
                        onChange={handleSignupInputChange}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4 pt-4">
                    <Button type="submit" className="w-full">
                      Criar Conta
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
          
          <div className="text-center text-sm text-gray-600 mt-6">
            © 2025 Rafael Prudente - Deputado Federal
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
