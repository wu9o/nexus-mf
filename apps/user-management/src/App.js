// src/App.js
import React from 'react';
import { Typography, Table, Button, Space } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';

const { Title } = Typography;

const columns = [
  { title: 'ID', dataIndex: 'id' },
  { title: 'Name', dataIndex: 'name' },
  { title: 'Email', dataIndex: 'email' },
  { title: 'Role', dataIndex: 'role' },
  {
    title: 'Action',
    render: () => (
      <Space>
        <Button type="primary" size="small">Edit</Button>
        <Button type="primary" status="danger" size="small">Delete</Button>
      </Space>
    ),
  },
];

const data = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Editor' },
  { id: '3', name: 'Peter Jones', email: 'peter.jones@example.com', role: 'Viewer' },
  { id: '4', name: 'Mary Williams', email: 'mary.w@example.com', role: 'Editor' },
];

const App = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title heading={3}>User Management</Title>
        <Button type="primary" icon={<IconPlus />}>Add User</Button>
      </div>
      <Table columns={columns} data={data} style={{ marginTop: 24 }} />
    </div>
  );
};

export default App;
