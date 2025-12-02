import { useState, useRef, useEffect } from "react";
import { useOrganization, useUpdateOrganization, uploadOrganizationLogo } from "@/hooks/useOrganization";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Camera, 
  Save, 
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Briefcase
} from "lucide-react";

const Organization = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [partido, setPartido] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (organization) {
      setNome(organization.nome || "");
      setCargo(organization.cargo || "");
      setPartido(organization.partido || "");
      setEstado(organization.estado || "");
      setCidade(organization.cidade || "");
      setBio(organization.bio || "");
      setLogoUrl(organization.logo_url);
      setWebsite(organization.website || "");
      setInstagram(organization.instagram || "");
      setFacebook(organization.facebook || "");
      setTwitter(organization.twitter || "");
      setYoutube(organization.youtube || "");
      setWhatsapp(organization.whatsapp || "");
      setEmailContato(organization.email_contato || "");
    }
  }, [organization]);

  const initials = nome
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadOrganizationLogo(file);
      setLogoUrl(url);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateOrganization.mutate({
      nome,
      cargo,
      partido,
      estado,
      cidade,
      bio,
      logo_url: logoUrl,
      website,
      instagram,
      facebook,
      twitter,
      youtube,
      whatsapp,
      email_contato: emailContato,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organização</h1>
          <p className="text-muted-foreground">
            Configure os dados do político e da campanha
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card do Logo */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Logo / Foto</CardTitle>
              <CardDescription>
                Imagem principal da organização
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <AvatarImage src={logoUrl || undefined} alt={nome} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {initials || <Building2 className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                JPG, PNG ou GIF. Máximo 2MB.
              </p>
            </CardContent>
          </Card>

          {/* Card de Dados do Político */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Dados do Político
              </CardTitle>
              <CardDescription>
                Informações principais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do político"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Deputado Distrital"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="partido">Partido</Label>
                  <Input
                    id="partido"
                    value={partido}
                    onChange={(e) => setPartido(e.target.value)}
                    placeholder="Sigla do partido"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    placeholder="Ex: DF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: Brasília"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Biografia */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Biografia</CardTitle>
              <CardDescription>
                Uma descrição sobre o político e sua atuação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Escreva uma biografia..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Card de Redes Sociais */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Redes Sociais
              </CardTitle>
              <CardDescription>
                Links para perfis nas redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="URL do perfil"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter / X
                  </Label>
                  <Input
                    id="twitter"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </Label>
                  <Input
                    id="youtube"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="URL do canal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Contato */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Contato
              </CardTitle>
              <CardDescription>
                Informações de contato públicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailContato" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="emailContato"
                  type="email"
                  value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                  placeholder="contato@..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateOrganization.isPending}
            className="min-w-32"
          >
            {updateOrganization.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Organization;
