import { Injectable, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionService } from '../core/auth/data-access/session.service';

export interface ChatMessage {
  id: string;
  content: string;
  authorId: number;
  authorName: string;
  projectId: string;
  createdAt: Date;
  isEdited: boolean;
}

export interface OnlineUser {
  userId: number;
  userName: string;
  lastSeen: Date;
}

export interface ChatHistoryEvent {
  projectId: string;
  messages: ChatMessage[];
}

export interface NewMessageEvent {
  projectId: string;
  message: ChatMessage;
  senderId: string;
}

export interface MessageEditedEvent {
  projectId: string;
  message: ChatMessage;
}

export interface MessageDeletedEvent {
  projectId: string;
  messageId: string;
}

export interface PresenceUpdateEvent {
  projectId: string;
  onlineUsers: OnlineUser[];
  onlineCount: number;
}

export interface UserTypingEvent {
  projectId: string;
  userId: number;
  userName: string;
  isTyping: boolean;
}

export interface OnlineUsersEvent {
  projectId: string;
  users: OnlineUser[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatWsService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly apiUrl = environment.apiUrl.replace('/api', ''); // Base URL para socket

  // Signals para estado reactivo
  isConnected = signal<boolean>(false);
  onlineUsers = signal<OnlineUser[]>([]);
  onlineCount = signal<number>(0);

  // Subjects para streams de datos
  private messageSubject = new Subject<ChatMessage>();
  message$ = this.messageSubject.asObservable();

  private historySubject = new Subject<ChatHistoryEvent>();
  history$ = this.historySubject.asObservable();

  private messageEditedSubject = new Subject<MessageEditedEvent>();
  messageEdited$ = this.messageEditedSubject.asObservable();

  private messageDeletedSubject = new Subject<MessageDeletedEvent>();
  messageDeleted$ = this.messageDeletedSubject.asObservable();

  private presenceSubject = new Subject<PresenceUpdateEvent>();
  presence$ = this.presenceSubject.asObservable();

  private typingSubject = new Subject<UserTypingEvent>();
  typing$ = this.typingSubject.asObservable();

  private onlineUsersSubject = new Subject<OnlineUsersEvent>();
  onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor(private SessionService: SessionService) {}

  connect(): void {
    if (this.socket) return;

    const token = this.SessionService.getToken();
    if (!token) {
      console.error('No hay token de autenticación para conectar al chat');
      return;
    }

    this.socket = io(`${this.apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Chat WS Connected');
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Chat WS Disconnected');
      this.isConnected.set(false);
    });

    this.socket.on('chat-history', (data: ChatHistoryEvent) => {
      this.historySubject.next(data);
    });

    this.socket.on('new-message', (data: NewMessageEvent) => {
      this.messageSubject.next(data.message);
    });

    this.socket.on('message-edited', (data: MessageEditedEvent) => {
      this.messageEditedSubject.next(data);
    });

    this.socket.on('message-deleted', (data: MessageDeletedEvent) => {
      this.messageDeletedSubject.next(data);
    });

    this.socket.on('presence-update', (data: PresenceUpdateEvent) => {
      this.presenceSubject.next(data);
      this.onlineUsers.set(data.onlineUsers);
      this.onlineCount.set(data.onlineCount);
    });

    this.socket.on('user-typing', (data: UserTypingEvent) => {
      this.typingSubject.next(data);
    });

    this.socket.on('online-users', (data: OnlineUsersEvent) => {
      this.onlineUsersSubject.next(data);
      this.onlineUsers.set(data.users);
      this.onlineCount.set(data.count);
    });

    this.socket.on('error', (data: { message: string }) => {
      console.error('Chat WS Error:', data.message);
    });
  }

  joinChat(projectId: string): void {
    if (!this.socket) {
      this.connect();
    }

    const user = this.SessionService.getUserFromToken();
    if (!user) {
      console.error('Usuario no autenticado para unirse al chat');
      return;
    }

    this.socket?.emit('join-chat', {
      projectId,
      userId: user.sub,
      userName: user.name || 'Usuario'
    });
  }

  leaveChat(projectId: string): void {
    this.socket?.emit('leave-chat', { projectId });
  }

  sendMessage(projectId: string, content: string): void {
    if (!this.socket) return;

    const user = this.SessionService.getUserFromToken();
    if (!user) return;

    this.socket.emit('send-message', {
      projectId,
      content,
      userId: user.sub,
      userName: user.name || 'Usuario'
    });
  }

  editMessage(projectId: string, messageId: string, content: string): void {
    if (!this.socket) return;

    const user = this.SessionService.getUserFromToken();
    if (!user) return;

    this.socket.emit('edit-message', {
      projectId,
      messageId,
      content,
      userId: user.sub
    });
  }

  deleteMessage(projectId: string, messageId: string): void {
    if (!this.socket) return;

    const user = this.SessionService.getUserFromToken();
    if (!user) return;

    this.socket.emit('delete-message', {
      projectId,
      messageId,
      userId: user.sub
    });
  }

  sendTyping(projectId: string, isTyping: boolean): void {
    if (!this.socket) return;

    const user = this.SessionService.getUserFromToken();
    if (!user) return;

    this.socket.emit('typing', {
      projectId,
      userId: user.sub,
      userName: user.name || 'Usuario',
      isTyping
    });
  }

  getOnlineUsers(projectId: string): void {
    this.socket?.emit('get-online-users', { projectId });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected.set(false);
    this.onlineUsers.set([]);
    this.onlineCount.set(0);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
