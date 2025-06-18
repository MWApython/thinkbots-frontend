import React, { useState, useCallback, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert, Popover, Avatar } from '@mui/material';
import ReactFlow, { Background, Controls, Node, NodeProps, Edge, MarkerType, Handle, Position, NodeChange, applyNodeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SecurityIcon from '@mui/icons-material/Security';
import dagre from 'dagre';
import { useLanguage } from '../contexts/LanguageContext';
import { apiPost } from '../utils/api';

const initialNodes = [
  { id: '1', type: 'custom', data: { label: 'NIST CSF 2.0 Requirement', type: 'requirement', description: 'A sample requirement.' }, position: { x: 250, y: 5 } },
  { id: '2', type: 'custom', data: { label: 'Compliance Department', type: 'department', description: 'Handles compliance.' }, position: { x: 100, y: 100 } },
  { id: '3', type: 'custom', data: { label: 'IT Department', type: 'department', description: 'Handles IT.' }, position: { x: 400, y: 100 } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, label: 'Requires' },
  { id: 'e1-3', source: '1', target: '3', animated: true, label: 'Requires' },
];

const iconForType = (type: string) => {
  switch (type) {
    case 'department': return <GroupIcon color="primary" />;
    case 'requirement': return <DescriptionIcon color="secondary" />;
    case 'process': return <AssignmentIcon color="secondary" />;
    case 'control': return <CheckCircleIcon color="success" />;
    case 'action': return <CheckCircleIcon color="success" />;
    case 'nist_csf': return <SecurityIcon color="warning" />;
    default: return <HelpOutlineIcon color="disabled" />;
  }
};

const CustomNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'white', borderRadius: 2, boxShadow: 2, minWidth: 120, cursor: 'pointer', position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#1976d2' }} />
      <Avatar sx={{ bgcolor: 'transparent', width: 32, height: 32 }}>
        {iconForType(data.type)}
      </Avatar>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, color: '#333' }}>
        {data.label}
      </Typography>
      <Handle type="source" position={Position.Bottom} style={{ background: '#1976d2' }} />
    </Box>
  );
};

const nodeTypes = { custom: CustomNode };

const transformNodesForReactFlow = (nodes: any[]) => {
  return nodes.map((node, i) => ({
    id: node.id,
    type: 'custom',
    data: {
      label: node.label || (node.data && node.data.label) || ' ',
      type: node.type || (node.data && node.data.type) || 'unknown',
      description: node.description || (node.data && node.data.description) || '',
    },
    position: node.position || { x: 100 + (i * 120), y: 100 + (i * 60) }
  }));
};

const transformEdgesForReactFlow = (edges: any[], nodeIds: string[], nodes: any[]): Edge[] => {
  if (!edges || !Array.isArray(edges)) return [];
  // Helper to get node type by id
  const getNodeType = (id: string) => {
    const node = nodes.find((n: any) => n.id === id);
    return node?.data?.type || node?.type || '';
  };
  return edges
    .filter(edge => edge.source && edge.target && nodeIds.includes(edge.source) && nodeIds.includes(edge.target))
    .map((edge, i) => {
      const sourceType = getNodeType(edge.source);
      const targetType = getNodeType(edge.target);
      return {
        ...edge,
        id: edge.id || `e${edge.source}-${edge.target}-${i}`,
        type: 'step', // Route lines around cards
        animated: sourceType === 'department' || targetType === 'department',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#1976d2',
          width: 24,
          height: 24,
        },
        style: { stroke: '#1976d2', strokeWidth: 2 },
        labelStyle: { fill: '#1976d2', fontWeight: 600, fontSize: 14, background: 'white', padding: 2 },
        labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
      };
    });
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 60;

function getLayoutedElements(nodes: any[], edges: any[]) {
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 120 }); // More space between nodes

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      draggable: true,
    };
  });
}

