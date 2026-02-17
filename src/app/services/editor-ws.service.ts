import { Injectable, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentEvent {
  content: string;
  senderId?: string;
}

export interface TypingEvent {
  username: string;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EditorWsService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly apiUrl = environment.apiUrl.replace('/api', ''); // Base URL para socket

  // Signals para estado reactivo simple
  isConnected = signal<boolean>(false);
  activeUsers = signal<string[]>([]);

  // Subjects para streams de datos
  private contentSubject = new Subject<string>();
  content$ = this.contentSubject.asObservable();

  private typingSubject = new Subject<TypingEvent>();
  typing$ = this.typingSubject.asObservable();

  constructor() {}

  connect(token: string): void {
    if (this.socket) return;

    this.socket = io(`${this.apiUrl}/collaborative`, {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('WS Connected');
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WS Disconnected');
      this.isConnected.set(false);
    });

    this.socket.on('document-content', (data: { content: string }) => {
      this.contentSubject.next(data.content);
    });

    this.socket.on('receive-changes', (data: DocumentEvent) => {
      this.contentSubject.next(data.content);
    });

    this.socket.on('user-typing', (data: TypingEvent) => {
      this.typingSubject.next(data);
    });
  }

  joinDocument(documentId: string): void {
    this.socket?.emit('join-document', { documentId });
  }

  sendChanges(documentId: string, content: string): void {
    this.socket?.emit('send-changes', { documentId, content });
  }

  sendTyping(documentId: string, isTyping: boolean, username: string): void {
    this.socket?.emit('typing', { documentId, isTyping, username });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
