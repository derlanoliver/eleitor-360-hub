import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, Copy, Trash2, Sparkles, FileText, Image as ImageIcon, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: AttachedFile[];
}

interface AttachedFile {
  name: string;
  type: "document" | "image";
  url?: string;
}

const AIAgent = () => {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! 👋 Sou o assistente virtual do Deputado Rafael Prudente.\n\nEstou aqui para ajudá-lo com informações sobre nossa campanha e análise de dados políticos.\n\n**Como posso ajudar você hoje?** 🤝\n\n📊 Posso consultar:\n• Rankings de cadastros por região\n• Performance de coordenadores\n• Temas mais populares\n• Perfil demográfico dos eleitores",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fileType = file.type.startsWith("image/") ? "image" : "document";
      const newFile: AttachedFile = {
        name: file.name,
        type: fileType,
      };
      setAttachedFiles((prev) => [...prev, newFile]);
    });

    toast({
      title: "Arquivo anexado",
      description: `${files.length} arquivo(s) anexado(s) com sucesso.`,
    });
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const splitIntoMessages = (content: string): string[] => {
    return content
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0);
  };

  const showMessagesSequentially = async (paragraphs: string[]) => {
    for (let i = 0; i < paragraphs.length; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      setMessages(prev => [...prev, {
        id: `${Date.now()}_${i}_${Math.random()}`,
        role: "assistant",
        content: paragraphs[i],
        timestamp: new Date(),
      }]);
    }
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    const currentInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFiles([]);
    setIsTyping(true);

    try {
      const apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      apiMessages.push({
        role: "user",
        content: currentInput
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: apiMessages,
            sessionId 
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let aiContent = "";

      if (reader) {
        let done = false;
        
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    aiContent += content;
                  }
                } catch (e) {
                  // Ignorar erros de parse
                }
              }
            }
          }
        }

        // Quebrar em parágrafos e mostrar sequencialmente
        const paragraphs = splitIntoMessages(aiContent);
        await showMessagesSequentially(paragraphs);
      }

    } catch (error) {
      console.error('Error calling AI:', error);
      setIsTyping(false);
      
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro ao conectar com IA",
        description: errorMsg.includes('API') 
          ? "Verifique se a chave de API está configurada em Configurações > Provedores de IA"
          : "Erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se a chave de API da OpenAI está configurada corretamente nas configurações.",
        timestamp: new Date(),
      }]);
    }
  };

  const handleClearConversation = () => {
    // Recarregar página para criar nova sessão e limpar memória completamente
    window.location.reload();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Assistente do Deputado Rafael Prudente</h1>
              <p className="text-sm text-gray-500">Análise de dados políticos em tempo real</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar conversa
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col gap-2 max-w-xl ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <Card className={`p-4 ${message.role === "user" ? "bg-primary-500 text-white" : "bg-white"}`}>
                    {message.role === "assistant" ? (
                      <div className="space-y-0">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="text-sm my-3 rounded"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                                  {children}
                                </code>
                              );
                            },
                            p: ({ children }: any) => (
                              <p className="text-sm leading-relaxed mb-3 last:mb-0">
                                {children}
                              </p>
                            ),
                            ul: ({ children }: any) => (
                              <ul className="my-2 ml-4 list-disc space-y-1 text-sm">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }: any) => (
                              <ol className="my-2 ml-4 list-decimal space-y-1 text-sm">
                                {children}
                              </ol>
                            ),
                            li: ({ children }: any) => (
                              <li className="text-sm leading-relaxed">
                                {children}
                              </li>
                            ),
                            strong: ({ children }: any) => (
                              <strong className="font-semibold text-gray-900">
                                {children}
                              </strong>
                            ),
                            em: ({ children }: any) => (
                              <em className="italic text-gray-700">
                                {children}
                              </em>
                            ),
                            h1: ({ children }: any) => (
                              <h1 className="text-base font-semibold mt-4 mb-2 first:mt-0">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }: any) => (
                              <h2 className="text-sm font-semibold mt-3 mb-2 first:mt-0">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }: any) => (
                              <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">
                                {children}
                              </h3>
                            ),
                            blockquote: ({ children }: any) => (
                              <blockquote className="border-l-3 border-primary-400 pl-3 italic my-2 text-sm text-gray-600">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                    )}
                    
                    {message.files && message.files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.files.map((file, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={message.role === "user" ? "bg-white/20 text-white" : ""}
                          >
                            {file.type === "image" ? (
                              <ImageIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <FileText className="h-3 w-3 mr-1" />
                            )}
                            {file.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => copyMessage(message.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 text-gray-700">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="p-4 bg-white">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, idx) => (
                <Badge key={idx} variant="secondary" className="pr-1">
                  {file.type === "image" ? (
                    <ImageIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  {file.name}
                  <button
                    onClick={() => removeFile(idx)}
                    className="ml-1 hover:bg-gray-300 rounded p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-12 w-12"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <div className="flex-1">
              <Input
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="resize-none h-12 py-3"
              />
            </div>

            <Button onClick={handleSend} size="icon" className="h-12 w-12">
              <Send className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Análises em tempo real com GPT-5 Mini • Dados atualizados automaticamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAgent;
