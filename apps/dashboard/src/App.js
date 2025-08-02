// src/App.js
import React from 'react';
import { Typography, Grid, Card, Statistic } from '@arco-design/web-react';
import { IconArrowRise, IconArrowFall } from '@arco-design/web-react/icon';

const { Title } = Typography;
const { Row, Col } = Grid;

const App = () => {
  return (
    <div>
      <Title heading={3}>Dashboard</Title>
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title='Online Users' value={1879} precision={0} prefix={<IconArrowRise style={{ color: '#00b42a' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title='New Sign-ups' value={342} precision={0} prefix={<IconArrowRise style={{ color: '#00b42a' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title='Error Rate' value={2.5} suffix="%" precision={1} prefix={<IconArrowFall style={{ color: '#f53f3f' }} />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default App;
