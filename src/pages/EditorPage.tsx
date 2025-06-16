import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { 
  Code2, 
  Users, 
  Copy, 
  Check, 
  Settings, 
  LogOut, 
  Palette,
  Globe,
  Zap
} from 'lucide-react';

interface User {
  username: string;
  color: string;
  cursor_line?: number;
  cursor_column?: number;
}

interface CursorPosition {
  username: string;
  line: number;
  column: number;
  color: string;
}

const SOCKET_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:3001';

const EditorPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [users, setUsers] = useState<User[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const username = localStorage.getItem('username') || 'Anonymous';

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' }
  ];

  useEffect(() => {
    if (!roomId) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-room', { roomId, username });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('sync-code', (data) => {
      setCode(data.code);
      setLanguage(data.language);
    });

    newSocket.on('code-update', (data) => {
      setCode(data.code);
      setLanguage(data.language);
    });

    newSocket.on('users-list', (data) => {
      setUsers(data.users);
    });

    newSocket.on('user-joined', (data) => {
      setUsers(data.users);
    });

    newSocket.on('user-left', (data) => {
      setUsers(prev => prev.filter(user => user.username !== data.username));
      setCursors(prev => prev.filter(cursor => cursor.username !== data.username));
    });

    newSocket.on('cursor-update', (data) => {
      setCursors(prev => {
        const filtered = prev.filter(cursor => cursor.username !== data.username);
        return [...filtered, data];
      });
    });

    newSocket.on('language-update', (data) => {
      setLanguage(data.language);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, username]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && socket) {
      setCode(value);
      socket.emit('code-change', { code: value, language });
    }
  };

  const handleCursorChange = (position: any) => {
    if (socket && position) {
      socket.emit('cursor-move', {
        line: position.lineNumber,
        column: position.column
      });
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (socket) {
      socket.emit('language-change', { language: newLanguage });
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      handleCursorChange(e.position);
    });

    // Add cursor decorations for other users
    editor.onDidChangeModelContent(() => {
      const decorations = cursors.map(cursor => ({
        range: new monaco.Range(cursor.line, cursor.column, cursor.line, cursor.column + 1),
        options: {
          className: 'cursor-decoration',
          glyphMarginClassName: 'cursor-glyph',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          minimap: {
            color: cursor.color,
            position: monaco.editor.MinimapPosition.Inline
          },
          overviewRuler: {
            color: cursor.color,
            position: monaco.editor.OverviewRulerLane.Full
          }
        }
      }));

      editor.deltaDecorations([], decorations);
    });
  };

  const exitRoom = () => {
    if (socket) {
      socket.disconnect();
    }
    navigate('/');
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code2 className="w-6 h-6 text-emerald-500" />
            <span className="text-lg font-semibold text-white">CodeTogether</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-slate-700 rounded-lg">
            <span className="text-sm text-slate-300">Room:</span>
            <span className="text-sm font-mono text-white">{roomId?.slice(0, 8)}...</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-700 text-white px-3 py-1 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            title="Toggle Theme"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Copy Room Link */}
          <button
            onClick={copyRoomLink}
            className="flex items-center space-x-2 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="hidden md:inline">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>

          {/* Exit Room */}
          <button
            onClick={exitRoom}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Exit Room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4">
          {/* Connection Status */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Users List */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Active Users ({users.length})
            </h3>
            <div className="space-y-2">
              {users.map((user, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-slate-700 rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span className="text-sm text-white truncate">
                    {user.username}
                    {user.username === username && ' (You)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Info */}
          <div className="space-y-3">
            <div className="p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-2 text-slate-300 mb-1">
                <Globe className="w-4 h-4" />
                <span className="text-xs">Room ID</span>
              </div>
              <span className="text-xs font-mono text-white break-all">{roomId}</span>
            </div>
            
            <div className="p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-2 text-slate-300 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs">Auto-save</span>
              </div>
              <span className="text-xs text-emerald-400">Enabled</span>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={theme}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              fontFamily: 'Fira Code, Consolas, Monaco, monospace',
              minimap: { enabled: true },
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
              insertSpaces: true,
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              }
            }}
          />

          {/* Cursor Indicators */}
          {cursors.map((cursor, index) => (
            <div
              key={`${cursor.username}-${index}`}
              className="absolute pointer-events-none z-10"
              style={{
                top: `${cursor.line * 18}px`, // Approximate line height
                left: `${cursor.column * 7}px`, // Approximate character width
              }}
            >
              <div
                className="w-0.5 h-5 animate-pulse"
                style={{ backgroundColor: cursor.color }}
              ></div>
              <div
                className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.username}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;