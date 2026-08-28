import React, { useState, useEffect } from 'react';
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
  Edit3
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop',
];

const PERMISSIONS_CONFIG = [
  { key: 'canManagePosts', label: 'Soạn Thảo & Quản Lý Bài Viết', desc: 'Cho phép viết bài, chỉnh sửa nội dung bài viết và quản lý danh sách bài.' },
  { key: 'canPublishPosts', label: 'Xuất Bản Bài Viết Trực Tiếp (Live)', desc: 'Cho phép đưa bài viết lên trạng thái công khai mà không cần qua duyệt.' },
  { key: 'canManageCategories', label: 'Quản Lý Chuyên Mục (Desks)', desc: 'Tạo, sửa hoặc xóa các danh mục chủ đề trên website.' },
  { key: 'canViewRevenue', label: 'Xem Doanh Thu & Chỉ Số AdSense', desc: 'Truy cập tab Báo cáo doanh thu, RPM, CPC và cấu hình vị trí quảng cáo.' },
  { key: 'canManageStaff', label: 'Quản Lý Nhân Sự & Phân Quyền', desc: 'Thêm mới, sửa thông tin, đặt mật khẩu và phân quyền cho nhân sự khác.' },
  { key: 'canManagePayroll', label: 'Quản Lý Bảng Lương & Chi Trả', desc: 'Cập nhật lương cơ bản, nhập thưởng KPI và quản lý trạng thái thanh toán.' },
  { key: 'canManageComments', label: 'Kiểm Duyệt Bình Luận', desc: 'Phê duyệt, phản hồi hoặc xóa bình luận từ độc giả.' },
  { key: 'canManageSettings', label: 'Cài Đặt & Cấu Hình Hệ Thống', desc: 'Thay đổi tên website, cấu hình SEO Schema, Google Analytics và thông tin tòa soạn.' }
];

export const AdminStaffEdit = ({ staffId }) => {
  const { staffList, saveStaff, deleteStaff, navigate, showToast, showConfirm } = useBlog();

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
      canManageComments: true,
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
          canManageComments: true,
          canManageSettings: targetStaff.role === 'admin'
        }
      });
    }
  }, [targetStaff]);

  const handleSubmit = (e) => {
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
        canManageComments: true,
        canManageSettings: true
      } : form.permissions
    };

    saveStaff(payload);
    navigate('/admin/staff');
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Xóa Nhân Sự Khỏi Hệ Thống',
      message: `Bạn có chắc muốn xóa nhân sự "${targetStaff?.name}" khỏi tòa soạn? Toàn bộ quyền hạn và liên kết của nhân viên này sẽ bị xóa.`,
      confirmText: 'Xóa Nhân Sự',
      variant: 'danger',
      onConfirm: () => {
        deleteStaff(targetStaff.id);
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
      <div className="p-12 text-center bg-[#111726] rounded-3xl border border-[#1e293b] space-y-4">
        <p className="text-sm font-mono text-neutral-400">Không tìm thấy thông tin nhân viên này trong hệ thống.</p>
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
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/staff')}
            className="p-2.5 bg-[#182234] hover:bg-[#202d44] text-neutral-300 rounded-xl border border-[#2a3a54] transition-colors"
            title="Quay lại danh sách nhân sự"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              <span>Chỉnh Sửa Hồ Sơ & Quyền: {targetStaff.name}</span>
            </h1>
            <p className="text-xs text-neutral-400">
              Cập nhật thông tin liên hệ, mật khẩu tài khoản CMS, mã Seeding và ma trận phân quyền.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {targetStaff.role !== 'admin' && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 bg-rose-950/50 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 border border-rose-800 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa Nhân Sự</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/admin/staff/salary/${targetStaff.id}`)}
            className="px-4 py-2.5 bg-[#182234] hover:bg-[#202d44] text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Sửa Bảng Lương</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
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
          <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase font-mono pb-2 border-b border-[#1e293b]">
              <User className="w-4 h-4" />
              <span>1. Thông Tin Định Danh & Hồ Sơ</span>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-2">
                Ảnh Đại Diện (Avatar)
              </label>
              <div className="flex items-center space-x-3">
                <img 
                  src={form.avatar} 
                  alt="Avatar Preview" 
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md flex-shrink-0"
                />
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt="preset"
                      onClick={() => setForm({ ...form, avatar: preset })}
                      className={`w-9 h-9 rounded-xl object-cover cursor-pointer border transition-all ${
                        form.avatar === preset ? 'ring-2 ring-blue-500 scale-105 border-transparent' : 'opacity-60 hover:opacity-100 border-[#2a3a54]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Họ & Tên Nhân Viên *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Email Công Việc *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Số Điện Thoại Liên Hệ
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Chức Danh / Vị Trí Công Tác
                </label>
                <input
                  type="text"
                  value={form.roleName}
                  onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Ngày Gia Nhập Tòa Soạn
                </label>
                <input
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Trạng Thái Làm Việc
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="active">Đang làm việc</option>
                  <option value="writing">Đang viết bài</option>
                  <option value="inactive">Tạm nghỉ / Đã thôi việc</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Granular RBAC Permissions */}
          <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Ma Trận Phân Quyền Chức Năng (8 Quyền Độc Lập)</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400">
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
                        ? 'bg-[#182234] border-purple-800/80 text-white' 
                        : 'bg-[#111726] border-[#2a3a54] text-neutral-400 hover:text-white hover:bg-[#151e30]'
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
                      className="mt-1 rounded border-[#2a3a54] text-blue-600 focus:ring-0 w-4 h-4"
                    />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-xs font-bold block text-white">
                        {perm.label}
                      </span>
                      <span className="text-[11px] text-neutral-400 block leading-relaxed">
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
          <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase font-mono pb-2 border-b border-[#1e293b]">
              <Key className="w-4 h-4" />
              <span>3. Tài Khoản Đăng Nhập CMS (Admin Cấp)</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Tên Đăng Nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().trim() })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Mật Khẩu Truy Cập *
                </label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Nhóm Quyền Hệ Thống
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="editor">Editor (Biên tập viên / CTV)</option>
                  <option value="admin">Admin (Tổng biên tập - Toàn quyền)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: Seeding Code */}
          <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase font-mono pb-2 border-b border-[#1e293b]">
              <TrendingUp className="w-4 h-4" />
              <span>4. Mã Tiếp Thị Seeding (?ref=...)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Mã Nhận Diện Seeding (Ref Code)
                </label>
                <input
                  type="text"
                  value={form.refCode}
                  onChange={(e) => setForm({ ...form, refCode: e.target.value.toUpperCase().trim() })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-purple-300 font-mono font-bold uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              {form.refCode && (
                <div className="p-3 bg-[#182234] rounded-xl border border-purple-800/60 space-y-2">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold block">Đường Dẫn Seeding:</span>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/?ref=${form.refCode.toUpperCase()}`} 
                      className="w-full px-2 py-1.5 bg-[#0d131f] border border-[#2a3a54] rounded text-[11px] font-mono text-purple-300"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 rounded transition-colors"
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
