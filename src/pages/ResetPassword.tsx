import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Key } from "lucide-react";
import logo from "@/assets/logo-rafael-prudente.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Mock validations
    if (!formData.token || !formData.password || !formData.confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    if (formData.token !== "123456") {
      setError("Token inválido. Use: 123456 (mock)");
      setIsLoading(false);
      return;
    }

    // Mock password reset
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      navigate("/reset-success");
    } catch (err) {
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="Rafael Prudente - Deputado Federal" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Redefinir Senha
          </h1>
          <p className="text-gray-600">
            Digite o código enviado por e-mail e sua nova senha
          </p>
        </div>

        {/* Form */}
        <Card className="card-default">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Nova Senha</CardTitle>
            <CardDescription className="text-center">
              Complete os campos abaixo para redefinir sua senha
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
                <Label htmlFor="token">Código de Verificação</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <Input
                    id="token"
                    type="text"
                    placeholder="Digite o código recebido por e-mail"
                    value={formData.token}
                    onChange={(e) => handleInputChange("token", e.target.value)}
                    className="pl-10 focus-ring"
                    disabled={isLoading}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Mock: use o código <strong>123456</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <Input
                    id="password"
                    type={showPasswords.password ? "text" : "password"}
                    placeholder="Sua nova senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 focus-ring"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("password")}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 focus:outline-none"
                    disabled={isLoading}
                  >
                    {showPasswords.password ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 pr-10 focus-ring"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 focus:outline-none"
                    disabled={isLoading}
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                <p className="font-medium mb-1">Requisitos da senha:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Mínimo de 6 caracteres</li>
                  <li>• Use uma combinação de letras e números</li>
                  <li>• Evite informações pessoais</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              >
                {isLoading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-primary-600 focus:outline-none focus:text-primary-600"
              >
                Voltar ao login
              </Link>
            </div>
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

export default ResetPassword;