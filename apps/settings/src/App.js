// src/App.js
import React from 'react';
import { Typography, Form, Input, Switch, Button, Message } from '@arco-design/web-react';

const { Title } = Typography;
const FormItem = Form.Item;

const App = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    Message.success('Settings saved successfully!');
    console.log('Form values:', values);
  };

  return (
    <div>
      <Title heading={3}>System Settings</Title>
      <Form form={form} style={{ maxWidth: 600, marginTop: 24 }} onSubmit={handleSubmit}>
        <FormItem label="Site Title">
          <Input field="siteTitle" placeholder="Enter site title" defaultValue="My Awesome Platform" />
        </FormItem>
        <FormItem label="Enable Dark Mode" field="darkMode" triggerPropName="checked">
          <Switch />
        </FormItem>
        <FormItem label="Enable Notifications" field="notifications" triggerPropName="checked">
          <Switch defaultChecked />
        </FormItem>
        <FormItem wrapperCol={{ offset: 5 }}>
          <Button type="primary" htmlType="submit">Save Settings</Button>
        </FormItem>
      </Form>
    </div>
  );
};

export default App;
