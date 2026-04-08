
import React, { useState, useEffect } from 'react';
import {
    Layout,
    Menu,
    Typography,
    Table,
    Button,
    Input,
    Modal,
    DatePicker,
    Checkbox,
    Select,
    Row,
    Col,
    Space,
    Form,
    message
 } from 'antd';

import {useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  LogoutOutlined,
  ScheduleOutlined,
  PlusOutlined,
  EditOutlined,
  TeamOutlined,
}from '@ant-design/icons';
import moment from 'moment';

import * as emoji from 'node-emoji'

import axios from 'axios';
import { Stats } from './Stats';
import { useIsSmallScreen } from '../utils/SmallScreen';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const {RangePicker} = DatePicker;

const baseURL = process.env.REACT_APP_API_BASE;
const testPhase = process.env.REACT_APP_TEST_PHASE;

function Dashboard() {
  const [selectedKey, setSelectedKey] = useState('home');
  const [activeMembers, setActiveMembers] = useState([]);
  const [choirSessions, setChoirSessions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);
  const [deleteSelectedMember, setDeleteSelectedMember] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState({});
  const [selectSessionType, setSelectSessionType] = useState('');
  const [editSessionType, setEditSessionType] = useState('');
  const [editMemberId, setEditMemberId] = useState(null);
  const [editMemberAttended, setEditMemberAttended] = useState(null);
  const [editAttendanceModalVisible, setEditAttendanceModalVisible] = useState(false);
  const [editMemberModalVisible, setEditMemberModalVisible] = useState(false);


  
  const [form] = Form.useForm();

  const [isFormValid, setIsFormValid] = useState(false);


  const [memberName, setMemberName] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [editSessionDate, setEditSessionDate] = useState(null);
  const [loading, setLoading] = useState(false)

  const [newMemberModalVisible, setNewMemberModalVisible] = useState(false)


  const [choirStats, setChoirStats] = useState(null)

  const [messageApi, contextHolder] = message.useMessage();

  const [selectedDateRange, setSelectedDateRange] = useState([
    moment().startOf('month'),
    moment().endOf('month')
  ]);

  const [statsSessionType, setStatsSessionType] = useState('rehearsal');

  const [searchText, setSearchText] = useState('');

  const [sessionAttendeeSearchText, setSessionAttendeeSearchText] = useState('');

  const showMsg = (type, content) =>{
    messageApi.open({type,content})
  }

  const navigate = useNavigate();
  const token = localStorage.token;
  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (selectedKey === 'activeMembers') {
      fetchActiveMembers();
    }else if(selectedKey === 'choirSessions'){
      fetchChoirSessions()
    }else if(selectedKey === 'home'){
      getChoirStats();
    }
  }, [selectedKey]);

  useEffect(() => {
    if (isModalVisible) {
      const initialSelection = activeMembers.reduce((acc, member) => {
        acc[member._id] = true;
        return acc;
      }, {});
      setSelectedMembers(initialSelection);
    }
  }, [isModalVisible, activeMembers]);


  const getChoirStats = async () => {
    try {
      const formattedStartDate = selectedDateRange[0].format("YYYY-MM-DD");
      const formattedEndDate = selectedDateRange[1].format("YYYY-MM-DD");

      const queryParams = new URLSearchParams({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        sessionType: statsSessionType
      }).toString();

      const response = await api.get(`/api/v1/stats?${queryParams}`);
      setChoirStats(response.data);
      if(choirStats.attendanceStats.every(itm => itm.value === 0)) {
        showMsg('info', 'No data found for the given criteria' )
      }else {
        showMsg('success', 'Success')
      }
    } catch (error) {
      if (error.response) {
        showMsg('error',error.response.data.message || "Failed to fetch choir stats.");
      }
    }
  };


  const fetchActiveMembers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/members');
      const activeMembersData = response.data.filter(member => {
        return member.active && member.isAdmin === false;
      });
      setActiveMembers(activeMembersData);
    } catch (error) {
      console.error('Error fetching active members:', error);
    }finally{
      setLoading(false)
    }
  };

  const fetchChoirSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/choir-sessions');
      const choirSessionData = response.data;
      setChoirSessions(choirSessionData);
    } catch (error) {
      console.error('Error fetching active members:', error);
    }finally{
      setLoading(false);

    }
  };



  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
  };


  const handleDeleteMember = (record) => {
    setDeleteMemberModalOpen(true);
    setDeleteSelectedMember(record);
  };

  // Function to confirm deletion
  const confirmDeleteMember = async () => {
      if (!deleteSelectedMember) return;

      try {
          await api.delete(`/api/v1/members/${deleteSelectedMember._id}`);
          fetchActiveMembers();
          setDeleteMemberModalOpen(false);
      } catch (error) {
          console.error("Error deleting member:", error);
      }
  };

  // Function to close modal without deleting
  const handleCloseDeleteMemberModal = () => {
      setDeleteMemberModalOpen(false);
  };


  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const handleSessionAttendeeSearch = (value) => {
    setSessionAttendeeSearchText(value.toLowerCase());
  };

  const showModal = async () => {
    await fetchActiveMembers();
    setIsModalVisible(!isModalVisible);
  };

  const handleCancel = () => {
    setIsModalVisible(!isModalVisible);
  };

  const handleSelectedDate = (value) => {
    setSelectedDate(value);
  };

  const handleEditSessionDate = (value) => {
    setEditSessionDate(value);
  };

  const toggleMemberSelection = (id) => {
    setSelectedMembers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };


  const handleSelectSessionType = (value) => {
    setSelectSessionType(value);
  };

  const handleStatsSessionType = (value) => {
    setStatsSessionType(value);
  };

  const handleEditSessionType = (value) => {
    setEditSessionType(value);
  };

  const handleEditMemberAttended= (value) => {
    setEditMemberAttended(value);
  };

  let filteredMembers = activeMembers.filter(member =>
    member.name.toLowerCase().includes(searchText)
  );

  let transformedChoirSessionData = choirSessions.flatMap(session =>
    session.members.map(member => ({
      key: member._id,
      member: member.member,
      sessionType: session.sessionType,
      sessionDate: session.sessionDate,
      memberAttended: member.hasAttended
    }))
  );

  const filteredTransformedSessionData = transformedChoirSessionData.filter(({ member }) => {
    if (!member || !member.name) return false;
    return member.name.toLowerCase().includes(sessionAttendeeSearchText.toLowerCase());
  });

  const showEditSessionModal = async () => {

    setEditModalVisible(!editModalVisible);


    let { sessionDate, sessionType } = choirSessions?.[0] || {};
    

    setEditSessionDate(sessionDate ? moment(sessionDate) : null);
    setEditSessionType(sessionType);

  };

  const showEditAttendanceModal = (record) => {
    setEditAttendanceModalVisible(true);
    setMemberName(record.member.name);
    setEditMemberAttended(record.member.phone);
    setEditMemberId(() => record.member._id);
  };

  const showEditMemberModal = (record) => {
      setEditMemberModalVisible(true);
      console.log('edit member model', record);
      form.setFieldsValue({
        id: record._id,
        name: record.name,
        email: record.email,
        phone: record.phone,
    });
  };

  const submitEditedSession = async () =>{

    const sessionId = choirSessions[0]?._id;

    const data = {
      sessionDate: editSessionDate,
      sessionType: editSessionType,
      memberId: editMemberId,
      hasAttended: editMemberAttended
    }
    try {
      await api.patch(`/api/v1/choir-sessions/${sessionId}`, {data});

      if(editModalVisible){
        setEditModalVisible(!editModalVisible);
      }

      if(editAttendanceModalVisible){
        setEditAttendanceModalVisible(!editAttendanceModalVisible);
      }
      await fetchChoirSessions();
    } catch (error) {
      console.log(error)
    }
  }



  const showNewMemberModal = () => {
    setNewMemberModalVisible(!newMemberModalVisible);
  }

  const closeNewMemberModal = () => {
    setNewMemberModalVisible(!newMemberModalVisible)
  }

  const closeEditMemberModal = () => {
    setEditMemberModalVisible(!editMemberModalVisible)
  }


  const closeEditModal = async () => {
    setEditModalVisible(!editModalVisible);
  };

  const closeEditAttendanceModal = async () => {
    setEditAttendanceModalVisible(!editAttendanceModalVisible);
  };


  const submitNewMember = async () =>{

    await form.validateFields();

    const values = form.getFieldsValue();

    const data = {
      name: values.name,
      phone: values.phone,
      email: values.email
    }
    try {
    const response = await api.post(`/api/v1/members`, {data});

    if(response) showMsg('success', response.data.message)

    form.resetFields();

    closeNewMemberModal();
    fetchActiveMembers();


    } catch (error) {
      console.log('the error', error);
      if(error) showMsg('error', error?.response?.data?.message);
    }
}

