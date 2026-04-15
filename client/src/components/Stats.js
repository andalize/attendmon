import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Row, Col, Typography, DatePicker } from 'antd';
import { useIsSmallScreen } from '../utils/SmallScreen';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export const Stats = ({ choirStats, contributionStats, homeContribRange, onContribRangeChange, children }) => {
  const { attendanceStats, allMembers } = choirStats || {};
  const { totalPaid = 0, totalUnpaid = 0 } = contributionStats || {};

  const isSmallScreen = useIsSmallScreen();

  const attendanceOptions = {
    tooltip: { trigger: 'item' },
    color: ['#1BA355', '#B92821'],
    series: [
      {
        name: 'Attendance',
        type: 'pie',
        radius: '60%',
        data: attendanceStats?.length ? attendanceStats : [],
      },
    ],
  };

  const contributionOptions = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} RWF ({d}%)',
    },
    color: ['#1BA355', '#B92821'],
    series: [
      {
        name: 'Contributions',
        type: 'pie',
        radius: '60%',
        data: [
          { value: totalPaid, name: 'Total Paid' },
          { value: totalUnpaid, name: 'Total Unpaid' },
        ],
      },
    ],
  };

  return (
    <>
      <Title level={2} style={{ textAlign: isSmallScreen ? 'center' : 'left' }}>
        Stats
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card title="Total Members" variant="outlined">{allMembers?.totalMembers}</Card></Col>
        <Col xs={24} md={8}><Card title="Active Members" variant="outlined">{allMembers?.activeMembers}</Card></Col>
        <Col xs={24} md={8}><Card title="Inactive Members" variant="outlined">{allMembers?.inactiveMembers}</Card></Col>
      </Row>

      <Card title="Attendance" style={{ marginTop: 24 }}>
        {children}
        <Row justify="center">
          <Col xs={24} md={12}>
            <ReactECharts option={attendanceOptions} />
          </Col>
        </Row>
      </Card>

      <Card
        title="Contributions"
        style={{ marginTop: 24 }}
        extra={
          <RangePicker
            value={homeContribRange}
            format="YYYY-MM-DD"
            onChange={onContribRangeChange}
          />
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Card variant="outlined">
              <Title level={5} style={{ margin: 0, color: '#1BA355' }}>Total Paid</Title>
              <Title level={3} style={{ margin: 0 }}>{totalPaid.toLocaleString()} RWF</Title>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card variant="outlined">
              <Title level={5} style={{ margin: 0, color: '#B92821' }}>Total Unpaid</Title>
              <Title level={3} style={{ margin: 0 }}>{totalUnpaid.toLocaleString()} RWF</Title>
            </Card>
          </Col>
        </Row>
        <Row justify="center">
          <Col xs={24} md={12}>
            <ReactECharts option={contributionOptions} />
          </Col>
        </Row>
      </Card>
    </>
  );
};
