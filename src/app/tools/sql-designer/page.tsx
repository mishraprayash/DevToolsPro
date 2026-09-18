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
  EdgeChange,
  ConnectionMode,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';
import { TableNode } from './TableNode';
import { 
  initialNodes, 
  initialEdges, 
  generateSql, 
  generatePrisma, 
  generateTypeScript, 
  generateMermaid, 
  autoLayoutNodes,
  parseSqlToNodes, 
  PRESET_TEMPLATES,
  TableNode as AppTableNode, 
  SqlDialect,
  ExportFormat 
} from '@/tools/sql-designer/utils';
import { Plus, Download, Maximize2, Minimize2, Trash2, LayoutGrid, Sparkles } from 'lucide-react';

const nodeTypes = {
  tableNode: TableNode,
};

function FlowDesigner() {
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';

  const [nodes, setNodes] = React.useState<AppTableNode[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const [outputCode, setOutputCode] = React.useState('');
  const [dialect, setDialect] = React.useState<SqlDialect>('postgresql');
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>('sql');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const visualChangePending = React.useRef(true);
  const isTypingRef = React.useRef(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load from local storage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('sql-designer-state');
      if (saved) {
        const { savedNodes, savedEdges, savedDialect, savedFormat } = JSON.parse(saved);
        if (savedNodes && savedNodes.length > 0) setNodes(savedNodes);
        if (savedEdges) setEdges(savedEdges);
        if (savedDialect) setDialect(savedDialect);
        if (savedFormat) setExportFormat(savedFormat);
      }
    } catch (e) {
      console.error('Failed to load SQL designer state', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        'sql-designer-state',
        JSON.stringify({
          savedNodes: nodes,
          savedEdges: edges,
          savedDialect: dialect,
          savedFormat: exportFormat,
        })
      );
    }
  }, [nodes, edges, dialect, exportFormat, isLoaded]);

  const onNodesChange = React.useCallback((changes: NodeChange[]) => {
    if (changes.some((c) => c.type === 'remove')) {
      visualChangePending.current = true;
    }
    setNodes((nds) => applyNodeChanges(changes, nds as unknown as AppTableNode[]) as unknown as AppTableNode[]);
  }, []);

  const onEdgesChange = React.useCallback((changes: EdgeChange[]) => {
    if (changes.some((c) => c.type === 'remove' || c.type === 'add')) {
      visualChangePending.current = true;
    }
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = React.useCallback((params: Connection) => {
    visualChangePending.current = true;
    setEdges((eds) =>
      addEdge(
        {
          ...params,
          animated: true,
          type: 'smoothstep',
          label: 'FK Relation',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
          style: { stroke: '#818cf8', strokeWidth: 2.5 },
        },
        eds
      )
    );
  }, []);

  const onTableNameChange = React.useCallback((nodeId: string, name: string) => {
    visualChangePending.current = true;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, tableName: name } };
        }
        return node;
      })
    );
  }, []);

  const onColumnAdd = React.useCallback((nodeId: string) => {
    visualChangePending.current = true;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const newCol = {
            id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: `col_${node.data.columns.length + 1}`,
            type: 'VARCHAR(255)',
            isPrimary: false,
            isNullable: true,
          };
          return { ...node, data: { ...node.data, columns: [...node.data.columns, newCol] } };
        }
        return node;
      })
    );
  }, []);

  const onColumnChange = React.useCallback(
    (nodeId: string, colId: string, field: string, value: string | boolean) => {
      visualChangePending.current = true;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newCols = node.data.columns.map((col) => {
              if (col.id === colId) {
                return { ...col, [field]: value };
              }
              return col;
            });
            return { ...node, data: { ...node.data, columns: newCols } };
          }
          return node;
        })
      );
    },
    []
  );

  const onColumnDelete = React.useCallback((nodeId: string, colId: string) => {
    visualChangePending.current = true;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, columns: node.data.columns.filter((c) => c.id !== colId) } };
        }
        return node;
      })
    );
    setEdges((eds) => eds.filter((e) => e.sourceHandle !== colId && e.targetHandle !== colId));
  }, []);

  const onDeleteNode = React.useCallback((nodeId: string) => {
    visualChangePending.current = true;
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const onDuplicateNode = React.useCallback(
    (nodeId: string) => {
      visualChangePending.current = true;
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (!targetNode) return;

      const newTableId = `tbl-${Date.now()}`;
      const newTableName = `${targetNode.data.tableName}_copy`;

      const duplicatedColumns = targetNode.data.columns.map((c) => ({
        ...c,
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      }));

      const newNode: AppTableNode = {
        ...targetNode,
        id: newTableId,
        position: {
          x: targetNode.position.x + 80,
          y: targetNode.position.y + 80,
        },
        data: {
          tableName: newTableName,
          columns: duplicatedColumns,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes]
  );

  const handleAddTable = React.useCallback(() => {
    visualChangePending.current = true;
    const newNode: AppTableNode = {
      id: `tbl-${Date.now()}`,
      type: 'tableNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        tableName: 'new_table',
        columns: [
          { id: `c1-${Date.now()}`, name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false },
        ],
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  const handleAutoLayout = React.useCallback(() => {
    visualChangePending.current = true;
    setNodes((nds) => autoLayoutNodes(nds));
  }, []);

  const handleClear = React.useCallback(() => {
    if (confirm('Are you sure you want to clear the entire schema?')) {
      visualChangePending.current = true;
      setNodes([]);
      setEdges([]);
    }
  }, []);

  const handleLoadPreset = React.useCallback((presetKey: string) => {
    if (!presetKey) return;
    const preset = PRESET_TEMPLATES[presetKey];
    if (preset) {
      visualChangePending.current = true;
      setNodes(preset.nodes);
      setEdges(preset.edges);
    }
  }, []);

  const handleDownload = React.useCallback(() => {
    const ext = exportFormat === 'prisma' ? 'prisma' : exportFormat === 'typescript' ? 'ts' : exportFormat === 'mermaid' ? 'mmd' : 'sql';
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [outputCode, exportFormat]);

  // Regenerate Code based on current Export Format
  React.useEffect(() => {
    if (visualChangePending.current) {
      visualChangePending.current = false;

      let code = '';
      if (exportFormat === 'sql') {
        const res = generateSql(nodes, edges, dialect);
        if (res.success) code = res.data;
      } else if (exportFormat === 'prisma') {
        code = generatePrisma(nodes, edges);
      } else if (exportFormat === 'typescript') {
        code = generateTypeScript(nodes);
      } else if (exportFormat === 'mermaid') {
        code = generateMermaid(nodes, edges);
      }

      if (code !== outputCode) {
        setOutputCode(code);
      }
    }
  }, [nodes, edges, dialect, exportFormat, outputCode]);

  // Handle typing in editor
  const handleEditorChange = React.useCallback(
    (value: string | undefined) => {
      const val = value || '';
      setOutputCode(val);

      if (exportFormat !== 'sql') return;

      isTypingRef.current = true;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
      }, 1000);

      try {
        if (val.trim() === '') {
          setNodes([]);
          setEdges([]);
          return;
        }
        const { nodes: newNodes, edges: newEdges } = parseSqlToNodes(val, nodes);
        if (newNodes.length > 0) {
          setNodes(newNodes);
          setEdges(newEdges);
        }
      } catch (e) {
        // Ignore syntax parsing errors while typing
      }
    },
    [exportFormat, nodes]
  );

  const nodesWithHandlers = React.useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        dialect,
        onTableNameChange,
        onColumnAdd,
        onColumnChange,
        onColumnDelete,
        onDeleteNode,
        onDuplicateNode,
      },
    }));
  }, [nodes, dialect, onTableNameChange, onColumnAdd, onColumnChange, onColumnDelete, onDeleteNode, onDuplicateNode]);

  if (!isLoaded) return null;

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-bg-primary p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-screen overflow-hidden'
          : 'grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]'
      }
    >
      {/* Canvas */}
      <div className="lg:col-span-8 flex flex-col h-full rounded-xl border border-border bg-bg-secondary overflow-hidden relative shadow-inner">
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
          <Button size="sm" onClick={handleAddTable} icon={<Plus className="w-4 h-4" />} className="shadow-lg">
            Add Table
          </Button>
          <Button variant="secondary" size="sm" onClick={handleAutoLayout} icon={<LayoutGrid className="w-4 h-4" />} className="shadow-lg bg-bg-elevated border border-border">
            Auto Layout
          </Button>
          <Button variant="danger" size="sm" onClick={handleClear} icon={<Trash2 className="w-4 h-4" />} className="shadow-lg">
            Clear
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="shadow-lg bg-bg-elevated border border-border"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 mr-1" /> : <Maximize2 className="w-4 h-4 mr-1" />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        </div>

        {/* Preset Selector */}
        <div className="absolute top-4 right-4 z-10 w-48">
          <select
            onChange={(e) => handleLoadPreset(e.target.value)}
            defaultValue=""
            className="w-full h-9 px-3 rounded-lg bg-bg-elevated/90 border border-border text-xs font-semibold text-text-primary focus:outline-none focus:border-accent cursor-pointer shadow-lg backdrop-blur"
          >
            <option value="" disabled>✨ Load Schema Preset...</option>
            <option value="saasAuth">SaaS Auth & Users</option>
            <option value="ecommerce">E-Commerce Store</option>
          </select>
        </div>

        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
            style: { stroke: '#818cf8', strokeWidth: 2.5 },
          }}
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

      {/* Code Editor Side */}
      <div className="lg:col-span-4 flex flex-col h-full space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> Export Code
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-1" /> Export
              </Button>
              <CopyButton value={outputCode} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Format"
              options={[
                { label: 'SQL DDL Script', value: 'sql' },
                { label: 'Prisma Schema', value: 'prisma' },
                { label: 'TypeScript Types', value: 'typescript' },
                { label: 'Mermaid ER Diagram', value: 'mermaid' },
              ]}
              value={exportFormat}
              onChange={(e) => {
                visualChangePending.current = true;
                setExportFormat(e.target.value as ExportFormat);
              }}
            />

            {exportFormat === 'sql' && (
              <Select
                label="SQL Dialect"
                options={[
                  { label: 'PostgreSQL', value: 'postgresql' },
                  { label: 'MySQL', value: 'mysql' },
                  { label: 'SQLite', value: 'sqlite' },
                ]}
                value={dialect}
                onChange={(e) => {
                  visualChangePending.current = true;
                  setDialect(e.target.value as SqlDialect);
                }}
              />
            )}
          </div>
        </div>

        <div className={`flex-1 rounded-xl border border-border ${editorBg} overflow-hidden shadow-inner`}>
          <Editor
            height="100%"
            defaultLanguage={exportFormat === 'typescript' ? 'typescript' : 'sql'}
            theme={monacoTheme}
            beforeMount={defineEditorThemes}
            value={outputCode}
            onChange={handleEditorChange}
            options={{
              readOnly: exportFormat !== 'sql',
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
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
      description="Visually design database schemas, draw relationships, auto-layout tables, and export SQL, Prisma, or TypeScript models."
      category="Formatting"
    >
      <ReactFlowProvider>
        <FlowDesigner />
      </ReactFlowProvider>
    </ToolLayout>
  );
}
