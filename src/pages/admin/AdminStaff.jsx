import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  Users, 
  ShieldCheck, 
  DollarSign, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Phone, 
  Mail, 
  Tag, 
  Briefcase,
  Search,
  Check,
  CreditCard,
  History,
  Share2,
  Copy,
  Clock,
  Sparkles,
  Filter,
  CheckCircle2
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200'
];

export const AdminStaff = () => {
  const { staffList, saveStaff, deleteStaff, updateStaffSalary, activityLogs, clearActivityLogs, showToast } = useBlog();
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'permissions' | 'payroll' | 'activity'
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  
  // Staff Modal / Form state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    refCode: '',
    role: 'editor',
    roleName: 'Biên Tập Viên Nội Dung',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active',
    avatar: AVATAR_PRESETS[0]
  });

  // Payroll Modal state
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    staffId: '',
    staffName: '',
    baseSalary: 10000000,
    kpiBonus: 0,
    deduction: 0,
    payPeriod: '08/2026',
    paymentStatus: 'paid',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.refCode && s.refCode.toLowerCase().includes(search.toLowerCase())) ||
    (s.roleName && s.roleName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredActivityLogs = (activityLogs || []).filter(log => {
    if (activityFilter === 'all') return true;
    return log.action === activityFilter || log.type === activityFilter;
  });

  // Open Staff Modal for create or edit
  const handleOpenStaffModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setStaffForm({
        name: staff.name,
        email: staff.email,
        phone: staff.phone || '',
        refCode: staff.refCode || '',
        role: staff.role || 'editor',
        roleName: staff.roleName || 'Biên Tập Viên',
        joinDate: staff.joinDate || new Date().toISOString().split('T')[0],
        status: staff.status || 'active',
        avatar: staff.avatar || AVATAR_PRESETS[0]
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        name: '',
        email: '',
        phone: '',
        refCode: '',
        role: 'editor',
        roleName: 'Biên Tập Viên Nội Dung',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        avatar: AVATAR_PRESETS[0]
      });
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveStaffSubmit = (e) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.email.trim()) {
      showToast('Vui lòng nhập đầy đủ họ tên và email', 'error');
      return;
    }

    const payload = {
      ...(editingStaff || {}),
      ...staffForm,
      refCode: (staffForm.refCode || '').toUpperCase().trim(),
      id: editingStaff?.id || `staff-${Date.now()}`
    };

    saveStaff(payload);
    setIsStaffModalOpen(false);
  };

  // Open Salary Modal
  const handleOpenSalaryModal = (staff) => {
    setSalaryForm({
      staffId: staff.id,
      staffName: staff.name,
      baseSalary: staff.salary?.baseSalary || 10000000,
      kpiBonus: staff.salary?.kpiBonus || 0,
      deduction: staff.salary?.deduction || 0,
      payPeriod: staff.salary?.payPeriod || '08/2026',
      paymentStatus: staff.salary?.paymentStatus || 'paid',
      paymentDate: staff.salary?.paymentDate || new Date().toISOString().split('T')[0]
    });
    setIsSalaryModalOpen(true);
  };

  const handleSaveSalarySubmit = (e) => {
    e.preventDefault();
    updateStaffSalary(salaryForm.staffId, salaryForm);
    setIsSalaryModalOpen(false);
  };

  // Toggle single permission
  const handleTogglePermission = (staff, permKey) => {
    const currentPerms = staff.permissions || {};
    const updatedPerms = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey]
    };
    saveStaff({
      ...staff,
      permissions: updatedPerms
    });
  };

  // Copy Seeding Link
  const handleCopyStaffSeedingLink = (refCode) => {
    if (!refCode) {
      showToast('Nhân sự này chưa được cấp mã ref seeding', 'info');
      return;
    }
    const fullLink = `${window.location.origin}/?ref=${refCode}`;
    navigator.clipboard.writeText(fullLink);
    showToast(`Đã sao chép link Seeding của mã ?ref=${refCode}!`);
  };

  // Payroll Summary Totals
  const totalPayroll = staffList.reduce((sum, s) => sum + (s.salary?.netSalary || 0), 0);
  const paidPayroll = staffList
    .filter(s => s.salary?.paymentStatus === 'paid')
    .reduce((sum, s) => sum + (s.salary?.netSalary || 0), 0);
  const pendingPayroll = totalPayroll - paidPayroll;

  const permissionsList = [
    { key: 'canManagePosts', label: 'Soạn thảo & Sửa bài viết', desc: 'Cho phép tạo và chỉnh sửa nội dung bài' },
    { key: 'canPublishPosts', label: 'Xuất bản bài viết trực tiếp', desc: 'Đưa bài lên trang chủ mà không cần duyệt' },
    { key: 'canManageCategories', label: 'Quản lý chuyên mục (Desks)', desc: 'Thêm, sửa chuyên mục và danh mục con' },
    { key: 'canViewRevenue', label: 'Xem Doanh Thu & AdSense', desc: 'Theo dõi chỉ số RPM, thu nhập quảng cáo' },
    { key: 'canManageStaff', label: 'Quản lý Nhân sự & Phân quyền', desc: 'Thêm bớt nhân viên và cấp quyền truy cập' },
    { key: 'canManagePayroll', label: 'Quản lý Bảng Lương', desc: 'Nhập lương cứng, thưởng KPI và duyệt chi' },
    { key: 'canManageComments', label: 'Kiểm duyệt Bình luận', desc: 'Duyệt hoặc ẩn ý kiến của độc giả' },
    { key: 'canManageSettings', label: 'Cấu hình Hệ thống & SEO', desc: 'Thay đổi thông tin website và mã Google' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Quản Lý Nhân Sự, Phân Quyền & Bảng Lương</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Quản lý hồ sơ nhân viên, cấp mã Seeding CTV, phân quyền chi tiết, theo dõi bảng lương và lịch sử hoạt động.
          </p>
        </div>

        <button
          onClick={() => handleOpenStaffModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'profiles'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Hồ Sơ Nhân Sự ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'permissions'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Chi Tiết Phân Quyền</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'payroll'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bảng Lương & Chi Trả</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch Sử Hoạt Động ({activityLogs?.length || 0})</span>
        </button>
      </div>

      {/* Search Bar (For Profiles, Permissions, Payroll) */}
      {activeTab !== 'activity' && (
        <div className="p-3 bg-white rounded-xl border border-neutral-200 flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400 ml-2" />
          <input
            type="text"
            placeholder="Tìm nhân viên theo tên, email, mã seeding ref (QB, MINH...), chức danh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
      )}

      {/* TAB 1: PROFILES & LIST */}
      {activeTab === 'profiles' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase">
                <tr>
                  <th className="p-3.5">Nhân Viên & Chức Danh</th>
                  <th className="p-3.5">Mã Seeding Link</th>
                  <th className="p-3.5">Thông Tin Liên Hệ</th>
                  <th className="p-3.5">Ngày Gia Nhập</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {filteredStaff.map(staff => (
                  <tr key={staff.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={staff.avatar} 
                          alt={staff.name} 
                          className="w-10 h-10 rounded-full object-cover border border-neutral-200 flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-neutral-900 block text-sm">
                            {staff.name}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {staff.roleName || staff.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      {staff.refCode ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 font-mono font-bold text-xs">
                            ?ref={staff.refCode}
                          </span>
                          <button
                            onClick={() => handleCopyStaffSeedingLink(staff.refCode)}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-purple-600"
                            title="Sao chép link Seeding cá nhân"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-400 font-mono">Chưa gán</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <p className="text-neutral-700 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3 text-neutral-400" /> {staff.email}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" /> {staff.phone || 'Chưa cập nhật'}
                        </p>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-neutral-600">
                      {staff.joinDate || 'N/A'}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        staff.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : staff.status === 'writing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {staff.status === 'active' ? 'Đang Làm Việc' : staff.status === 'writing' ? 'Đang Viết Bài' : 'Tạm Nghỉ'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenStaffModal(staff)}
                          className="p-1.5 hover:bg-neutral-100 rounded text-blue-600"
                          title="Sửa thông tin"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc muốn xóa nhân sự "${staff.name}"?`)) {
                              deleteStaff(staff.id);
                            }
                          }}
                          className="p-1.5 hover:bg-neutral-100 rounded text-rose-500 hover:text-rose-600"
                          title="Xóa nhân sự"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="font-serif text-base font-bold text-neutral-900">
              Bảng Phân Quyền Chi Tiết Từng Tính Năng (RBAC Matrix)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tích chọn để cấp hoặc thu hồi quyền truy cập cụ thể cho từng nhân viên trong hệ thống.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-neutral-200 rounded-xl">
              <thead className="bg-neutral-50 text-neutral-600 font-mono">
                <tr>
                  <th className="p-3 border-b border-neutral-200 min-w-[200px]">Tính Năng Hệ Thống</th>
                  {staffList.map(staff => (
                    <th key={staff.id} className="p-3 border-b border-neutral-200 text-center min-w-[120px]">
                      <span className="font-bold text-neutral-900 block">{staff.name}</span>
                      <span className="text-[10px] text-neutral-400 font-normal">{staff.refCode ? `(${staff.refCode})` : ''}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {permissionsList.map(perm => (
                  <tr key={perm.key} className="hover:bg-neutral-50/50">
                    <td className="p-3">
                      <p className="font-semibold text-neutral-900">{perm.label}</p>
                      <p className="text-[11px] text-neutral-400">{perm.desc}</p>
                    </td>

                    {staffList.map(staff => {
                      const isGranted = staff.role === 'admin' || (staff.permissions && staff.permissions[perm.key]);
                      const isSuperAdmin = staff.role === 'admin';

                      return (
                        <td key={staff.id} className="p-3 text-center">
                          <button
                            disabled={isSuperAdmin}
                            onClick={() => handleTogglePermission(staff, perm.key)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-all ${
                              isGranted 
                                ? 'bg-emerald-500 text-white shadow-xs' 
                                : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                            } ${isSuperAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isSuperAdmin ? 'Tài khoản Admin có toàn quyền' : 'Click để bật/tắt quyền'}
                          >
                            {isGranted ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs">✕</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL & SALARY MANAGEMENT */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-xs text-neutral-500 font-medium">Tổng Quỹ Lương Tháng 08/2026</span>
              <h3 className="font-serif text-2xl font-black text-neutral-950">
                {totalPayroll.toLocaleString()} đ
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">Bao gồm lương cứng + Thưởng KPI Seeding</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-xs text-neutral-500 font-medium">Đã Chi Trả (Chuyển Khoản)</span>
              <h3 className="font-serif text-2xl font-black text-emerald-600">
                {paidPayroll.toLocaleString()} đ
              </h3>
              <p className="text-[11px] text-emerald-500 font-mono">Đã thanh toán đúng hạn</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-xs text-neutral-500 font-medium">Chờ Thanh Toán / Tạm Giữ</span>
              <h3 className="font-serif text-2xl font-black text-amber-600">
                {pendingPayroll.toLocaleString()} đ
              </h3>
              <p className="text-[11px] text-amber-500 font-mono">Cần hoàn tất trước ngày 10 hàng tháng</p>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-neutral-900">
                  Bảng Chi Tiết Tiền Lương & Thưởng KPI
                </h3>
                <p className="text-xs text-neutral-500">Bấm nút "Nhập / Sửa Lương" để cập nhật số liệu cho từng nhân sự.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase">
                  <tr>
                    <th className="p-3.5">Nhân Viên</th>
                    <th className="p-3.5">Lương Cứng</th>
                    <th className="p-3.5">Thưởng KPI / Seeding</th>
                    <th className="p-3.5">Khấu Trừ</th>
                    <th className="p-3.5">Thực Nhận (Net)</th>
                    <th className="p-3.5">Kỳ Lương</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans">
                  {filteredStaff.map(staff => {
                    const sal = staff.salary || {
                      baseSalary: 10000000,
                      kpiBonus: 0,
                      deduction: 0,
                      netSalary: 10000000,
                      payPeriod: '08/2026',
                      paymentStatus: 'paid'
                    };

                    return (
                      <tr key={staff.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <img src={staff.avatar} alt={staff.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <span className="font-bold text-neutral-900 block">
                                {staff.name}
                              </span>
                              <span className="text-[11px] text-neutral-500 font-mono">
                                {staff.refCode ? `Mã: ${staff.refCode}` : 'Chưa có ref'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-neutral-700">
                          {(sal.baseSalary || 0).toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-mono text-emerald-600 font-semibold">
                          +{(sal.kpiBonus || 0).toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-mono text-rose-500">
                          -{(sal.deduction || 0).toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-mono text-sm font-bold text-neutral-950">
                          {(sal.netSalary || 0).toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-mono text-neutral-500">
                          {sal.payPeriod || '08/2026'}
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            sal.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sal.paymentStatus === 'paid' ? 'Đã Thanh Toán' : 'Chờ Duyệt'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenSalaryModal(staff)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-blue-50 text-neutral-700 hover:text-blue-600 rounded-lg text-xs font-medium transition-colors"
                          >
                            Nhập / Sửa Lương
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY AUDIT LOG (LỊCH SỬ HOẠT ĐỘNG) */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <h3 className="font-serif text-base font-bold text-neutral-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Nhật Ký & Lịch Sử Hoạt Động Của Nhân Sự</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Theo dõi thời gian thực mọi thao tác: đăng bài, seeding lượt click, điều chỉnh lương, đăng nhập.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none"
              >
                <option value="all">Tất cả hoạt động</option>
                <option value="publish_post">Xuất bản bài viết</option>
                <option value="seeding_hit">Seeding / Lượt click</option>
                <option value="payroll_update">Bảng lương</option>
                <option value="edit_post">Chỉnh sửa nội dung</option>
              </select>

              <button
                onClick={clearActivityLogs}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-medium transition-colors"
              >
                Làm sạch nhật ký
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredActivityLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 font-mono">
                Chưa có nhật ký hoạt động nào trong bộ lọc này.
              </div>
            ) : (
              filteredActivityLogs.map(log => (
                <div 
                  key={log.id} 
                  className="p-3.5 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl flex items-start justify-between gap-4 transition-colors text-xs"
                >
                  <div className="flex items-start space-x-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                      log.type === 'success' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : log.type === 'warning' 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {log.staffName ? log.staffName.charAt(0) : 'H'}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{log.staffName}</span>
                        {log.refCode && (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                            ?ref={log.refCode}
                          </span>
                        )}
                        <span className="text-neutral-400">•</span>
                        <span className="font-semibold text-neutral-700">{log.title}</span>
                      </div>
                      <p className="text-neutral-600 leading-relaxed">{log.details}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-400 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(log.timestamp).toLocaleDateString('vi-VN')})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REFINED MODAL: ADD / EDIT STAFF PROFILE */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-serif text-lg font-bold text-neutral-950">
                {editingStaff ? 'Chỉnh Sửa Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên / CTV Mới'}
              </h3>
              <button 
                onClick={() => setIsStaffModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaffSubmit} className="space-y-4 text-xs">
              {/* Avatar Selector */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Chọn Ảnh Đại Diện (Avatar)
                </label>
                <div className="flex items-center space-x-3">
                  <img 
                    src={staffForm.avatar} 
                    alt="Preview" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-xs flex-shrink-0"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt="preset"
                        onClick={() => setStaffForm({ ...staffForm, avatar: preset })}
                        className={`w-8 h-8 rounded-full object-cover cursor-pointer border transition-all ${
                          staffForm.avatar === preset ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Họ & Tên Nhân Viên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Email Công Việc *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="VD: a.nv@thehorizonpost.com"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Số Điện Thoại Liên Hệ
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0912 345 678"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Mã Seeding / Tracking (?ref=...)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: MINH, AN, QB"
                    value={staffForm.refCode}
                    onChange={(e) => setStaffForm({ ...staffForm, refCode: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Chức Danh / Vị Trí
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Biên Tập Viên SEO"
                    value={staffForm.roleName}
                    onChange={(e) => setStaffForm({ ...staffForm, roleName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Ngày Gia Nhập
                  </label>
                  <input
                    type="date"
                    value={staffForm.joinDate}
                    onChange={(e) => setStaffForm({ ...staffForm, joinDate: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Nhóm Quyền Hệ Thống
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="editor">Editor (Biên tập viên / CTV)</option>
                    <option value="admin">Admin (Toàn quyền quản trị)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Trạng Thái Làm Việc
                  </label>
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Đang làm việc</option>
                    <option value="writing">Đang viết bài</option>
                    <option value="inactive">Tạm nghỉ / Đã nghỉ</option>
                  </select>
                </div>
              </div>

              {/* Link Preview Info */}
              {staffForm.refCode && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-800 text-[11px] font-mono flex items-center justify-between">
                  <span>Link Seeding: <strong>{window.location.origin}/?ref={staffForm.refCode.toUpperCase()}</strong></span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-sm"
                >
                  Lưu Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SALARY / PAYROLL */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h3 className="font-serif text-base font-bold text-neutral-950">
                  Cập Nhật Lương: {salaryForm.staffName}
                </h3>
                <p className="text-xs text-neutral-500 font-mono">Kỳ tính lương: {salaryForm.payPeriod}</p>
              </div>
              <button 
                onClick={() => setIsSalaryModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSalarySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Lương Cứng Cơ Bản (VND) *
                </label>
                <input
                  type="number"
                  step="100000"
                  required
                  value={salaryForm.baseSalary}
                  onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Thưởng KPI / Thưởng Lượt Xem Seeding (VND)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={salaryForm.kpiBonus}
                  onChange={(e) => setSalaryForm({ ...salaryForm, kpiBonus: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Khấu Trừ / Phạt (VND)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={salaryForm.deduction}
                  onChange={(e) => setSalaryForm({ ...salaryForm, deduction: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Computed Net */}
              <div className="p-3 bg-neutral-100 rounded-xl flex items-center justify-between">
                <span className="font-bold text-neutral-600">Tổng Lương Thực Nhận:</span>
                <span className="font-mono text-base font-black text-blue-600">
                  {Math.max(0, Number(salaryForm.baseSalary || 0) + Number(salaryForm.kpiBonus || 0) - Number(salaryForm.deduction || 0)).toLocaleString()} đ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Trạng Thái Chi Trả
                  </label>
                  <select
                    value={salaryForm.paymentStatus}
                    onChange={(e) => setSalaryForm({ ...salaryForm, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="paid">Đã Thanh Toán</option>
                    <option value="pending">Chờ Duyệt Chi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Ngày Thanh Toán
                  </label>
                  <input
                    type="date"
                    value={salaryForm.paymentDate}
                    onChange={(e) => setSalaryForm({ ...salaryForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Lưu Bảng Lương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
