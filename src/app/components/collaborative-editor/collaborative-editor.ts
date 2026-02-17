import { Component, Input, OnInit, OnDestroy, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { EditorWsService } from '../../core/data-access/editor-ws.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { VersionHistoryComponent } from '../version-history/version-history.component';
import { Version } from '../../core/data-access/version.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-collaborative-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, HasRoleDirective, VersionHistoryComponent],
  template: `
    <div class="editor-container">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <div class="status-indicator">
          <div class="status-dot" [class.green]="wsService.isConnected()" [class.red]="!wsService.isConnected()"></div>
          <span class="status-text">{{ wsService.isConnected() ? 'Conectado' : 'Desconectado' }}</span>
          
          <span *ngIf="!canEdit" class="permission-badge read-only">👁️ Solo lectura</span>
          <span *ngIf="canEdit" class="permission-badge can-edit">✏️ Puede editar</span>
        </div>

        <div class="typing-indicator" *ngIf="typingUser()">
          {{ typingUser() }} está escribiendo...
        </div>

        <div class="actions">
          <button
            *appHasRole="'profesor'"
            class="btn btn-icon"
            [class.active]="editor?.isActive('highlight')"
            (click)="toggleHighlight()"
            title="Resaltar corrección (Profesor)">
            🖍️
          </button>
          
          <button
            class="btn btn-icon"
            [class.active]="showHistory"
            (click)="showHistory = !showHistory"
            title="Historial de versiones">
            📂
          </button>
          
          <button class="btn btn-secondary" (click)="close.emit()">Salir</button>
        </div>
      </div>

      <div class="editor-main" [class.with-panel]="showHistory">
        <!-- Editor Area -->
        <div class="editor-content" #editorElement></div>
        
        <!-- Version History Panel -->
        <app-version-history 
          *ngIf="showHistory"
          [evidenceId]="evidenceId"
          (onRestore)="handleRestore($event)">
        </app-version-history>
      </div>
    </div>
  `,
  styles: [`
    .editor-container {
      display: flex;
      flex-direction: column;
      height: 600px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #fff;
    }

    .editor-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #f6f8fa;
      border-bottom: 1px solid #d0d7de;
      border-radius: 6px 6px 0 0;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-dot.green { background: #2da44e; }
    .status-dot.red { background: #cf222e; }

    .permission-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }

    .permission-badge.read-only {
      background: #fef3c7;
      color: #92400e;
    }

    .permission-badge.can-edit {
      background: #dcfce7;
      color: #166534;
    }

    .typing-indicator {
      font-size: 12px;
      color: #57606a;
      font-style: italic;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }

    .editor-content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* TipTap Styles */
    ::ng-deep .ProseMirror {
      outline: none;
      min-height: 100%;
    }

    ::ng-deep .ProseMirror p.is-editor-empty:first-child::before {
      color: #adb5bd;
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }

    /* Highlight style */
    ::ng-deep mark {
      background-color: #ffebe9; /* Red background */
      color: #cf222e;
      padding: 0 2px;
      border-radius: 2px;
    }

    .btn-icon {
      background: none;
      border: 1px solid transparent;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      font-size: 1.2rem;
    }
    .btn-icon:hover { background: #e5e7eb; }
    .btn-icon.active { background: #dbeafe; border-color: #93c5fd; }

    /* Editor Main Layout */
    .editor-main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .editor-main .editor-content {
      flex: 1;
    }

    .editor-main.with-panel .editor-content {
      flex: 1;
    }

    .editor-main.with-panel app-version-history {
      width: 300px;
      flex-shrink: 0;
    }
  `]
})
export class CollaborativeEditorComponent implements OnInit, OnDestroy {
  @Input() evidenceId!: string;
  @Input() initialContent: string = '';
  @Input() userRole: string = 'student'; // 'student' | 'profesor'
  @Input() userName: string = 'Usuario';
  @Input() canEdit: boolean = true; // Control de permisos: true = puede editar, false = solo lectura

  // Output se mantiene como EventEmitter standard por compatibilidad
  @Input() close: any; // Fallback si no se pasa output, debería ser Output()

  @ViewChild('editorElement', { static: true }) editorElement!: ElementRef;

  editor?: Editor;
  typingUser = signal<string | null>(null);
  showHistory = false;

  private contentUpdateSubject = new Subject<string>();
  private typingSubject = new Subject<boolean>();
  private subscriptions: Subscription[] = [];

  constructor(public wsService: EditorWsService) { }

  ngOnInit(): void {
    this.initEditor();
    this.setupWebSockets();
    this.setupTypingDebounce();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.subscriptions.forEach(s => s.unsubscribe());
    // No desconectamos el servicio completo si se usa en otros lados, 
    // pero aquí podríamos emitir 'leave-document' si existiera.
  }

  private initEditor(): void {
    this.editor = new Editor({
      element: this.editorElement.nativeElement,
      extensions: [
        StarterKit,
        Highlight.configure({ multicolor: true }),
      ],
      content: this.initialContent,
      editable: this.canEdit, // Control de permisos
      onUpdate: ({ editor }: { editor: Editor }) => {
        const content = editor.getHTML();
        // Emitir cambios con debounce desde RxJS
        this.contentUpdateSubject.next(content);
        // Emitir typing inmediatamente
        this.typingSubject.next(true);
      },
    });
  }

  private setupWebSockets(): void {
    // Simular token (en app real vendría de AuthService)
    const mockToken = 'jwt-token-placeholder';
    this.wsService.connect(mockToken);
    this.wsService.joinDocument(this.evidenceId);

    // Escuchar contenido externo
    const contentSub = this.wsService.content$.subscribe(content => {
      // Solo actualizar si es diferente para no mover el cursor o causar loops
      if (this.editor && this.editor.getHTML() !== content) {
        // Guardar selección
        const { from, to } = this.editor.state.selection;
        this.editor.commands.setContent(content, {});
        // Intentar restaurar selección (best effort)
        try {
          this.editor.commands.setTextSelection({ from, to });
        } catch (e) { }
      }
    });
    this.subscriptions.push(contentSub);

    // Escuchar typing
    const typingSub = this.wsService.typing$.subscribe(event => {
      if (event.isTyping && event.username !== this.userName) {
        this.typingUser.set(event.username);
        // Limpiar mensaje después de 2s
        setTimeout(() => this.typingUser.set(null), 2000);
      }
    });
    this.subscriptions.push(typingSub);

    // Enviar contenido (Debounce 500ms)
    const sendSub = this.contentUpdateSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(content => {
      this.wsService.sendChanges(this.evidenceId, content);
    });
    this.subscriptions.push(sendSub);
  }

  private setupTypingDebounce(): void {
    // Enviar evento de typing (Throttled)
    const typeSub = this.typingSubject.pipe(
      // En realidad queremos enviar "start" y luego dejar de enviar
      // Simplificamos: enviamos cada vez que escribe con throttle
      debounceTime(1000)
    ).subscribe(() => {
      this.wsService.sendTyping(this.evidenceId, true, this.userName);
    });
    this.subscriptions.push(typeSub);
  }

  toggleHighlight(): void {
    if (this.userRole === 'profesor') {
      this.editor?.chain().focus().toggleHighlight({ color: '#ffebe9' }).run();
    }
  }

  handleRestore(version: Version): void {
    // Al restaurar una versión, actualizar el editor con el nuevo contenido
    if (this.editor && version.content) {
      this.editor.commands.setContent(version.content);
      // Enviar cambios al servidor
      this.wsService.sendChanges(this.evidenceId, version.content);
    }
  }
}
