import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import logo from "@/assets/logo-rafael-prudente.png";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Mock validation
    if (!formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Por favor, insira um e-mail válido.");
      setIsLoading(false);
      return;
    }

    // Mock authentication
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock successful login
      if (formData.email === "admin@rafaelprudente.com" && formData.password === "123456") {
        navigate("/dashboard");
      } else {
        setError("E-mail ou senha incorretos. Tente: admin@rafaelprudente.com / 123456");
      }
    } catch (err) {
      setError("Erro interno. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="Rafael Prudente - Deputado Federal" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Plataforma 360 Eleitor/DF
          </h1>
          <p className="text-gray-600">
            Faça login para acessar a plataforma
          </p>
        </div>

        {/* Login Form */}
        <Card className="card-default">
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 focus:outline-none"
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 Rafael Prudente - Deputado Federal
        </p>
      </div>
    </div>
  );
};

export default Login;