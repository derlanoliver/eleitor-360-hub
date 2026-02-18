import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMMENTS_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { ThumbsUp, ThumbsDown, Minus, Share2, Heart, Search, ExternalLink } from "lucide-react";

const sourceIcons: Record<string, string> = {
  twitter: '𝕏',
  instagram: '📸',
  facebook: '📘',
  youtube: '▶️',
  tiktok: '🎵',
  portal: '📰',
};

const Comments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = COMMENTS_DATA.filter((c) => {
    if (searchTerm && !c.content.toLowerCase().includes(searchTerm.toLowerCase()) && !c.author.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (sentimentFilter !== 'all' && c.sentiment !== sentimentFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comentários & Menções</h1>
        <p className="text-gray-500 mt-1">Todas as menções coletadas, classificadas por sentimento e categoria</p>
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
                <SelectItem value="comparação">Comparação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="twitter">X (Twitter)</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="portal">Portais</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{filtered.length} menções encontradas</p>

      {/* Comments list */}
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
                    <a href={c.url} className="flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Ver original</a>
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
