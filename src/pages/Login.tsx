import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo-rafael-prudente.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from || "/dashboard";
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    // Attempt login
    const success = await login(formData.email, formData.password, formData.rememberMe);
    
    if (success) {
      const from = location.state?.from || "/dashboard";
      navigate(from, { replace: true });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

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

          {/* Login Form */}
          <Card className="card-default border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center">Entrar</CardTitle>
              <CardDescription className="text-center">
                Digite suas credenciais para acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 focus-ring"
                      disabled={authLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 focus-ring"
                      disabled={authLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 focus:outline-none"
                    disabled={authLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      handleInputChange("rememberMe", checked as boolean)
                    }
                    disabled={authLoading}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Lembrar-me
                  </label>
                </div>
                
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-500 hover:text-primary-600 focus:outline-none focus:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>

                <Button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 focus:ring-primary-500"
                  disabled={authLoading}
                >
                  {authLoading ? "Entrando..." : "Entrar"}
                </Button>
            </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 Rafael Prudente - Deputado Federal
        </p>
      </div>
    </div>
  );
};

export default Login;