const handleNewMemberFormChange = async () => {
  try {
    await form.validateFields();
    setIsFormValid(true);
  } catch {
    setIsFormValid(false);
  }
};


  const submitEditMember = async () => {

    const values = form.getFieldsValue();
    let memberId = values.id;

    const data = {
      name: values.name,
      phone: values.phone,
      email: values.email
    }
    try {
    const response = await api.patch(`/api/v1/members/${memberId}`, {data});

    if(response) showMsg('success', response.data.message)

    form.resetFields();

    closeEditMemberModal();
    fetchActiveMembers();

    } catch (error) {
      console.log('the error', error);
      if(error) showMsg('error', error?.response?.data?.message);
    }
}

  const submitNewSession = async () => {


    if (!selectSessionType || selectedMembers.length === 0 || !selectedDate) {
      console.log("Please select a session type, a date, and at least one member.");
      return;
    }

    const formattedDate = selectedDate.format('YYYY-MM-DD');

    const data = {
      sessionType: selectSessionType,
      sessionDate: formattedDate,
      members: Object.keys(selectedMembers).map(memberId => ({
        member: memberId,
        hasAttended: selectedMembers[memberId]
      }))
    };


    try {
      const response = await api.post('/api/v1/choir-sessions', {data});

      if (response.status !== 201) {
        throw new Error('Failed to create session');
      }

      handleCancel();
      await fetchChoirSessions()

      // Reset modal inputs
      setSelectSessionType(null);
      setSelectedMembers([]);
      setSelectedDate(null);
      setIsModalVisible(false);

    } catch (error) {
      console.log('error here',error);
      console.log("Something went wrong!");
    }
  };


  const choirMemberColumns = [
    {
        title: '#',
        dataIndex: 'number',
        key: 'number',
        render: (text, record, index) => index + 1
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
        title: 'Options',
        key: 'options',
        render: (text, record) => (
          <>
            <Button type="primary" onClick={() => showEditMemberModal(record)}>Edit</Button>
            <Button type="primary" danger onClick={() => handleDeleteMember(record)} style={{ marginLeft: 8 }}>Delete</Button>
          </>
        )
      }
  ];



  const choirSessionColumns = [
    {
      title: 'Member Name',
      dataIndex: 'member',
      key: 'member',
      render: (member) => member?.name || 'Unknown'
    },
    {
      title: 'Session Type',
      dataIndex: 'sessionType',
      key: 'sessionType',
      render: (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    },
    {
      title: 'Session Date',
      dataIndex: 'sessionDate',
      key: 'sessionDate',
      render: (text) => {

        if (!text) return 'No Date';

        const date = new Date(text);
        if (isNaN(date)) return 'Invalid Date';

        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date);

      }
    },
    {
      title: 'Attended',
      dataIndex: 'memberAttended',
      key: 'memberAttended',
      render: (attended) => attended ? '✅' : '❌'
    },
    {
      title: 'Options',
      key: 'options',
      render: (text, record) => (
        <>
          <Button type="primary" onClick={() => showEditAttendanceModal(record)}>Edit</Button>
        </>
      )
    }
  ];


  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setSelectedDateRange(dates);
    } else {
      setSelectedDateRange(null);
    }
  };


  const isSmallScreen = useIsSmallScreen();

  const renderContent = () => {

    switch (selectedKey) {
      case 'home':
        return (
         <>
            {contextHolder}
           <Stats choirStats={choirStats}>
             <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <RangePicker
                      value={selectedDateRange}
                      placeholder="Select date"
                      style={{ width: '100%', marginBottom: 16 }}
                      onChange={handleDateChange}
                      />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                      <Select
                          value={statsSessionType}
                          placeholder="Session type"
                          onChange={handleStatsSessionType}
                          options={[
                          { value: 'rehearsal', label: 'Rehearsal' },
                          { value: 'prayer', label: 'Prayer' }
                          ]}
                          style={{width: '100%',  marginBottom: 16}}
                    />
                  </Col>
                 <Col xs={24} md={8}>
                  <Button type="primary" block onClick={getChoirStats} disabled={testPhase}>
                    Send
                  </Button>
                </Col>
              </Row>
            </Stats>
         </>
        )


      case 'activeMembers':
        return (
          <>
            <Row
              gutter={[16, 16]}
              justify={isSmallScreen ? "space-between" : "start"} 
            >

            <Col xs={24}>
                <Title
                level={2}
                style={{ textAlign: isSmallScreen ? 'center' : 'left'}}
                >
                  Active choir members
                </Title>
              </Col> 

               <Col xs={24} md={4}>
                <Button
                  type="primary"
                  onClick={showNewMemberModal}
                  icon={<PlusOutlined />}
                  style={{width: '100%'}}
                >
                    Add member
                </Button>
              </Col>

              <Col xs={24} md={20}>
                <Search
                    placeholder="Search member"
                    onSearch={handleSearch}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ 
                      marginBottom: 16, width: isSmallScreen ? '100%' : '30%',
                      float: 'right'
                    }}
                />
              </Col>
             
            </Row>

            <Table
              dataSource={filteredMembers}
              columns={choirMemberColumns}
              rowKey="id"
              style={{ width: '70vw' }}
              loading={loading}
              scroll={{ x: 'max-content' }}
            />
            
            <Modal
                title="Add member"
                open={newMemberModalVisible}
                onOk={submitNewMember}
                onCancel={closeNewMemberModal}
                okButtonProps={{ disabled: !isFormValid || testPhase }}
                width={650}
                >
              {contextHolder}

              <Form form={form} onValuesChange={handleNewMemberFormChange}>

                <Form.Item
                  label="Name"
                  name="name"
                  labelCol={{span: 24}}
                  rules={[{ required: true, message: "Member's name is required!" }]}
                  >
                  <Input/>
                </Form.Item>

                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[{ required: true, message: "Member's phone is required!" }]}
                    labelCol={{span: 24}}>
                    <Input/>

                  </Form.Item>

                  <Form.Item label="Email"  name="email" labelCol={{span: 24}}>
                    <Input/>
                  </Form.Item>

              </Form>
            </Modal>

            <Modal
                title="Edit member"
                open={editMemberModalVisible}
                onOk={submitEditMember}
                onCancel={closeEditMemberModal}
                okButtonProps={{disabled: testPhase}}
                width={650}
                >
                {contextHolder}

                <Form form={form}>

                      <Form.Item label="Name" hidden name="id" labelCol={{span: 24}}>
                        <Input />
                      </Form.Item>

                      <Form.Item label="Name" name="name" labelCol={{span: 24}}>
                        <Input />
                      </Form.Item>

                      <Form.Item label="Email" name="email" labelCol={{span: 24}}>
                        <Input/>
                      </Form.Item>

                      <Form.Item label="Phone" name="phone" labelCol={{span: 24}}>
                        <Input/>
                      </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Delete Member"
                open={deleteMemberModalOpen}
                onOk={confirmDeleteMember}
                onCancel={handleCloseDeleteMemberModal}
                okText="Yes"
                okButtonProps={{ danger: true, disabled: testPhase}}
                
            >
                {deleteSelectedMember && (
                    <p>Are you sure you want to delete <b>{deleteSelectedMember.name}</b>?</p>
                )}
            </Modal>
          </>
        );
      case 'choirSessions':
        return (
          <>
            
            <Row
              gutter={[16, 16]}
              justify={isSmallScreen ? "space-between" : "start"} 
            >
              <Col xs={24}>
                <Title
                level={2}
                style={{ textAlign: isSmallScreen ? 'center' : 'left'}}
                >
                  Choir Session
                </Title>
              </Col>
            
              <Col xs={24} md={4}>
                 <Space >
                    <Button
                        variant="solid"
                        color="green"
                        onClick={showModal}
                        icon={<PlusOutlined />}
                        >
                          Add session
                        </Button>

                    <Button
                        type="primary"
                        variant='solid'
                        onClick={showEditSessionModal}
                        icon={<EditOutlined />}
                        >
                          Edit session
                        </Button>
                  </Space>
               </Col>

              <Col xs={24} md={20}>
                
                <Search
                  placeholder="Search member"
                  onSearch={handleSessionAttendeeSearch}
                  value={sessionAttendeeSearchText}
                  onChange={(e) => setSessionAttendeeSearchText(e.target.value)}
                  style={{ marginBottom: 16, width: isSmallScreen ? '100%' : '30%', float: 'right' }}
                />
              </Col>
            
            </Row>
            <Table
                dataSource={filteredTransformedSessionData}
                columns={choirSessionColumns}
                rowKey="id"
                style={{ width: '70vw' }}
                loading={loading}
                scroll={{ x: 'max-content' }}

                />

            <Modal
                title="Add Session"
                open={isModalVisible}
                onOk={submitNewSession}
                onCancel={handleCancel}
                width={650}
                okButtonProps={{disabled: testPhase}}
                >
              <Select
                value={selectSessionType}
                placeholder="Session type"
                onChange={handleSelectSessionType}
                options={[
                  { value: 'rehearsal', label: 'Rehearsal' },
                  { value: 'prayer', label: 'Prayer' }
                ]}
                style={{width: '100%',  marginBottom: 16}}

              />
              <DatePicker
                  placeholder="Select date"
                  style={{ width: '100%', marginBottom: 16 }}
                  value={selectedDate}
                  onChange={handleSelectedDate}
                />
                <Search
                  placeholder="Search member"
                  onSearch={handleSearch}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ marginBottom: 16, width: '100%', float: 'right' }}
                />

              <Text style={{margin:'20px 0px', fontWeight: 'bold' }}>Attendance list</Text>

              <div style={{ maxHeight: '250px', overflowY: 'auto', marginTop:'19px' }}>
                {filteredMembers.map(member => (
                  <div key={member._id} style={{marginBottom: '10px'}}>
                    <Checkbox checked={!!selectedMembers[member._id]}
                      onChange={() => toggleMemberSelection(member._id)}>{member.name}</Checkbox>
                  </div>
                ))}
              </div>
            </Modal>

              {/* Edit session general info */}
            <Modal
                  title="Edit Session"
                  open={editModalVisible}
                  onOk={submitEditedSession}
                  onCancel={closeEditModal}
                  okButtonProps={{disabled: testPhase}}
                  >
                <Form>

                 <Form.Item label="Session date" labelCol={{span: 24}}>
                  <DatePicker
                        style={{ width: '100%', marginBottom: 16 }}
                        value={editSessionDate}
                        onChange={handleEditSessionDate}
                    />
                 </Form.Item>

                 <Form.Item label="Session type" labelCol={{span: 24}}>
                  <Select
                    placeholder="Session type"
                    value={editSessionType}
                    onChange={handleEditSessionType}
                    options={[
                      { value: 'rehearsal', label: 'Rehearsal' },
                      { value: 'prayer', label: 'Prayer' }
                    ]}
                    style={{width: '100%',  marginBottom: 16}}

                  />
                 </Form.Item>
                </Form>

              </Modal>

            {/* Edit member attendance */}
            <Modal
                title="Edit member attendance "
                open={editAttendanceModalVisible}
                onOk={submitEditedSession}
                onCancel={closeEditAttendanceModal}
                >
                <Form>
                  <Form.Item label="Name" labelCol={{span: 24}}>
                        <Input
                          value={memberName}
                          contentEditable={false}
                          />
                      </Form.Item>

                      <Form.Item label="Attended" labelCol={{span: 24}}>
                          <Select
                          value={editMemberAttended}
                          onChange={handleEditMemberAttended}
                          options={[
                            { value: true, label: 'Yes' },
                            { value: false, label: 'No' }
                          ]}
                          style={{width: '100%',  marginBottom: 16}}

                        />
                    </Form.Item>
                </Form>
              </Modal>
          </>
        );
      default:
        return <Title level={2}>Select a menu item</Title>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" collapsible breakpoint="md">
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Title level={4} style={{ color: '#fff', margin: 0, letterSpacing: 1 }}>AttendMon</Title>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} onClick={handleMenuClick}>
          <Menu.Item key="home" icon={<HomeOutlined />}>Home</Menu.Item>
          <Menu.Item key="activeMembers" icon={<TeamOutlined />}>Active Members</Menu.Item>
          <Menu.Item key="choirSessions" icon={<ScheduleOutlined />}>Choir sessions</Menu.Item>
          <Menu.Item
            type="default"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            >
            Logout
            </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Content style={{ padding: '24px', width: '70vw', margin: 'auto' }}>{renderContent()}</Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;
