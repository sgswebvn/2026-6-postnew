import React, { useState, useEffect, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  User, 
  Key, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  TrendingUp,
  Copy,
  CheckCircle,
  CreditCard,
  Edit3,
  Upload,
  Camera
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_01.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_02.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_36.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_04.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_03.jpg',
  'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_05.jpg',
];

const PERMISSIONS_CONFIG = [
  { key: 'canManagePosts', label: 'Soạn Thảo & Quản Lý Bài Viết Của Mình', desc: 'Cho phép viết bài mới, chỉnh sửa và quản lý các bài viết do tài khoản của mình tạo.' },
  { key: 'canPublishPosts', label: 'Xuất Bản Bài Viết Trực Tiếp (Live)', desc: 'Cho phép đưa bài viết lên trạng thái công khai mà không cần qua duyệt.' },
  { key: 'canManageCategories', label: 'Quản Lý Chuyên Mục (Desks)', desc: 'Tạo, sửa hoặc xóa các danh mục chủ đề trên website.' },
  { key: 'canViewRevenue', label: 'Xem Doanh Thu & Chỉ Số AdSense', desc: 'Truy cập tab Báo cáo doanh thu, RPM, CPC và cấu hình vị trí quảng cáo.' },
  { key: 'canManageStaff', label: 'Quản Lý Nhân Sự & Phân Quyền', desc: 'Thêm mới, sửa thông tin, đặt mật khẩu và phân quyền cho nhân sự khác.' },
  { key: 'canManagePayroll', label: 'Quản Lý Bảng Lương & Chi Trả', desc: 'Cập nhật lương cơ bản, nhập thưởng KPI và quản lý trạng thái thanh toán.' },
  { key: 'canManageSettings', label: 'Cài Đặt & Cấu Hình Hệ Thống', desc: 'Thay đổi tên website, cấu hình SEO Schema, Google Analytics và thông tin tòa soạn.' }
];

