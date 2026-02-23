import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Instagram, Loader2, Search, UserCheck, UserX, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FollowerResult {
  leader_id: string;
  nome_completo: string;
  instagram_username: string | null;
  is_follower: boolean;
  match_type: string | null;
  matched_instagram: string | null;
}

interface ScrapeResponse {
  profile: string;
  total_followers_scraped: number;
  total_leaders: number;
  leaders_following: number;
  leaders_not_following: number;
  results: FollowerResult[];
}

export default function InstagramFollowers() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("rafaelprudentedep");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ScrapeResponse | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const handleScrape = async () => {
    if (!username.trim()) {
      toast.error("Informe o username do Instagram");
      return;
    }

    setIsLoading(true);
    setData(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("scrape-instagram-followers", {
        body: { instagram_username: username.trim() },
      });

      if (error) throw error;
      setData(result);
      toast.success(`Raspagem concluída! ${result.leaders_following} líderes seguem o perfil.`);
    } catch (error: any) {
      console.error("Erro na raspagem:", error);
      toast.error(error.message || "Erro ao raspar seguidores do Instagram");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults = data?.results.filter((r) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "following" && r.is_follower) ||
      (filter === "not_following" && !r.is_follower);

    const matchesSearch =
      !search ||
      r.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      (r.instagram_username || "").toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  }) || [];

  const matchTypeLabel = (type: string | null) => {
    switch (type) {
      case "username_exact": return "Username exato";
      case "name_exact": return "Nome exato";
      case "name_partial": return "Nome parcial";
      default: return "-";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Instagram className="h-6 w-6 text-pink-500" />
            Seguidores do Instagram
          </h1>
          <p className="text-muted-foreground">
            Verifique quais lideranças seguem o perfil no Instagram
          </p>
        </div>
      </div>

      {/* Config Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuração da Raspagem</CardTitle>
          <CardDescription>
            Informe o perfil do Instagram para verificar quais líderes o seguem.
            O processo pode levar alguns minutos dependendo do número de seguidores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="username">Username do Instagram</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace("@", ""))}
                  placeholder="rafaelprudentedep"
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button onClick={handleScrape} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Raspando... (pode levar 2-5 min)
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Iniciar Raspagem
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Instagram className="h-8 w-8 text-pink-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.total_followers_scraped.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Seguidores raspados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{data.total_leaders}</p>
                    <p className="text-sm text-muted-foreground">Líderes ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.leaders_following}</p>
                    <p className="text-sm text-muted-foreground">Seguem o perfil</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserX className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.leaders_not_following}</p>
                    <p className="text-sm text-muted-foreground">Não seguem</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Resultados do Cruzamento</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar líder..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Todos ({data.total_leaders})</TabsTrigger>
                  <TabsTrigger value="following">Seguem ({data.leaders_following})</TabsTrigger>
                  <TabsTrigger value="not_following">Não seguem ({data.leaders_not_following})</TabsTrigger>
                </TabsList>

                <TabsContent value={filter}>
                  <div className="rounded-md border max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Líder</TableHead>
                          <TableHead>Instagram Cadastrado</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tipo de Match</TableHead>
                          <TableHead>Instagram Encontrado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResults.map((r) => (
                          <TableRow key={r.leader_id}>
                            <TableCell className="font-medium">{r.nome_completo}</TableCell>
                            <TableCell>{r.instagram_username || <span className="text-muted-foreground">-</span>}</TableCell>
                            <TableCell>
                              {r.is_follower ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Segue
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <UserX className="h-3 w-3 mr-1" />
                                  Não segue
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{matchTypeLabel(r.match_type)}</TableCell>
                            <TableCell>
                              {r.matched_instagram ? (
                                <a
                                  href={`https://instagram.com/${r.matched_instagram}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-pink-500 hover:underline"
                                >
                                  @{r.matched_instagram}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredResults.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              Nenhum resultado encontrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
