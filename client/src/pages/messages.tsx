import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageSquare } from "lucide-react";
import type { Message, User } from "@shared/schema";

interface Conversation {
  userId: string;
  user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null };
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    refetchInterval: 5000,
  });

  const { data: chatMessages, isLoading: msgsLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
    refetchInterval: 3000,
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setMessageText("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    sendMessage.mutate({ receiverId: selectedConversation, content: messageText.trim() });
  };

  const selectedUser = conversations?.find((c) => c.userId === selectedConversation)?.user;

  return (
    <div className="flex h-[calc(100vh-65px)]">
      <div className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 flex-col border-r`}>
        <div className="p-4 border-b">
          <h1 className="font-semibold" data-testid="text-messages-title">Messages</h1>
        </div>
        <ScrollArea className="flex-1">
          {convsLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedConversation(conv.userId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors hover-elevate ${
                    selectedConversation === conv.userId ? "bg-accent" : ""
                  }`}
                  data-testid={`button-conversation-${conv.userId}`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={conv.user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {(conv.user.firstName?.[0] || "") + (conv.user.lastName?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {conv.user.firstName} {conv.user.lastName}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[hsl(var(--success))] text-white text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {selectedConversation && selectedUser ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden"
                onClick={() => setSelectedConversation(null)}
                data-testid="button-back-messages"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedUser.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs bg-muted">
                  {(selectedUser.firstName?.[0] || "") + (selectedUser.lastName?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
            </div>

            <ScrollArea className="flex-1 p-4">
              {msgsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 max-w-[60%]" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages?.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`} data-testid={`message-${msg.id}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1"
                data-testid="input-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageText.trim() || sendMessage.isPending}
                className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
