
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
    Radio,
    Select,
    Tooltip,
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
  InfoCircleOutlined,
  DollarOutlined,
  PrinterOutlined,
}from '@ant-design/icons';
import moment from 'moment';

import axios from 'axios';
import { Stats } from './Stats';
import { useIsSmallScreen } from '../utils/SmallScreen';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const {RangePicker} = DatePicker;

const baseURL = process.env.REACT_APP_API_BASE;
const testPhase = process.env.REACT_APP_TEST_PHASE === 'true';

function Dashboard() {
  const [selectedKey, setSelectedKey] = useState('home');
  const [activeMembers, setActiveMembers] = useState([]);
  const [choirSessions, setChoirSessions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);
  const [deleteSelectedMember, setDeleteSelectedMember] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState({});
  const [absenceReasons, setAbsenceReasons] = useState({});
  const [selectSessionType, setSelectSessionType] = useState('');
  const [editSessionType, setEditSessionType] = useState('');
  const [editMemberId, setEditMemberId] = useState(null);
  const [editMemberAttended, setEditMemberAttended] = useState(null);
  const [editAbsenceReason, setEditAbsenceReason] = useState(null);
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

  const [sessionDateRange, setSessionDateRange] = useState([
    moment().startOf('month'),
    moment().endOf('month')
  ]);

  const [statsSessionType, setStatsSessionType] = useState('rehearsal');

  const [searchText, setSearchText] = useState('');

  const [sessionAttendeeSearchText, setSessionAttendeeSearchText] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState(null);

  // Contributions
  const [contributions, setContributions] = useState([]);
  const [contributionYear, setContributionYear] = useState(moment());
  const [contributionStats, setContributionStats] = useState({ totalPaid: 0, totalUnpaid: 0 });
  const [homeContribRange, setHomeContribRange] = useState([moment().startOf('month'), moment()]);
  const [addContributionVisible, setAddContributionVisible] = useState(false);
  const [editContributionVisible, setEditContributionVisible] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [contributionSearchText, setContributionSearchText] = useState('');
  const [contributionForm] = Form.useForm();

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
    } else if (selectedKey === 'choirSessions') {
      fetchChoirSessions();
    } else if (selectedKey === 'home') {
      getChoirStats();
      fetchContributionStats();
    } else if (selectedKey === 'contributions') {
      fetchContributions();
      fetchActiveMembers();
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

  const fetchChoirSessions = async (range = sessionDateRange) => {
    setLoading(true);
    try {
      const fromDate = range?.[0]?.format('YYYY-MM-DD') ?? '';
      const toDate = range?.[1]?.format('YYYY-MM-DD') ?? '';
      const response = await api.get('/api/v1/choir-sessions', { params: { fromDate, toDate } });
      setChoirSessions(response.data);
    } catch (error) {
      console.error('Error fetching choir sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContributionStats = async (range = homeContribRange) => {
    try {
      const fromDate = range?.[0]?.format('YYYY-MM-DD') ?? '';
      const toDate = range?.[1]?.format('YYYY-MM-DD') ?? '';
      const response = await api.get('/api/v1/contributions/stats', { params: { fromDate, toDate } });
      setContributionStats(response.data);
    } catch (error) {
      console.error('Error fetching contribution stats:', error);
    }
  };

  const fetchContributions = async (year = contributionYear) => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/contributions/summary', {
        params: { year: moment.isMoment(year) ? year.year() : year },
      });
      setContributions(response.data);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAddContribution = async () => {
    try {
      const values = await contributionForm.validateFields();
      const memberId = values.memberId;
      // Always update the monthly minimum on the member
      await api.patch(`/api/v1/members/${memberId}`, {
        data: { minimumContribution: Number(values.minimumContribution) },
      });
      // Record the payment
      await api.post('/api/v1/contributions', {
        data: {
          memberId,
          paidAmount: Number(values.paidAmount),
          payDate: values.payDate ? values.payDate.format('YYYY-MM-DD') : null,
        },
      });
      showMsg('success', 'Contribution recorded.');
      contributionForm.resetFields();
      setAddContributionVisible(false);
      setSelectedContribution(null);
      fetchContributions();
    } catch (error) {
      showMsg('error', error?.response?.data?.message || 'Failed to save contribution.');
    }
  };

  const submitEditContribution = async () => {
    try {
      const values = await contributionForm.validateFields();
      const memberId = selectedContribution.member._id;
      // Update monthly minimum
      await api.patch(`/api/v1/members/${memberId}`, {
        data: { minimumContribution: Number(values.minimumContribution) },
      });
      // Record a payment if paidAmount was filled in
      if (values.paidAmount !== undefined && values.paidAmount !== '') {
        await api.post('/api/v1/contributions', {
          data: {
            memberId,
            paidAmount: Number(values.paidAmount),
            payDate: values.payDate ? values.payDate.format('YYYY-MM-DD') : null,
          },
        });
      }
      showMsg('success', 'Updated.');
      contributionForm.resetFields();
      setEditContributionVisible(false);
      setSelectedContribution(null);
      fetchContributions();
    } catch (error) {
      showMsg('error', error?.response?.data?.message || 'Failed to update.');
    }
  };


  const openPrintWindow = (html) => {
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #000; }
      h2 { margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
      th { background: #f0f0f0; font-weight: 600; }
      tr:nth-child(even) { background: #fafafa; }
      @media print { body { padding: 0; } }
    </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const printSessionsTable = () => {
    const formatReason = r => {
      if (!r) return '-';
      return { absent_with_permission: 'Absent with permission', long_period_permission: 'Long period permission', no_permission: 'No permission' }[r] || r;
    };
    const rows = filteredTransformedSessionData.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.member?.name || '-'}</td>
        <td>${r.sessionType ? r.sessionType.charAt(0).toUpperCase() + r.sessionType.slice(1) : '-'}</td>
        <td>${r.sessionDate ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(r.sessionDate)) : '-'}</td>
        <td>${r.memberAttended ? '✓' : '✗'}</td>
        <td>${formatReason(r.absenceReason)}</td>
      </tr>`).join('');
    openPrintWindow(`
      <h2>Choir Sessions</h2>
      <table>
        <thead><tr><th>#</th><th>Member Name</th><th>Session Type</th><th>Session Date</th><th>Attended</th><th>Absence Reason</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  };

  const printContributionsTable = () => {
    const fmt = v => v !== undefined ? v.toLocaleString() : '-';
    const fmtDate = t => t ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(t)) : '-';
    const rows = contributions.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.memberId?.name || '-'}</td>
        <td>${fmtDate(r.payDate)}</td>
        <td>${fmt(r.paidAmount)}</td>
        <td>${fmt(r.unPaidAmount)}</td>
        <td>${fmt(r.minimumAmount)}</td>
      </tr>`).join('');
    openPrintWindow(`
      <h2>Contributions</h2>
      <table>
        <thead><tr><th>#</th><th>Member</th><th>Pay Date</th><th>Paid (RWF)</th><th>Unpaid (RWF)</th><th>Minimum (RWF)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  };

  const printContributionReceipt = (r) => {
    const fmtDate = t => t ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(t)) : '-';
    openPrintWindow(`
      <h2>Contribution Receipt</h2>
      <table>
        <tr><th>Member</th><td>${r.memberId?.name || '-'}</td></tr>
        <tr><th>Pay Date</th><td>${fmtDate(r.payDate)}</td></tr>
        <tr><th>Paid Amount (RWF)</th><td>${r.paidAmount?.toLocaleString()}</td></tr>
        <tr><th>Unpaid Amount (RWF)</th><td>${r.unPaidAmount?.toLocaleString()}</td></tr>
        <tr><th>Minimum Amount (RWF)</th><td>${r.minimumAmount?.toLocaleString()}</td></tr>
      </table>`);
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
    setSelectedMembers(prev => {
      const nowAttended = !prev[id];
      if (nowAttended) {
        setAbsenceReasons(r => { const next = { ...r }; delete next[id]; return next; });
      }
      return { ...prev, [id]: nowAttended };
    });
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
    if (value) setEditAbsenceReason(null);
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
      memberAttended: member.hasAttended,
      absenceReason: member.absenceReason
    }))
  );

  const filteredTransformedSessionData = transformedChoirSessionData.filter(({ member, memberAttended }) => {
    if (!member || !member.name) return false;
    if (!member.name.toLowerCase().includes(sessionAttendeeSearchText.toLowerCase())) return false;
    if (attendanceFilter !== null && memberAttended !== attendanceFilter) return false;
    return true;
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
    setEditMemberAttended(record.memberAttended);
    setEditAbsenceReason(record.absenceReason || null);
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
        joinDate: record.joinDate ? moment(record.joinDate) : null,
    });
  };

  const submitEditedSession = async () =>{

    const sessionId = choirSessions[0]?._id;

    const data = {
      sessionDate: editSessionDate,
      sessionType: editSessionType,
      memberId: editMemberId,
      hasAttended: editMemberAttended,
      absenceReason: editMemberAttended ? null : editAbsenceReason
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
      email: values.email,
      joinDate: values.joinDate ? values.joinDate.format('YYYY-MM-DD') : null,
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
      email: values.email,
      joinDate: values.joinDate ? values.joinDate.format('YYYY-MM-DD') : null,
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
        hasAttended: selectedMembers[memberId],
        absenceReason: selectedMembers[memberId] ? null : (absenceReasons[memberId] || null)
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
      setAbsenceReasons({});
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
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
    },
    {
        title: 'Join Date',
        dataIndex: 'joinDate',
        key: 'joinDate',
        render: (text) => {
            if (!text) return '-';
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
      title: '#',
      key: 'count',
      render: (_, __, index) => index + 1,
      width: 50,
    },
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
      title: 'Absence Reason',
      key: 'absenceReason',
      render: (text, record) => {
        if (record.memberAttended) {
          return '-';
        }
        const reason = record.absenceReason || 'No reason provided';
        switch (reason) {
          case 'absent_with_permission':
            return 'Absent with permission';
          case 'long_period_permission':
            return 'Long period permission';
          case 'no_permission':
            return 'No permission';
          default:
            return reason;
        }
      }
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
           <Stats
              choirStats={choirStats}
              contributionStats={contributionStats}
              homeContribRange={homeContribRange}
              onContribRangeChange={range => { setHomeContribRange(range); fetchContributionStats(range); }}
            >
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

                  <Form.Item label="Join date" name="joinDate" labelCol={{span: 24}}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
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

                      <Form.Item label="Join date" name="joinDate" labelCol={{span: 24}}>
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
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
            
              <Col xs={24}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <Space>
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

                  <Space wrap>
                    <RangePicker
                      value={sessionDateRange}
                      onChange={range => {
                        setSessionDateRange(range);
                        fetchChoirSessions(range);
                      }}
                      format="YYYY-MM-DD"
                    />
                    <Select
                      placeholder="Attendance"
                      allowClear
                      value={attendanceFilter}
                      onChange={val => setAttendanceFilter(val ?? null)}
                      options={[
                        { value: true, label: 'Present' },
                        { value: false, label: 'Absent' },
                      ]}
                      style={{ width: 130 }}
                    />
                    <Search
                      placeholder="Search member"
                      onSearch={handleSessionAttendeeSearch}
                      value={sessionAttendeeSearchText}
                      onChange={(e) => setSessionAttendeeSearchText(e.target.value)}
                      style={{ width: 200 }}
                    />
                    <Button icon={<PrinterOutlined />} onClick={printSessionsTable}>Print</Button>
                  </Space>
                </div>
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
              <Tooltip title="All members are marked as attended by default">
                <InfoCircleOutlined style={{ marginLeft: 8, color: '#8c8c8c', cursor: 'default' }} />
              </Tooltip>

              <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop:'19px' }}>
                {filteredMembers.map(member => (
                  <div key={member._id} style={{marginBottom: '10px'}}>
                    <Checkbox checked={!!selectedMembers[member._id]}
                      onChange={() => toggleMemberSelection(member._id)}>{member.name}</Checkbox>
                    {!selectedMembers[member._id] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, border: '1px solid #91caff', borderRadius: 6, padding: '6px 10px', backgroundColor: '#e6f4ff', flexWrap: 'nowrap' }}>
                        <Text style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#1677ff' }}>Reason:</Text>
                        <Radio.Group
                          style={{ display: 'flex', flexDirection: 'row', gap: 12 }}
                          value={absenceReasons[member._id] || null}
                          onChange={e => setAbsenceReasons(prev => ({ ...prev, [member._id]: e.target.value }))}
                        >
                          <Radio value="absent_with_permission" style={{ whiteSpace: 'nowrap' }}>Absent with permission</Radio>
                          <Radio value="long_period_permission" style={{ whiteSpace: 'nowrap' }}>Long period permission</Radio>
                          <Radio value="no_permission" style={{ whiteSpace: 'nowrap' }}>No permission</Radio>
                        </Radio.Group>
                      </div>
                    )}
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
                width={600}
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
                          style={{width: '100%'}}
                        />
                    </Form.Item>

                    {editMemberAttended === false && (
                      <Form.Item label="Absence reason" labelCol={{span: 24}}>
                        <div style={{ border: '1px solid #91caff', borderRadius: 6, padding: '8px 12px', backgroundColor: '#e6f4ff' }}>
                          <Radio.Group
                            style={{ display: 'flex', flexDirection: 'row', gap: 12, flexWrap: 'nowrap' }}
                            value={editAbsenceReason}
                            onChange={e => setEditAbsenceReason(e.target.value)}
                          >
                            <Radio value="absent_with_permission" style={{ whiteSpace: 'nowrap' }}>Absent with permission</Radio>
                            <Radio value="long_period_permission" style={{ whiteSpace: 'nowrap' }}>Long period permission</Radio>
                            <Radio value="no_permission" style={{ whiteSpace: 'nowrap' }}>No permission</Radio>
                          </Radio.Group>
                        </div>
                      </Form.Item>
                    )}
                </Form>
              </Modal>
          </>
        );
      case 'contributions':
        return (
          <>
            {contextHolder}
            <Title level={2}>Contributions</Title>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <Space>
                <Button variant="solid" color="green" icon={<PlusOutlined />} onClick={() => { contributionForm.resetFields(); setAddContributionVisible(true); }}>
                  Add contribution
                </Button>
              </Space>
              <Space>
                <Search
                  placeholder="Search member"
                  value={contributionSearchText}
                  onChange={e => setContributionSearchText(e.target.value)}
                  style={{ width: 200 }}
                />
                <DatePicker
                  picker="year"
                  value={contributionYear}
                  onChange={y => { setContributionYear(y); fetchContributions(y); }}
                />
                <Button icon={<PrinterOutlined />} onClick={printContributionsTable}>Print</Button>
              </Space>
            </div>

            <Table
              rowKey="_id"
              loading={loading}
              scroll={{ x: 'max-content' }}
              dataSource={contributions.filter(r =>
                r.member?.name?.toLowerCase().includes(contributionSearchText.toLowerCase())
              )}
              columns={[
                { title: '#', key: 'count', render: (_, __, i) => i + 1, width: 50 },
                { title: 'Member', key: 'member', render: (_, r) => r.member?.name || '-' },
                { title: 'Min/month (RWF)', dataIndex: 'minimumContribution', key: 'minimumContribution', render: v => v?.toLocaleString() },
                { title: 'Months elapsed', dataIndex: 'monthsElapsed', key: 'monthsElapsed' },
                { title: 'Total Paid (RWF)', dataIndex: 'totalPaid', key: 'totalPaid', render: v => v?.toLocaleString() },
                { title: 'Unpaid (RWF)', dataIndex: 'unPaidAmount', key: 'unPaidAmount', render: v => v?.toLocaleString() },
                {
                  title: 'Options',
                  key: 'options',
                  render: (_, record) => (
                    <Space>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setSelectedContribution(record);
                          contributionForm.resetFields();
                          contributionForm.setFieldsValue({ minimumContribution: record.minimumContribution });
                          setEditContributionVisible(true);
                        }}
                      >
                      </Button>
                      <Button
                        variant="solid"
                        color="green"
                        icon={<PlusOutlined />}     
                        onClick={() => {
                          setSelectedContribution(record);
                          contributionForm.resetFields();
                          contributionForm.setFieldsValue({
                            memberId: record.member?._id,
                            minimumContribution: record.minimumContribution,
                          });
                          setAddContributionVisible(true);
                        }}
                      >
                      </Button>
                      <Button icon={<PrinterOutlined />} onClick={() => printContributionReceipt(record)}>Receipt</Button>
                    </Space>
                  ),
                },
              ]}
            />

            {/* Add contribution modal */}
            <Modal
              title="Add Contribution"
              open={addContributionVisible}
              onOk={submitAddContribution}
              onCancel={() => { contributionForm.resetFields(); setAddContributionVisible(false); }}
              width={500}
            >
              <Form form={contributionForm} layout="vertical">
                <Form.Item label="Member" name="memberId" rules={[{ required: true, message: 'Member is required.' }]}>
                  <Select
                    showSearch
                    placeholder="Select member"
                    optionFilterProp="label"
                    options={activeMembers.map(m => ({ value: m._id, label: m.name }))}
                  />
                </Form.Item>
                <Form.Item label="Monthly Minimum (RWF)" name="minimumContribution" rules={[{ required: true, message: 'Required.' }, { type: 'number', min: 0, message: 'Must be >= 0.', transform: v => Number(v) }]}>
                  <Input type="number" min={0} />
                </Form.Item>
                 <Form.Item label="Paid Amount (RWF)" name="paidAmount" rules={[{ required: true, message: 'Required.' }, { type: 'number', min: 0, message: 'Must be >= 0.', transform: v => Number(v) }]}>
                  <Input type="number" min={0} />
                </Form.Item>
                <Form.Item label="Pay Date" name="payDate">
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Form>
            </Modal>

            {/* Edit member minimum contribution modal */}
            <Modal
              title={`Edit — ${selectedContribution?.member?.name || ''}`}
              open={editContributionVisible}
              onOk={submitEditContribution}
              onCancel={() => { contributionForm.resetFields(); setEditContributionVisible(false); setSelectedContribution(null); }}
              width={400}
            >
              <Form form={contributionForm} layout="vertical">
                <Form.Item label="Monthly Minimum (RWF)" name="minimumContribution" rules={[{ required: true, message: 'Required.' }, { type: 'number', min: 0, message: 'Must be >= 0.', transform: v => Number(v) }]}>
                  <Input type="number" min={0} />
                </Form.Item>
                <Form.Item label="Pay Date" name="payDate">
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item label="Paid Amount (RWF)" name="paidAmount" rules={[{ type: 'number', min: 0, message: 'Must be >= 0.', transform: v => Number(v) }]}>
                  <Input type="number" min={0} placeholder="Leave empty to skip recording a payment" />
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
          <Menu.Item key="contributions" icon={<DollarOutlined />}>Contributions</Menu.Item>
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
