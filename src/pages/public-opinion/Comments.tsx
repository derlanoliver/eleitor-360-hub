import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { COMMENTS_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { useMonitoredEntities } from "@/hooks/public-opinion/usePublicOpinion";
import { useCommentsPageData } from "@/hooks/public-opinion/useCommentsPageData";
import { ThumbsUp, ThumbsDown, Minus, Share2, Heart, Search, ExternalLink, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const sourceIcons: Record<string, string> = {
  twitter: '𝕏', twitter_comments: '💬𝕏',
  instagram: '📸', instagram_comments: '💬📸',
  facebook: '📘', facebook_comments: '💬📘',
  youtube: '▶️', youtube_comments: '💬▶️', youtube_search: '🔍▶️',
  tiktok: '🎵', tiktok_comments: '💬🎵',
  threads: '🧵',
  portal: '📰', news: '📰', google_news: '📰', portais_df: '🗞️',
  google_search: '🔍', portais_br: '📰', fontes_oficiais: '🏛️',
  reddit: '🤖', telegram: '✈️',
  influencer_comments: '🎤', sites_custom: '🌐',
};

const sourceLabels: Record<string, string> = {
  instagram_comments: 'Instagram (Comentários)',
  twitter: 'X (Twitter)',
  twitter_comments: 'X (Respostas)',
  instagram: 'Instagram',
  facebook_comments: 'Facebook (Comentários)',
  facebook: 'Facebook',
  tiktok: 'TikTok (Feed)',
  youtube_comments: 'YouTube (Comentários)',
  tiktok_comments: 'TikTok (Comentários)',
  fontes_oficiais: 'Fontes Oficiais',
  google_news: 'Google News',
  news: 'Portais (Bing/Yahoo)',
  influencer_comments: 'Influenciadores',
  portais_br: 'Portais Brasileiros',
  sites_custom: 'Sites Personalizados',
  threads: 'Threads',
  reddit: 'Reddit',
  telegram: 'Telegram',
  google_search: 'Google Search',
  youtube_search: 'YouTube (Busca)',
  portais_df: 'Portais DF',
};

const categoryLabels: Record<string, string> = {
  elogio: 'Elogio',
  'notícia': 'Notícia',
  noticia: 'Notícia',
  ataque: 'Ataque',
  defesa: 'Defesa',
  'reclamação': 'Reclamação',
  humor: 'Humor',
  'sugestão': 'Sugestão',
  neutro: 'Neutro',
  'dúvida': 'Dúvida',
  duvida: 'Dúvida',
  'divulgação': 'Divulgação',
  social: 'Social',
  outro: 'Outro',
  fake_news: 'Fake News',
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const Comments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const { data: entities } = useMonitoredEntities();
  const principalEntity = entities?.find(e => e.is_principal) || entities?.[0];

  // Map sentiment filter to DB value
  const dbSentiment = sentimentFilter === 'positive' ? 'positivo' : sentimentFilter === 'negative' ? 'negativo' : sentimentFilter === 'neutral' ? 'neutro' : undefined;

  const { data, isLoading } = useCommentsPageData({
    entityId: principalEntity?.id,
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    sentiment: dbSentiment,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchTerm.length >= 3 ? searchTerm : undefined,
    page,
    pageSize,
  });

  const hasRealData = data && data.totalCount > 0;
  const isDemo = !hasRealData && !isLoading;

  // Demo fallback
  const demoFiltered = useMemo(() => {
    if (hasRealData) return [];
    return COMMENTS_DATA.filter((c) => {
      if (searchTerm && !c.content.toLowerCase().includes(searchTerm.toLowerCase()) && !c.author.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (sentimentFilter !== 'all' && c.sentiment !== sentimentFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
      return true;
    });
  }, [hasRealData, searchTerm, sentimentFilter, categoryFilter, sourceFilter]);

  const comments = hasRealData ? data.items : demoFiltered.slice(page * pageSize, (page + 1) * pageSize);
  const totalCount = hasRealData ? data.totalCount : demoFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(0);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comentários & Menções</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          Todas as menções coletadas, classificadas por sentimento e categoria
          {isDemo && <Badge variant="outline" className="ml-2">Demo</Badge>}
          {hasRealData && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'hsl(142 71% 45%)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(142 71% 45%)' }} />
              Ao vivo
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar menções (mín. 3 letras)..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={sentimentFilter} onValueChange={handleFilterChange(setSentimentFilter)}>
              <SelectTrigger><SelectValue placeholder="Sentimento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Sentimentos</SelectItem>
                <SelectItem value="positive">👍 Positivo</SelectItem>
                <SelectItem value="negative">👎 Negativo</SelectItem>
                <SelectItem value="neutral">➖ Neutro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={handleFilterChange(setCategoryFilter)}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={handleFilterChange(setSourceFilter)}>
              <SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Fontes</SelectItem>
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{sourceIcons[key] || '💬'} {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{totalCount.toLocaleString('pt-BR')}</span> menções encontradas
              {totalPages > 1 && <span className="ml-2">· Página {page + 1} de {totalPages}</span>}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Exibir:</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(s => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                    {sourceIcons[c.source] || '💬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{c.author}</span>
                      <Badge variant="outline" className="text-xs">{sourceLabels[c.source] || c.source}</Badge>
                      <Badge
                        variant={c.sentiment === 'positive' ? 'default' : c.sentiment === 'negative' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {c.sentiment === 'positive' ? '👍 Positivo' : c.sentiment === 'negative' ? '👎 Negativo' : '➖ Neutro'}
                      </Badge>
                      {c.category && c.category !== 'pendente' && (
                        <Badge variant="outline" className="text-xs capitalize">{categoryLabels[c.category] || c.category}</Badge>
                      )}
                      {c.category === 'pendente' && (
                        <Badge variant="outline" className="text-xs text-warning border-warning/40">⏳ Pendente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-4">{c.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {(c.likes > 0) && <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {c.likes}</span>}
                      {(c.shares > 0) && <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {c.shares}</span>}
                      <span>{new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {c.url && c.url !== '#' && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Ver original
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {comments.length === 0 && !isLoading && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma menção encontrada com os filtros selecionados.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (page < 4) {
                pageNum = i;
              } else if (page > totalPages - 5) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => setPage(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || isLoading}
          >
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Comments;
