import { Injectable } from '@angular/core';
import { ChatWsService } from './chat-ws.service';
import { Subscription } from 'rxjs';

export interface LoopTesterConfig {
  enabled: boolean;
  responseDelay: number; // milisegundos
  autoGreet: boolean;
  responses: {
    triggers: string[];
    response: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class LoopTesterService {
  private config: LoopTesterConfig = {
    enabled: true,
    responseDelay: 1000,
    autoGreet: true,
    responses: [
      {
        triggers: ['hola', 'hello', 'hi', 'buenos días'],
        response: '¡Hola! Soy Loop Tester, un bot de prueba para el chat. ¿En qué puedo ayudarte?'
      },
      {
        triggers: ['cómo estás', 'qué tal', 'how are you'],
        response: '¡Estoy funcionando perfectamente! Soy un bot de prueba para verificar el chat en tiempo real.'
      },
      {
        triggers: ['proyecto', 'project', 'trabajo'],
        response: 'Este es un chat de proyecto colaborativo. Puedes discutir ideas, compartir archivos y coordinar tareas con tu equipo.'
      },
      {
        triggers: ['ayuda', 'help', 'comandos'],
        response: 'Comandos disponibles: "hola" para saludar, "proyecto" para información, "test" para probar funcionalidades, "ping" para verificar conectividad.'
      },
      {
        triggers: ['test', 'prueba', 'testing'],
        response: '✅ Test de funcionalidad completado. El chat está funcionando correctamente con WebSockets en tiempo real.'
      },
      {
        triggers: ['ping', 'conexión', 'conectado'],
        response: '🏓 Pong! Conexión WebSocket activa. Chat funcionando en tiempo real.'
      },
      {
        triggers: ['gracias', 'thanks', 'thank you'],
        response: '¡De nada! Estoy aquí para ayudar a probar la funcionalidad del chat.'
      },
      {
        triggers: ['chiste', 'joke', 'dime un chiste'],
        response: '¿Por qué los programadores prefieren el modo oscuro? ¡Porque la luz atrae los bugs! 😄'
      }
    ]
  };

  private activeProjectId: string | null = null;
  private messageSubscription: Subscription | null = null;
  private isProcessing = false;

  constructor(private chatWsService: ChatWsService) {}

  enableForProject(projectId: string): void {
    if (!this.config.enabled) return;

    this.activeProjectId = projectId;
    
    // Suscribirse a nuevos mensajes
    this.messageSubscription = this.chatWsService.message$.subscribe(message => {
      if (message.projectId === projectId && !this.isProcessing) {
        this.processMessage(message);
      }
    });

    // Saludar automáticamente si está configurado
    if (this.config.autoGreet) {
      setTimeout(() => {
        this.sendResponse('¡Hola a todos! Soy Loop Tester, listo para ayudar con pruebas del chat.');
      }, 2000);
    }
  }

  disable(): void {
    this.activeProjectId = null;
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
  }

  private processMessage(message: any): void {
    if (this.isProcessing || !this.activeProjectId) return;

    // Evitar responder a mensajes del propio bot
    if (message.authorName?.toLowerCase().includes('loop tester') || 
        message.authorName?.toLowerCase().includes('bot')) {
      return;
    }

    const messageText = message.content.toLowerCase().trim();
    
    // Buscar coincidencias con triggers
    for (const responseConfig of this.config.responses) {
      for (const trigger of responseConfig.triggers) {
        if (messageText.includes(trigger.toLowerCase())) {
          this.isProcessing = true;
          
          // Simular procesamiento con delay
          setTimeout(() => {
            this.sendResponse(responseConfig.response);
            this.isProcessing = false;
          }, this.config.responseDelay);
          
          return;
        }
      }
    }

    // Respuesta por defecto si no hay coincidencias
    if (messageText.includes('?')) {
      this.isProcessing = true;
      setTimeout(() => {
        this.sendResponse('Interesante pregunta. Como bot de prueba, puedo ayudarte a verificar la funcionalidad del chat en tiempo real.');
        this.isProcessing = false;
      }, this.config.responseDelay);
    }
  }

  private sendResponse(responseText: string): void {
    if (!this.activeProjectId) return;

    this.chatWsService.sendMessage(this.activeProjectId, responseText);
  }

  updateConfig(newConfig: Partial<LoopTesterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LoopTesterConfig {
    return { ...this.config };
  }

  toggleEnabled(): boolean {
    this.config.enabled = !this.config.enabled;
    
    if (!this.config.enabled) {
      this.disable();
    }
    
    return this.config.enabled;
  }

  sendTestMessage(): void {
    if (!this.activeProjectId) return;
    
    const testMessages = [
      'Este es un mensaje de prueba del Loop Tester.',
      'Verificando funcionalidad de chat en tiempo real...',
      '✅ Chat funcionando correctamente con WebSockets.',
      'Puedes escribir "ayuda" para ver los comandos disponibles.'
    ];
    
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    this.sendResponse(randomMessage);
  }
}