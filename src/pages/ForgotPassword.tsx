import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Send } from "lucide-react";
import logo from "@/assets/logo-rafael-prudente.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Mock validation
    if (!email) {
      setError("Por favor, insira seu e-mail.");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Por favor, insira um e-mail válido.");
      setIsLoading(false);
      return;
    }

    // Mock email sending
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSuccess(true);
      
      // Auto redirect after success
      setTimeout(() => {
        navigate("/reset-password");
      }, 3000);
    } catch (err) {
      setError("Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src={logo} 
              alt="Rafael Prudente - Deputado Federal" 
              className="h-20 w-auto mx-auto mb-4"
            />
          </div>

          <Card className="card-default">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-600">E-mail Enviado!</CardTitle>
              <CardDescription className="text-center">
                Enviamos as instruções para redefinir sua senha para:
                <br />
                <strong className="text-gray-900">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Verifique sua caixa de entrada e siga as instruções no e-mail.
                Se não encontrar, verifique a pasta de spam.
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={() => navigate("/reset-password")}
                  className="w-full bg-primary-500 hover:bg-primary-600"
                >
                  Continuar (Mock)
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Voltar ao login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Esqueceu sua senha?
          </h1>
          <p className="text-gray-600">
            Digite seu e-mail e enviaremos instruções para redefinir
          </p>
        </div>

        {/* Form */}
        <Card className="card-default">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Recuperar Senha</CardTitle>
            <CardDescription className="text-center">
              Insira o e-mail associado à sua conta
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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className="pl-10 focus-ring"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Instruções"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/login"
                className="flex items-center justify-center text-sm text-gray-600 hover:text-primary-600 focus:outline-none focus:text-primary-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
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

export default ForgotPassword;