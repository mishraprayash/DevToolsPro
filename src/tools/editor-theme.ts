'use client';

export function defineEditorThemes(monaco: any) {
  if (!monaco.editor._definedThemes) {
    monaco.editor.defineTheme('app-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'd4d4d4' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#aeafad',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
      },
    });
    monaco.editor.defineTheme('app-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '1c1b1e' },
        { token: 'keyword', foreground: '0000ff' },
        { token: 'string', foreground: 'a31515' },
        { token: 'number', foreground: '098658' },
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'type', foreground: '267f99' },
        { token: 'function', foreground: '795e26' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1c1b1e',
        'editor.lineHighlightBackground': '#f0f0f0',
        'editor.selectionBackground': '#add6ff',
        'editorCursor.foreground': '#000000',
        'editorLineNumber.foreground': '#999999',
        'editorLineNumber.activeForeground': '#333333',
        'editorIndentGuide.background': '#d9d9d9',
        'editorIndentGuide.activeBackground': '#bfbfbf',
      },
    });
    monaco.editor._definedThemes = true;
  }
}

export function getMonacoTheme(appTheme: string): string {
  return appTheme === 'dark' ? 'app-dark' : 'app-light';
}
