import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMMENTS_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { useMonitoredEntities, useMentions, useSentimentAnalyses } from "@/hooks/public-opinion/usePublicOpinion";
import { ThumbsUp, ThumbsDown, Minus, Share2, Heart, Search, ExternalLink } from "lucide-react";

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

const Comments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: entities } = useMonitoredEntities();
  const principalEntity = entities?.find(e => e.is_principal) || entities?.[0];
  const { data: mentions } = useMentions(principalEntity?.id, undefined, 500);
  const { data: analyses } = useSentimentAnalyses(principalEntity?.id);

  // Build analysis map
  const analysisMap = new Map(analyses?.map(a => [a.mention_id, a]) || []);

  // If we have real mentions, use them; otherwise fallback to demo
  const hasRealData = mentions && mentions.length > 0;

  // Build mention map for quick lookup
  const mentionMap = new Map(mentions?.map(m => [m.id, m]) || []);

  const realComments = hasRealData
    ? (() => {
        // Prioritize mentions that have analyses (sorted: analyzed first, then unanalyzed)
        const analyzed: any[] = [];
        const unanalyzed: any[] = [];

        // First: build comments from analyses (guaranteed to have sentiment)
        (analyses || []).forEach(a => {
          const m = mentionMap.get(a.mention_id);
          if (!m) return;
          analyzed.push({
            id: m.id,
            author: m.author_name || m.author_handle || 'Anônimo',
            source: m.source,
            content: m.content,
            sentiment: a.sentiment === 'positivo' ? 'positive' : a.sentiment === 'negativo' ? 'negative' : 'neutral',
            category: a.category || 'sem categoria',
            date: m.published_at || m.collected_at,
            likes: m.engagement?.likes || 0,
            shares: m.engagement?.shares || 0,
            url: m.source_url || '#',
            location: null,
          });
        });

        // Then: add mentions without analyses
        const analyzedIds = new Set(analyses?.map(a => a.mention_id) || []);
        mentions!.forEach(m => {
          if (analyzedIds.has(m.id)) return;
          unanalyzed.push({
            id: m.id,
            author: m.author_name || m.author_handle || 'Anônimo',
            source: m.source,
            content: m.content,
            sentiment: 'neutral',
            category: 'pendente',
            date: m.published_at || m.collected_at,
            likes: m.engagement?.likes || 0,
            shares: m.engagement?.shares || 0,
            url: m.source_url || '#',
            location: null,
          });
        });

        // Sort analyzed by date desc, then append unanalyzed
        analyzed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return [...analyzed, ...unanalyzed];
      })()
    : COMMENTS_DATA;

  const filtered = realComments.filter((c) => {
    if (searchTerm && !c.content.toLowerCase().includes(searchTerm.toLowerCase()) && !c.author.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (sentimentFilter !== 'all' && c.sentiment !== sentimentFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comentários & Menções</h1>
        <p className="text-gray-500 mt-1 flex items-center gap-2">
          Todas as menções coletadas, classificadas por sentimento e categoria
          {!hasRealData && <Badge variant="outline" className="ml-2">Demo</Badge>}
          {hasRealData && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
              <Input placeholder="Buscar menções..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger><SelectValue placeholder="Sentimento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
                <SelectItem value="neutral">Neutro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="elogio">Elogio</SelectItem>
                <SelectItem value="reclamação">Reclamação</SelectItem>
                <SelectItem value="dúvida">Dúvida</SelectItem>
                <SelectItem value="sugestão">Sugestão</SelectItem>
                <SelectItem value="ataque">Ataque</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="google_search">Google Search</SelectItem>
                <SelectItem value="google_news">Google News</SelectItem>
                <SelectItem value="portais_br">Portais Brasileiros</SelectItem>
                <SelectItem value="portais_df">Portais DF</SelectItem>
                <SelectItem value="fontes_oficiais">Fontes Oficiais</SelectItem>
                <SelectItem value="twitter">X (Twitter)</SelectItem>
                <SelectItem value="twitter_comments">X (Respostas)</SelectItem>
                <SelectItem value="threads">Threads</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="instagram_comments">Instagram (Comentários)</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="facebook_comments">Facebook (Comentários)</SelectItem>
                <SelectItem value="youtube_search">YouTube (Busca)</SelectItem>
                <SelectItem value="youtube_comments">YouTube (Comentários)</SelectItem>
                <SelectItem value="tiktok">TikTok (Feed Público)</SelectItem>
                <SelectItem value="tiktok_comments">TikTok (Comentários)</SelectItem>
                <SelectItem value="news">Portais (Bing/Yahoo)</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="influencer_comments">Influenciadores</SelectItem>
                <SelectItem value="sites_custom">Sites Personalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{filtered.length} menções encontradas</p>

      <div className="space-y-3">
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg shrink-0">
                  {sourceIcons[c.source] || '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{c.author}</span>
                    <Badge variant="outline" className="text-xs capitalize">{c.source}</Badge>
                    <Badge variant={c.sentiment === 'positive' ? 'default' : c.sentiment === 'negative' ? 'destructive' : 'secondary'} className="text-xs">
                      {c.sentiment === 'positive' ? '👍 Positivo' : c.sentiment === 'negative' ? '👎 Negativo' : '➖ Neutro'}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">{c.category}</Badge>
                    {c.location && <span className="text-xs text-muted-foreground">📍 {c.location}</span>}
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{c.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {c.likes}</span>
                    <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {c.shares}</span>
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
      </div>
    </div>
  );
};

export default Comments;
