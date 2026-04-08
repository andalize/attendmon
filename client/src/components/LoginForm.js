import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Form, Input, Button, Typography, notification, Card, Row, Col } from 'antd';

const { Title, Text } = Typography;

const baseURL = process.env.REACT_APP_API_BASE;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    const { email, password } = values;
    setLoading(true);
    setError('');

    try {
      const {data} = await api.post('/api/v1/auth/login', { email, password });
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMsg);
      notification.error({
        message: 'Login Error',
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row style={{ height: '100vh' }}>
      {/* Left column — hidden on small screens */}
      <Col
        xs={0}
        md={12}
        style={{
          backgroundColor: '#1677ff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          gap: '16px',
        }}
      >
        <Title level={1} style={{ color: '#fff', margin: 0, letterSpacing: 1 }}>
          AttendMon
        </Title>
        <Title level={3} style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', margin: 0, fontWeight: 400 }}>
          Team attendance monitoring made easy.
        </Title>
      </Col>

      {/* Right column — full width on small screens */}
      <Col
        xs={24}
        md={12}
        style={{
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        <Card
          variant="outlined"
          style={{ borderRadius: 8, padding: 24, boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: 400 }}
        >
          <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
          {error && <Text type="danger">{error}</Text>}

          <Form name="login" initialValues={{ remember: true }} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Please input your email!', type: 'email' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                 iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} />
            </Form.Item>

            {/* <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <a href="#" style={{ color: '#1890ff' }}>Forgot password?</a>
            </Row> */}

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </Form.Item>
          </Form>

          {/* <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text>Don't have an account? <a href="/signup" style={{ color: '#1890ff' }}>Sign up</a></Text>
          </div> */}
        </Card>
      </Col>
    </Row>
  );
}

export default LoginForm;