export const AdminStaffEdit = ({ staffId }) => {
  const { staffList, saveStaff, deleteStaff, navigate, showToast, showConfirm } = useBlog();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const targetStaff = staffList.find(s => s.id === staffId || s.username === staffId) || null;

  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    refCode: '',
    role: 'editor',
    roleName: 'Biên Tập Viên',
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

  useEffect(() => {
    if (targetStaff) {
      setForm({
        name: targetStaff.name || '',
        username: targetStaff.username || (targetStaff.email ? targetStaff.email.split('@')[0] : 'user'),
        password: targetStaff.password || '123456',
        email: targetStaff.email || '',
        phone: targetStaff.phone || '',
        refCode: targetStaff.refCode || '',
        role: targetStaff.role || 'editor',
        roleName: targetStaff.roleName || 'Biên Tập Viên',
        joinDate: targetStaff.joinDate || new Date().toISOString().split('T')[0],
        status: targetStaff.status || 'active',
        avatar: targetStaff.avatar || AVATAR_PRESETS[0],
        permissions: targetStaff.permissions || {
          canManagePosts: true,
          canPublishPosts: targetStaff.role === 'admin',
          canManageCategories: targetStaff.role === 'admin',
          canViewRevenue: targetStaff.role === 'admin',
          canManageStaff: targetStaff.role === 'admin',
          canManagePayroll: targetStaff.role === 'admin',
          canManageSettings: targetStaff.role === 'admin'
        }
      });
    }
  }, [targetStaff]);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, avatar: reader.result }));
      setIsUploading(false);
      showToast('Đã tải ảnh đại diện nhân viên thành công!', 'success');
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast('Không thể đọc file ảnh', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.username.trim() || !form.password.trim()) {
      showToast('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)', 'error');
      return;
    }

    const payload = {
      ...targetStaff,
      name: form.name.trim(),
      username: form.username.toLowerCase().trim(),
      password: form.password.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      refCode: (form.refCode || '').toUpperCase().trim(),
      role: form.role,
      roleName: form.roleName.trim() || (form.role === 'admin' ? 'Quản Lý Tổng Biên Tập' : 'Biên Tập Viên'),
      joinDate: form.joinDate,
      status: form.status,
      avatar: form.avatar,
      permissions: form.role === 'admin' ? {
        canManagePosts: true,
        canPublishPosts: true,
        canManageCategories: true,
        canViewRevenue: true,
        canManageStaff: true,
        canManagePayroll: true,
        canManageSettings: true
      } : form.permissions
    };

    await saveStaff(payload);
    navigate('/admin/staff');
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Xóa Nhân Sự Khỏi Hệ Thống',
      message: `Bạn có chắc muốn xóa nhân sự "${targetStaff?.name}" khỏi tòa soạn? Toàn bộ quyền hạn và liên kết của nhân viên này sẽ bị xóa.`,
      confirmText: 'Xóa Nhân Sự',
      variant: 'danger',
      onConfirm: async () => {
        await deleteStaff(targetStaff.id);
        showToast(`Đã xóa nhân viên "${targetStaff?.name}"`, 'info');
        navigate('/admin/staff');
      }
    });
  };

  const handleCopyLink = () => {
    if (!form.refCode) return;
    const link = `${window.location.origin}/?ref=${form.refCode.toUpperCase()}`;
    navigator.clipboard.writeText(link);
    showToast(`Đã sao chép link Seeding: ${link}`);
  };

  if (!targetStaff) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 space-y-4">
        <p className="text-sm font-mono text-neutral-500">Không tìm thấy thông tin nhân viên này trong hệ thống.</p>
        <button
          onClick={() => navigate('/admin/staff')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold font-mono"
        >
          Quay lại danh sách nhân sự
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn pb-16 font-admin">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/staff')}
            className="p-2.5 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl border border-neutral-200 transition-colors shadow-xs"
            title="Quay lại danh sách nhân sự"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              <span>Chỉnh Sửa Hồ Sơ & Quyền: {targetStaff.name}</span>
            </h1>
            <p className="text-xs text-neutral-500">
              Cập nhật thông tin liên hệ, mật khẩu tài khoản CMS, ảnh đại diện và ma trận phân quyền.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {targetStaff.role !== 'admin' && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 border border-rose-200 transition-all shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa Nhân Sự</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/admin/staff/salary/${targetStaff.id}`)}
            className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Sửa Bảng Lương</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thay Đổi</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 7 Cols Left + 5 Cols Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: Personal Info & Permissions */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: Personal Profile */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase font-mono pb-2 border-b border-neutral-200">
              <User className="w-4 h-4" />
              <span>1. Thông Tin Định Danh & Ảnh Đại Diện</span>
            </div>

            {/* Avatar Uploader & Selector */}
            <div className="space-y-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-800">
                  Ảnh Đại Diện Nhân Viên (Avatar)
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Đang tải...' : 'Tải Ảnh Từ Máy Tính'}</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarFile} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img 
                  src={form.avatar} 
                  alt="Avatar Preview" 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm flex-shrink-0"
                />

                <div className="space-y-2 flex-1 w-full">
                  <input
                    type="text"
                    value={form.avatar}
                    onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                    placeholder="Nhập đường dẫn URL ảnh hoặc bấm Tải Ảnh..."
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-neutral-500 font-medium">Ảnh mẫu:</span>
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt="preset"
                        onClick={() => setForm({ ...form, avatar: preset })}
                        className={`w-7 h-7 rounded-lg object-cover cursor-pointer border transition-all ${
                          form.avatar === preset ? 'ring-2 ring-blue-500 scale-105 border-transparent' : 'opacity-60 hover:opacity-100 border-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Họ & Tên Nhân Viên *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Email Công Việc *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Số Điện Thoại Liên Hệ
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Chức Danh / Vị Trí Công Tác
                </label>
                <input
                  type="text"
                  value={form.roleName}
                  onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Ngày Gia Nhập Tòa Soạn
                </label>
                <input
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Trạng Thái Làm Việc
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="active">Đang làm việc</option>
                  <option value="writing">Đang viết bài</option>
                  <option value="inactive">Tạm nghỉ / Đã thôi việc</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Granular RBAC Permissions */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Ma Trận Phân Quyền Chức Năng (7 Quyền Độc Lập)</span>
              </div>
            </div>

            <p className="text-xs text-neutral-500">
              Chọn các chức năng cụ thể mà nhân viên này được phép truy cập trong bảng quản trị CMS.
            </p>

            <div className="space-y-2.5">
              {PERMISSIONS_CONFIG.map(perm => {
                const isChecked = form.role === 'admin' || Boolean(form.permissions?.[perm.key]);
                return (
                  <label
                    key={perm.key}
                    className={`p-3 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                      isChecked 
                        ? 'bg-blue-50/50 border-blue-200 text-neutral-900' 
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={form.role === 'admin'}
                      onChange={(e) => setForm({
                        ...form,
                        permissions: {
                          ...(form.permissions || {}),
                          [perm.key]: e.target.checked
                        }
                      })}
                      className="mt-1 rounded border-neutral-300 text-blue-600 focus:ring-0 w-4 h-4"
                    />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-xs font-bold block text-neutral-900">
                        {perm.label}
                      </span>
                      <span className="text-[11px] text-neutral-500 block leading-relaxed">
                        {perm.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: Account Credentials & Seeding Code */}
        <div className="lg:col-span-5 space-y-6">
          {/* SECTION 3: Account Credentials */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase font-mono pb-2 border-b border-neutral-200">
              <Key className="w-4 h-4" />
              <span>3. Tài Khoản Đăng Nhập CMS (Admin Cấp)</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Tên Đăng Nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().trim() })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Mật Khẩu Truy Cập *
                </label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Nhóm Quyền Hệ Thống
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="editor">Editor (Biên tập viên / CTV)</option>
                  <option value="admin">Admin (Tổng biên tập - Toàn quyền)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: Seeding Code */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase font-mono pb-2 border-b border-neutral-200">
              <TrendingUp className="w-4 h-4" />
              <span>4. Mã Tiếp Thị Seeding (?ref=...)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Mã Nhận Diện Seeding (Ref Code)
                </label>
                <input
                  type="text"
                  value={form.refCode}
                  onChange={(e) => setForm({ ...form, refCode: e.target.value.toUpperCase().trim() })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-purple-700 font-mono font-bold uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              {form.refCode && (
                <div className="p-3 bg-neutral-50 rounded-xl border border-purple-200 space-y-2">
                  <span className="text-[10px] font-mono text-purple-700 uppercase font-semibold block">Đường Dẫn Seeding:</span>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/?ref=${form.refCode.toUpperCase()}`} 
                      className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded text-[11px] font-mono text-purple-700"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 transition-colors"
                      title="Sao chép link Seeding"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
