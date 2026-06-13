'use client';

import * as React from 'react';
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Background, 
  Controls, 
  MiniMap,
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Connection,
  Edge,
  NodeChange,
  EdgeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Editor from '@monaco-editor/react';

import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';
import { TableNode } from './TableNode';
import { initialNodes, initialEdges, generateSql, parseSqlToNodes, TableNode as AppTableNode, SqlDialect } from '@/tools/sql-designer/utils';
import { Plus, Download, Maximize2, Minimize2, Trash2 } from 'lucide-react';

const nodeTypes = {
  tableNode: TableNode,
};

function FlowDesigner() {
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';

  const [nodes, setNodes] = React.useState<AppTableNode[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const [sqlOutput, setSqlOutput] = React.useState('');
  const [dialect, setDialect] = React.useState<SqlDialect>('postgresql');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // We only want to generate SQL if the change originated from the VISUAL canvas.
  // If the change originated from the EDITOR, we do not want to overwrite the editor text.
  const visualChangePending = React.useRef(true); // true initially to generate first SQL
  
  // Track if user is actively typing in the editor
  const isTypingRef = React.useRef(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load from local storage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('sql-designer-state');
      if (saved) {
        const { savedNodes, savedEdges, savedDialect } = JSON.parse(saved);
        if (savedNodes && savedNodes.length > 0) setNodes(savedNodes);
        if (savedEdges) setEdges(savedEdges);
        if (savedDialect) setDialect(savedDialect);
      }
    } catch (e) {
      console.error('Failed to load SQL designer state', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('sql-designer-state', JSON.stringify({
        savedNodes: nodes,
        savedEdges: edges,
        savedDialect: dialect
      }));
    }
  }, [nodes, edges, dialect, isLoaded]);

  const onNodesChange = React.useCallback((changes: NodeChange[]) => {
    // Only flag as visual change if it's a deletion, otherwise it's just drag/select/dimensions
    if (changes.some(c => c.type === 'remove')) {
      visualChangePending.current = true;
    }
    setNodes((nds) => applyNodeChanges(changes, nds as any) as unknown as AppTableNode[]);
  }, []);

  const onEdgesChange = React.useCallback((changes: EdgeChange[]) => {
    if (changes.some(c => c.type === 'remove' || c.type === 'add')) {
      visualChangePending.current = true;
    }
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = React.useCallback((params: Connection) => {
    visualChangePending.current = true;
    setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep', style: { stroke: '#818cf8', strokeWidth: 2 } }, eds));
  }, []);

  const onTableNameChange = React.useCallback((nodeId: string, name: string) => {
    visualChangePending.current = true;
    setNodes((nds) => nds.map(node => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, tableName: name } };
      }
      return node;
    }));
  }, []);

  const onColumnAdd = React.useCallback((nodeId: string) => {
    visualChangePending.current = true;
    setNodes((nds) => nds.map(node => {
      if (node.id === nodeId) {
        const newCol = {
          id: `col-${Date.now()}`,
          name: `col_${node.data.columns.length + 1}`,
          type: 'VARCHAR(255)',
          isPrimary: false,
          isNullable: true
        };
        return { ...node, data: { ...node.data, columns: [...node.data.columns, newCol] } };
      }
      return node;
    }));
  }, []);

  const onColumnChange = React.useCallback((nodeId: string, colId: string, field: string, value: any) => {
    visualChangePending.current = true;
    setNodes((nds) => nds.map(node => {
      if (node.id === nodeId) {
        const newCols = node.data.columns.map(col => {
          if (col.id === colId) {
            return { ...col, [field]: value };
          }
          return col;
        });
        return { ...node, data: { ...node.data, columns: newCols } };
      }
      return node;
    }));
  }, []);

  const onColumnDelete = React.useCallback((nodeId: string, colId: string) => {
    visualChangePending.current = true;
    setNodes((nds) => nds.map(node => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, columns: node.data.columns.filter(c => c.id !== colId) } };
      }
      return node;
    }));
    setEdges(eds => eds.filter(e => e.sourceHandle !== colId && e.targetHandle !== colId));
  }, []);

  const onDeleteNode = React.useCallback((nodeId: string) => {
    visualChangePending.current = true;
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const handleAddTable = React.useCallback(() => {
    visualChangePending.current = true;
    const newNode: AppTableNode = {
      id: `tbl-${Date.now()}`,
      type: 'tableNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        tableName: 'new_table',
        columns: [
          { id: `c1-${Date.now()}`, name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false }
        ]
      }
    };
    setNodes(nds => [...nds, newNode]);
  }, []);

  const handleClear = React.useCallback(() => {
    if (confirm('Are you sure you want to clear the entire schema?')) {
      visualChangePending.current = true;
      setNodes([]);
      setEdges([]);
    }
  }, []);

  const handleDownload = React.useCallback(() => {
    const blob = new Blob([sqlOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${dialect}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sqlOutput, dialect]);

  // Sync Visual -> Code (only if the change originated visually)
  React.useEffect(() => {
    if (visualChangePending.current) {
      visualChangePending.current = false;
      const res = generateSql(nodes, edges, dialect);
      if (res.success && res.data !== sqlOutput) {
        setSqlOutput(res.data);
      }
    }
  }, [nodes, edges, dialect, sqlOutput]);

  // Handle typing in editor
  const handleEditorChange = React.useCallback((value: string | undefined) => {
    const val = value || '';
    setSqlOutput(val);
    
    // Set typing flag so we don't accidentally overwrite while they pause
    isTypingRef.current = true;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 1000);

    // Try parsing silently
    try {
      if (val.trim() === '') {
        setNodes([]);
        setEdges([]);
        return;
      }
      const { nodes: newNodes, edges: newEdges } = parseSqlToNodes(val, nodes);
      // We only update if we successfully parsed at least one table, 
      // or if they explicitly cleared the editor (handled above).
      // This prevents the canvas from vanishing while they are midway typing an invalid statement.
      if (newNodes.length > 0) {
        setNodes(newNodes);
        setEdges(newEdges);
      }
    } catch (e) {
      // Ignore intermediate parsing errors while typing
    }
  }, [nodes]);

  const nodesWithHandlers = React.useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onTableNameChange,
        onColumnAdd,
        onColumnChange,
        onColumnDelete,
        onDeleteNode
      }
    }));
  }, [nodes, onTableNameChange, onColumnAdd, onColumnChange, onColumnDelete, onDeleteNode]);

  // Trigger dialect change regeneration
  const handleDialectChange = (newDialect: SqlDialect) => {
    visualChangePending.current = true;
    setDialect(newDialect);
  };

  if (!isLoaded) return null;

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-bg-primary p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-screen overflow-hidden' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]'}>
      {/* Canvas */}
      <div className="lg:col-span-8 flex flex-col h-full rounded-xl border border-border bg-bg-secondary overflow-hidden relative shadow-inner">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button size="sm" onClick={handleAddTable} className="shadow-lg">
            <Plus className="w-4 h-4 mr-1" /> Add Table
          </Button>
          <Button variant="danger" size="sm" onClick={handleClear} className="shadow-lg">
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="shadow-lg bg-bg-elevated border border-border">
            {isFullscreen ? <Minimize2 className="w-4 h-4 mr-1" /> : <Maximize2 className="w-4 h-4 mr-1" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ type: 'smoothstep', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 } }}
          fitView
          minZoom={0.1}
          maxZoom={4}
          colorMode={theme === 'dark' ? 'dark' : 'light'}
        >
          <Background gap={16} size={1} />
          <Controls className="!bg-bg-elevated !border-border !fill-text-primary" />
          <MiniMap 
            nodeColor={theme === 'dark' ? '#1a1a24' : '#ffffff'} 
            maskColor={theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}
            className="!bg-bg-secondary !border-border !border !rounded-lg overflow-hidden" 
          />
        </ReactFlow>
      </div>

      {/* Code Editor */}
      <div className="lg:col-span-4 flex flex-col h-full space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">
              Generated SQL
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8">
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
              <CopyButton value={sqlOutput} />
            </div>
          </div>
          
          <div className="w-full">
            <Select
              options={[
                { label: 'PostgreSQL', value: 'postgresql' },
                { label: 'MySQL', value: 'mysql' },
                { label: 'SQLite', value: 'sqlite' },
              ]}
              value={dialect}
              onChange={(e) => handleDialectChange(e.target.value as SqlDialect)}
            />
          </div>
        </div>
        
        <div className={`flex-1 rounded-xl border border-border ${editorBg} overflow-hidden shadow-inner`}>
          <Editor
            height="100%"
            defaultLanguage="sql"
            theme={monacoTheme}
            beforeMount={defineEditorThemes}
            value={sqlOutput}
            onChange={handleEditorChange}
            options={{ 
              readOnly: false, 
              minimap: { enabled: false }, 
              fontSize: 13, 
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ToolLayout
      name="SQL Schema Designer"
      description="Visually design database schemas, draw foreign key relationships, and generate SQL DDL scripts."
      category="Formatting"
    >
      <ReactFlowProvider>
        <FlowDesigner />
      </ReactFlowProvider>
    </ToolLayout>
  );
}