const RequirementMapPage: React.FC = () => {
  const { language } = useLanguage();
  const [requirement, setRequirement] = useState('');
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [popover, setPopover] = useState<{ anchor: HTMLElement | null, node: any } | null>(null);
  const hasLayout = useRef(false);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setPopover({ anchor: event.currentTarget as HTMLElement, node });
  }, []);

  const handlePopoverClose = () => setPopover(null);

  // Handle node drag/move
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setGraphData((gd) => gd ? { ...gd, nodes: applyNodeChanges(changes, gd.nodes) } : gd);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost('/api/requirement-map', { requirement });
      const nodes = transformNodesForReactFlow(data.nodes).map(n => ({ ...n, draggable: true }));
      const nodeIds = nodes.map(n => n.id);
      const edges = transformEdgesForReactFlow(data.edges, nodeIds, nodes);
      const layoutedNodes = getLayoutedElements(nodes, edges);
      setGraphData({ nodes: layoutedNodes, edges });
      hasLayout.current = true;
    } catch (err: any) {
      setError(err.message || 'Error generating map');
    } finally {
      setLoading(false);
    }
  };

  // Initial layout for initialNodes only once
  const [initialLayouted, setInitialLayouted] = useState(() => getLayoutedElements(initialNodes, transformEdgesForReactFlow(initialEdges, initialNodes.map(n => n.id), initialNodes)));

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        {language === 'ar' ? 'خريطة المتطلبات' : 'Requirement Map'}
      </Typography>
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          '& .MuiAlert-message': {
            fontSize: '0.9rem',
            lineHeight: 1.5
          }
        }}
      >
        <Typography variant="body2" component="div">
          <strong>{language === 'ar' ? 'تنويه خريطة تدفق العمليات المُنشأة بواسطة الذكاء الاصطناعي:' : 'AI-Generated Process Flow Map Disclaimer:'}</strong> {language === 'ar' ? 'تم إنشاء خريطة تدفق العمليات هذه باستخدام الذكاء الاصطناعي. على الرغم من سعينا للدقة، قد تنتج أنظمة الذكاء الاصطناعي أحياناً أخطاء أو معلومات غير مكتملة. نوصي بـ:' : 'This process flow map has been generated using artificial intelligence. While we strive for accuracy, AI systems may occasionally produce errors or incomplete information. We recommend:'}
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>{language === 'ar' ? 'التحقق من جميع العمليات والعلاقات المعينة' : 'Verifying all mapped processes and relationships'}</li>
            <li>{language === 'ar' ? 'التحقق من صحة تعيينات ضوابط NIST CSF 2.0' : 'Validating NIST CSF 2.0 control mappings'}</li>
            <li>{language === 'ar' ? 'تأكيد المسؤوليات الإدارية' : 'Confirming departmental responsibilities'}</li>
            <li>{language === 'ar' ? 'مراجعة التدفق الكامل للدقة' : 'Reviewing the complete flow for accuracy'}</li>
          </ul>
          {language === 'ar' ? 'يجب استخدام هذه الخريطة كنقطة بداية لتحليلك وليس كمصدر نهائي وموثوق.' : 'This map should be used as a starting point for your analysis and not as a final, authoritative source.'}
        </Typography>
      </Alert>
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={language === 'ar' ? 'أدخل المتطلب' : 'Enter requirement'}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            sx={{ 
              mb: 2,
              '& .MuiInputBase-input': {
                textAlign: language === 'ar' ? 'right' : 'left',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              },
              '& .MuiInputLabel-root': {
                textAlign: language === 'ar' ? 'right' : 'left',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              },
              '& .MuiInputLabel-shrink': {
                textAlign: language === 'ar' ? 'right' : 'left',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              },
              '& .MuiInputBase-input::placeholder': {
                textAlign: language === 'ar' ? 'right' : 'left',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
              },
            }}
          >
            {loading ? 'Generating...' : language === 'ar' ? 'إنشاء الخريطة' : 'Generate Map'}
          </Button>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Paper sx={{ 
        p: 3, 
        minHeight: 400, 
        height: 800,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#283593',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#1a237e',
        },
      }}>
        {graphData && graphData.edges.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>No connections/edges found. The map may not show flow arrows.</Alert>
        )}
        <ReactFlow
          nodes={graphData ? graphData.nodes : initialLayouted}
          edges={graphData ? graphData.edges : transformEdgesForReactFlow(initialEdges, initialNodes.map(n => n.id), initialNodes)}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onNodesChange={onNodesChange}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background />
          <Controls />
        </ReactFlow>
        <Popover
          open={!!popover}
          anchorEl={popover?.anchor}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {popover?.node && (
            <Box sx={{ p: 2, minWidth: 250 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'transparent', width: 32, height: 32 }}>
                  {iconForType(popover.node.data.type)}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{popover.node.data.label}</Typography>
              </Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Type: {popover.node.data.type.charAt(0).toUpperCase() + popover.node.data.type.slice(1)}
              </Typography>
              {popover.node.data.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>{popover.node.data.description}</Typography>
              )}
            </Box>
          )}
        </Popover>
      </Paper>
    </Box>
  );
};

export default RequirementMapPage; 