import type { Edge } from '@xyflow/react';
import type { TableNode, PresetTemplate } from '../types/schema.types';

export const initialNodes: TableNode[] = [
  {
    id: 'tbl-users',
    type: 'tableNode',
    position: { x: 60, y: 60 },
    data: {
      tableName: 'users',
      columns: [
        { id: 'u1', name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false },
        { id: 'u2', name: 'email', type: 'VARCHAR(255)', isPrimary: false, isNullable: false, isUnique: true },
        { id: 'u3', name: 'full_name', type: 'VARCHAR(100)', isPrimary: false, isNullable: true },
        { id: 'u4', name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      ],
    },
  },
  {
    id: 'tbl-posts',
    type: 'tableNode',
    position: { x: 760, y: 60 },
    data: {
      tableName: 'posts',
      columns: [
        { id: 'p1', name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false },
        { id: 'p2', name: 'user_id', type: 'INT', isPrimary: false, isNullable: false },
        { id: 'p3', name: 'title', type: 'VARCHAR(255)', isPrimary: false, isNullable: false },
        { id: 'p4', name: 'content', type: 'TEXT', isPrimary: false, isNullable: true },
        { id: 'p5', name: 'published', type: 'BOOLEAN', isPrimary: false, isNullable: false, defaultValue: 'false' },
      ],
    },
  },
];

export const initialEdges: Edge[] = [
  {
    id: 'e-users-posts',
    source: 'tbl-users',
    sourceHandle: 'u1',
    target: 'tbl-posts',
    targetHandle: 'p2',
    animated: true,
    type: 'smoothstep',
    label: 'FK: user_id ➔ id',
    style: { stroke: '#818cf8', strokeWidth: 2.5 },
  },
];

export const PRESET_TEMPLATES: Record<string, PresetTemplate> = {
  saasAuth: {
    nodes: [
      {
        id: 'tbl-users',
        type: 'tableNode',
        position: { x: 60, y: 60 },
        data: {
          tableName: 'users',
          columns: [
            { id: 'u1', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { id: 'u2', name: 'email', type: 'VARCHAR(255)', isPrimary: false, isNullable: false, isUnique: true },
            { id: 'u3', name: 'password_hash', type: 'VARCHAR(255)', isPrimary: false, isNullable: false },
            { id: 'u4', name: 'role', type: 'VARCHAR(50)', isPrimary: false, isNullable: false, defaultValue: "'USER'" },
            { id: 'u5', name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
          ],
        },
      },
      {
        id: 'tbl-sessions',
        type: 'tableNode',
        position: { x: 760, y: 60 },
        data: {
          tableName: 'sessions',
          columns: [
            { id: 's1', name: 'id', type: 'UUID', isPrimary: true, isNullable: false },
            { id: 's2', name: 'user_id', type: 'UUID', isPrimary: false, isNullable: false },
            { id: 's3', name: 'token', type: 'VARCHAR(255)', isPrimary: false, isNullable: false, isUnique: true },
            { id: 's4', name: 'expires_at', type: 'TIMESTAMP', isPrimary: false, isNullable: false },
          ],
        },
      },
    ],
    edges: [
      {
        id: 'e-user-session',
        source: 'tbl-users',
        sourceHandle: 'u1',
        target: 'tbl-sessions',
        targetHandle: 's2',
        animated: true,
        type: 'smoothstep',
        label: 'FK: user_id ➔ id',
        style: { stroke: '#818cf8', strokeWidth: 2.5 },
      },
    ],
  },
  ecommerce: {
    nodes: [
      {
        id: 'tbl-customers',
        type: 'tableNode',
        position: { x: 60, y: 60 },
        data: {
          tableName: 'customers',
          columns: [
            { id: 'c1', name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false },
            { id: 'c2', name: 'email', type: 'VARCHAR(255)', isPrimary: false, isNullable: false, isUnique: true },
            { id: 'c3', name: 'phone', type: 'VARCHAR(50)', isPrimary: false, isNullable: true },
          ],
        },
      },
      {
        id: 'tbl-orders',
        type: 'tableNode',
        position: { x: 760, y: 60 },
        data: {
          tableName: 'orders',
          columns: [
            { id: 'o1', name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false },
            { id: 'o2', name: 'customer_id', type: 'INT', isPrimary: false, isNullable: false },
            { id: 'o3', name: 'total_amount', type: 'DECIMAL(10,2)', isPrimary: false, isNullable: false },
            { id: 'o4', name: 'status', type: 'VARCHAR(50)', isPrimary: false, isNullable: false, defaultValue: "'PENDING'" },
          ],
        },
      },
      {
        id: 'tbl-products',
        type: 'tableNode',
        position: { x: 760, y: 480 },
        data: {
          tableName: 'products',
          columns: [
            { id: 'pr1', name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false },
            { id: 'pr2', name: 'sku', type: 'VARCHAR(100)', isPrimary: false, isNullable: false, isUnique: true },
            { id: 'pr3', name: 'price', type: 'DECIMAL(10,2)', isPrimary: false, isNullable: false },
            { id: 'pr4', name: 'stock_quantity', type: 'INT', isPrimary: false, isNullable: false, defaultValue: '0' },
          ],
        },
      },
    ],
    edges: [
      {
        id: 'e-customer-orders',
        source: 'tbl-customers',
        sourceHandle: 'c1',
        target: 'tbl-orders',
        targetHandle: 'o2',
        animated: true,
        type: 'smoothstep',
        label: 'FK: customer_id ➔ id',
        style: { stroke: '#818cf8', strokeWidth: 2.5 },
      },
    ],
  },
};
