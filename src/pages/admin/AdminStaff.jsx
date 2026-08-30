import React, { useState, useRef } from 'react';
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
  CheckCircle2, 
  Upload, 
  BarChart3, 
  Activity, 
  ExternalLink 
} from 'lucide-react';
import { storageService } from '../../services/storageService';

const AVATAR_PRESETS = [
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_30.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_31.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_32.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_33.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_34.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_35.jpg'
];

export const AdminStaff = () => {
  const { staffList, saveStaff, deleteStaff, updateStaffSalary, activityLogs, clearActivityLogs, showToast, showConfirm, navigate } = useBlog();
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'permissions' | 'payroll' | 'ga4' | 'activity'
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const modalFileInputRef = useRef(null);
  
  // Staff Modal / Form state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    refCode: '',
    role: 'editor',
    roleName: 'Biên Tập Viên Nội Dung',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active',
    avatar: AVATAR_PRESETS[0],
    permissions: {
      canManagePosts: true,
      canPublishPosts: false,
      canManageCategories: false,
      canViewRevenue: false,
      canManageStaff: false,
      canManagePayroll: false,
      canManageSettings: false
    }
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

  const displayStaffList = staffList.filter(s => s.id !== 'staff-1');

  const filteredStaff = displayStaffList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.username && s.username.toLowerCase().includes(search.toLowerCase())) ||
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
        name: staff.name || '',
        username: staff.username || (staff.email ? staff.email.split('@')[0] : 'user'),
        password: staff.password || '123456',
        email: staff.email || '',
        phone: staff.phone || '',
        refCode: staff.refCode || '',
        role: staff.role || 'editor',
        roleName: staff.roleName || 'Biên Tập Viên Nội Dung',
        joinDate: staff.joinDate || new Date().toISOString().split('T')[0],
        status: staff.status || 'active',
        avatar: staff.avatar || AVATAR_PRESETS[0],
        permissions: staff.permissions || {
          canManagePosts: true,
          canPublishPosts: staff.role === 'admin',
          canManageCategories: staff.role === 'admin',
          canViewRevenue: staff.role === 'admin',
          canManageStaff: staff.role === 'admin',
          canManagePayroll: staff.role === 'admin',
          canManageSettings: staff.role === 'admin'
        }
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        name: '',
        username: '',
        password: 'user123',
        email: '',
        phone: '',
        refCode: '',
        role: 'editor',
        roleName: 'Biên Tập Viên Nội Dung',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        avatar: AVATAR_PRESETS[0],
        permissions: {
          canManagePosts: true,
          canPublishPosts: false,
          canManageCategories: false,
          canViewRevenue: false,
          canManageStaff: false,
          canManagePayroll: false,
          canManageSettings: false
        }
      });
    }
    setIsStaffModalOpen(true);
  };

  const handleModalAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStaffForm(prev => ({ ...prev, avatar: reader.result }));
      showToast('Đã tải ảnh đại diện thành công!', 'success');
    };
    reader.readAsDataURL(file);
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
    { key: 'canManagePosts', label: 'Soạn thảo & Sửa bài viết của mình', desc: 'Cho phép tạo và chỉnh sửa nội dung bài viết của tài khoản mình' },
    { key: 'canPublishPosts', label: 'Xuất bản bài viết trực tiếp', desc: 'Đưa bài lên trang chủ mà không cần duyệt' },
    { key: 'canManageCategories', label: 'Quản lý chuyên mục (Desks)', desc: 'Thêm, sửa chuyên mục và danh mục con' },
    { key: 'canViewRevenue', label: 'Xem Doanh Thu & AdSense', desc: 'Theo dõi chỉ số RPM, thu nhập quảng cáo' },
    { key: 'canManageStaff', label: 'Quản lý Nhân sự & Phân quyền', desc: 'Thêm bớt nhân viên và cấp quyền truy cập' },
    { key: 'canManagePayroll', label: 'Quản lý Bảng Lương', desc: 'Nhập lương cứng, thưởng KPI và duyệt chi' },
    { key: 'canManageSettings', label: 'Cấu hình Hệ thống & SEO', desc: 'Thay đổi thông tin website và mã Google' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16 text-neutral-900 font-admin">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Quản Lý Nhân Sự, Phân Quyền & Bảng Lương</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Quản lý hồ sơ nhân viên, cấp mã Seeding CTV, phân quyền chi tiết, theo dõi bảng lương và chỉ số Google Analytics 4.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/staff/new')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Google Analytics 4 Seeding Guidance Alert Card */}
      <div className="p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 rounded-3xl border border-blue-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider font-mono">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Quản Lý View Seeding Chuẩn Xác Qua Google Analytics 4 (GA4 ID: G-MZ34K70519)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
            Realtime Tracking Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-neutral-700">
          <div className="p-3 bg-white rounded-2xl border border-blue-100 space-y-1">
            <span className="font-bold text-blue-900 block">1. Cấp Mã Seeding Cho Nhân Viên</span>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Mỗi nhân viên được cấp 1 mã định danh (vd: <code>?ref=QB</code>, <code>?ref=MINH</code>). Khi nhân viên copy link bài viết để share lên MXH, mã này tự động gắn vào URL.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-blue-100 space-y-1">
            <span className="font-bold text-blue-900 block">2. Tự Động Đồng Bộ Lên Google Analytics 4</span>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Khi độc giả click vào link có <code>?ref=...</code>, hệ thống tự động bắn sự kiện <code>seeding_referral_click</code> và thuộc tính <code>staff_ref</code> lên Google Analytics.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-blue-100 space-y-1">
            <span className="font-bold text-blue-900 block">3. Cách Xem Báo Cáo Trên GA4</span>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Vào <strong>GA4 &gt; Báo cáo (Reports) &gt; Tương tác (Engagement) &gt; Sự kiện (Events)</strong> &gt; Xem sự kiện <code>seeding_referral_click</code> hoặc lọc theo tham số <code>staff_ref</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'profiles'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Hồ Sơ Nhân Sự ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'permissions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Chi Tiết Phân Quyền</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'payroll'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bảng Lương & Chi Trả</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch Sử Hoạt Động ({activityLogs?.length || 0})</span>
        </button>
      </div>

      {/* Search Bar */}
      {activeTab !== 'activity' && (
        <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-2">
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
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-3.5">Nhân Viên & Chức Danh</th>
                  <th className="p-3.5">Tài Khoản CMS</th>
                  <th className="p-3.5">Mã Seeding Link</th>
                  <th className="p-3.5">Lượt Đọc (GA4 & KPI)</th>
                  <th className="p-3.5">Thông Tin Liên Hệ</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-sans">
                {filteredStaff.map(staff => {
                  const refHits = staff.seedingHits || (staff.refCode && typeof storageService.getReferralHits === 'function' ? (storageService.getReferralHits()?.[staff.refCode] || 0) : 0);
                  const bonusEarned = refHits * 500;

                  return (
                    <tr key={staff.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={staff.avatar} 
                            alt={staff.name} 
                            className="w-10 h-10 rounded-2xl object-cover border border-neutral-200 shadow-xs flex-shrink-0"
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
                        <div className="space-y-0.5 font-mono text-xs">
                          <div className="flex items-center gap-1 text-neutral-900 font-bold">
                            <span className="text-neutral-400 font-normal">User:</span>
                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{staff.username || (staff.email ? staff.email.split('@')[0] : 'user')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <span>Bảo mật:</span>
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Đã mã hóa</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {staff.refCode ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold text-xs">
                              ?ref={staff.refCode}
                            </span>
                            <button
                              onClick={() => handleCopyStaffSeedingLink(staff.refCode)}
                              className="p-1 hover:bg-purple-100 rounded text-neutral-400 hover:text-purple-700 transition-colors"
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
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                              +{refHits} Views
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-mono block">
                            +{bonusEarned.toLocaleString()} đ KPI
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="text-neutral-700 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-neutral-400" /> {staff.email}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-neutral-400" /> {staff.phone || 'Chưa cập nhật'}
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          staff.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : staff.status === 'writing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          {staff.status === 'active' ? 'Đang Làm Việc' : staff.status === 'writing' ? 'Đang Viết Bài' : 'Tạm Nghỉ'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => navigate(`/admin/staff/edit/${staff.id}`)}
                            className="p-1.5 hover:bg-neutral-100 rounded-lg text-blue-600 hover:text-blue-800 transition-colors"
                            title="Sửa thông tin trên trang riêng"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              showConfirm({
                                title: 'Xóa Nhân Sự Khỏi Tòa Soạn',
                                message: `Bạn có chắc chắn muốn xóa nhân sự "${staff.name}"? Quyền truy cập CMS và liên kết của người này sẽ bị xóa bỏ.`,
                                confirmText: 'Xóa Nhân Sự',
                                variant: 'danger',
                                onConfirm: () => {
                                  deleteStaff(staff.id);
                                }
                              });
                            }}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-800 transition-colors"
                            title="Xóa nhân sự"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-serif text-base font-bold text-neutral-900">
              Bảng Phân Quyền Chi Tiết Từng Tính Năng (RBAC Matrix)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tích chọn để cấp hoặc thu hồi quyền truy cập cụ thể cho từng nhân viên trong hệ thống.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-neutral-200 rounded-2xl overflow-hidden">
              <thead className="bg-neutral-50 text-neutral-700 font-bold border-b border-neutral-200 font-mono">
                <tr>
                  <th className="p-3.5 border-b border-neutral-200 min-w-[200px]">Tính Năng Hệ Thống</th>
                  {staffList.map(staff => (
                    <th key={staff.id} className="p-3.5 border-b border-neutral-200 text-center min-w-[120px]">
                      <span className="font-bold text-neutral-900 block">{staff.name}</span>
                      <span className="text-[10px] text-neutral-500 font-normal">{staff.refCode ? `(${staff.refCode})` : ''}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-sans">
                {permissionsList.map(perm => (
                  <tr key={perm.key} className="hover:bg-neutral-50/60">
                    <td className="p-3.5">
                      <p className="font-bold text-neutral-900">{perm.label}</p>
                      <p className="text-[11px] text-neutral-500">{perm.desc}</p>
                    </td>

                    {staffList.map(staff => {
                      const isGranted = staff.role === 'admin' || (staff.permissions && staff.permissions[perm.key]);
                      const isSuperAdmin = staff.role === 'admin';

                      return (
                        <td key={staff.id} className="p-3.5 text-center">
                          <button
                            disabled={isSuperAdmin}
                            onClick={() => handleTogglePermission(staff, perm.key)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                              isGranted 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                            } ${isSuperAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isSuperAdmin ? 'Tài khoản Admin có toàn quyền' : 'Click để bật/tắt quyền'}
                          >
                            {isGranted ? <Check className="w-4 h-4" /> : <span className="text-xs">✕</span>}
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
            <div className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-1">
              <span className="text-xs text-neutral-500 font-medium">Tổng Quỹ Lương Tháng 08/2026</span>
              <h3 className="font-serif text-2xl font-black text-neutral-900">
                {totalPayroll.toLocaleString()} đ
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">Bao gồm lương cứng + Thưởng KPI Seeding</p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-1">
              <span className="text-xs text-neutral-500 font-medium">Đã Chi Trả (Chuyển Khoản)</span>
              <h3 className="font-serif text-2xl font-black text-emerald-600">
                {paidPayroll.toLocaleString()} đ
              </h3>
              <p className="text-[11px] text-emerald-600 font-mono">Đã thanh toán đúng hạn</p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-1">
              <span className="text-xs text-neutral-500 font-medium">Chờ Thanh Toán / Tạm Giữ</span>
              <h3 className="font-serif text-2xl font-black text-amber-600">
                {pendingPayroll.toLocaleString()} đ
              </h3>
              <p className="text-[11px] text-amber-600 font-mono">Cần hoàn tất trước ngày 10 hàng tháng</p>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
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
                <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 font-mono uppercase">
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
                <tbody className="divide-y divide-neutral-200 font-sans">
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
                      <tr key={staff.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <img src={staff.avatar} alt={staff.name} className="w-8 h-8 rounded-full object-cover border border-neutral-200" />
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

                        <td className="p-3.5 font-mono text-neutral-800">
                          {(sal.baseSalary || 0).toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-mono text-emerald-600 font-bold">
                          +{(sal.kpiBonus || 0).toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-mono text-rose-600">
                          -{(sal.deduction || 0).toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-mono text-sm font-bold text-neutral-900">
                          {(sal.netSalary || 0).toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-mono text-neutral-500">
                          {sal.payPeriod || '08/2026'}
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            sal.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {sal.paymentStatus === 'paid' ? 'Đã Thanh Toán' : 'Chờ Duyệt'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => navigate(`/admin/staff/salary/${staff.id}`)}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 rounded-lg text-xs font-semibold transition-colors border border-neutral-200 shadow-xs"
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
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-6 space-y-6">
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
                className="px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none"
              >
                <option value="all">Tất cả hoạt động</option>
                <option value="publish_post">Xuất bản bài viết</option>
                <option value="seeding_hit">Seeding / Lượt click</option>
                <option value="payroll_update">Bảng lương</option>
                <option value="edit_post">Chỉnh sửa nội dung</option>
              </select>

              <button
                onClick={clearActivityLogs}
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 rounded-xl text-xs font-medium transition-colors border border-neutral-200"
              >
                Làm sạch nhật ký
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredActivityLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                Chưa có nhật ký hoạt động nào trong bộ lọc này.
              </div>
            ) : (
              filteredActivityLogs.map(log => (
                <div 
                  key={log.id} 
                  className="p-3.5 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 rounded-2xl flex items-start justify-between gap-4 transition-colors text-xs"
                >
                  <div className="flex items-start space-x-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                      log.type === 'success' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : log.type === 'warning' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-blue-100 text-blue-800'
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

                  <span className="text-[11px] font-mono text-neutral-500 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(log.timestamp).toLocaleDateString('vi-VN')})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
