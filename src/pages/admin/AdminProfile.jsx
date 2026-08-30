import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  User, 
  Key, 
  Copy, 
  ShieldCheck, 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar, 
  Save, 
  TrendingUp, 
  History, 
  ExternalLink,
  Sparkles,
  CheckCircle,
  Eye,
  EyeOff,
  Link2,
  Zap
} from 'lucide-react';
import { ShortLinkModal } from '../../components/admin/ShortLinkModal';
import { storageService } from '../../services/storageService';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop',
];

export const AdminProfile = () => {
  const { currentUser, staffList, saveStaff, activityLogs, showToast, navigate } = useBlog();

  // Find latest staff data from staffList
  const currentStaff = (currentUser && staffList.find(s => s.id === currentUser.id || s.username === currentUser.username)) || currentUser || {
    id: 'staff-1',
    name: 'Tổng Biên Tập Admin',
    username: 'admin',
    email: 'admin@thehori.click',
    phone: '0988 123 456',
    refCode: 'QB',
    role: 'admin',
    roleName: 'Quản Lý Tổng Biên Tập',
    joinDate: '2026-01-15',
    avatar: AVATAR_PRESETS[0],
    permissions: {
      canManagePosts: true,
      canPublishPosts: true,
      canManageCategories: true,
      canViewRevenue: true,
      canManageStaff: true,
      canManagePayroll: true,
      canManageComments: true,
      canManageSettings: true
    }
  };

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password' | 'seeding' | 'activity'
  
  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: currentStaff.name || '',
    email: currentStaff.email || '',
    phone: currentStaff.phone || '',
    refCode: currentStaff.refCode || '',
    avatar: currentStaff.avatar || AVATAR_PRESETS[0]
  });

  // Password change state
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [isShortLinkModalOpen, setIsShortLinkModalOpen] = useState(false);

  // Seeding referral stats
  const referralData = JSON.parse(localStorage.getItem('horizon_staff_referrals_v2') || '{}');
  const userRefHits = (profileForm.refCode && referralData[profileForm.refCode.toUpperCase()]) || 0;
  const seedingLink = `${window.location.origin}/?ref=${(profileForm.refCode || 'SEEK').toUpperCase()}`;

  // Filter personal activity logs
  const myLogs = (activityLogs || []).filter(log => 
    log.staffId === currentStaff.id || 
    log.staffName === currentStaff.name ||
    (profileForm.refCode && log.refCode === profileForm.refCode.toUpperCase())
  );

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      showToast('Vui lòng nhập đầy đủ họ tên và email', 'error');
      return;
    }

    try {
      setIsSavingProfile(true);
      const cleanRefCode = (profileForm.refCode || '').toUpperCase().trim();

      const updated = {
        ...currentStaff,
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        refCode: cleanRefCode,
        avatar: profileForm.avatar
      };

      await saveStaff(updated);
      
      // Update local session
      try {
        sessionStorage.setItem('horizon_current_user', JSON.stringify(updated));
        localStorage.setItem('horizon_current_user', JSON.stringify(updated));
      } catch (e) {}
      showToast('Đã lưu thông tin cá nhân & mã Seeding lên Cloud Database thành công!', 'success');
    } catch (err) {
      showToast('Lỗi khi cập nhật thông tin: ' + err.message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    if (!passForm.newPassword || passForm.newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      showToast('Mật khẩu xác nhận không trùng khớp!', 'error');
      return;
    }

    try {
      setIsSavingPass(true);
      await api.changePassword(passForm.currentPassword, passForm.newPassword);
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Đã đổi mật khẩu an toàn trên máy chủ thành công!', 'success');
    } catch (err) {
      showToast('Lỗi khi đổi mật khẩu: ' + err.message, 'error');
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(seedingLink);
    showToast(`Đã sao chép link Seeding: ${seedingLink}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Profile Hero */}
      <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <img 
              src={profileForm.avatar || currentStaff.avatar} 
              alt={currentStaff.name} 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-xl flex-shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-white">
                  {currentStaff.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  currentStaff.role === 'admin' 
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                    : 'bg-purple-950/80 text-purple-300 border border-purple-800'
                }`}>
                  {currentStaff.roleName || currentStaff.role}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono flex items-center gap-3">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-neutral-500" /> {currentStaff.email}</span>
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-neutral-500" /> @{currentStaff.username || 'user'}</span>
              </p>
            </div>
          </div>

          {currentStaff.refCode && (
            <div className="p-3 bg-[#182234] rounded-2xl border border-purple-800/60 flex items-center gap-3">
              <div>
                <span className="text-[10px] font-mono text-purple-400 font-semibold block uppercase">Mã Tiếp Thị Seeding:</span>
                <span className="text-sm font-mono font-black text-white">?ref={currentStaff.refCode}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="p-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-xl transition-all shadow-sm"
                title="Sao chép link Seeding"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#1e293b]">
          <div className="p-3 bg-[#182234]/70 rounded-xl border border-[#2a3a54]">
            <span className="text-[10px] font-mono text-neutral-400 block">Tên Đăng Nhập</span>
            <span className="text-sm font-bold text-white font-mono">{currentStaff.username || 'admin'}</span>
          </div>
          <div className="p-3 bg-[#182234]/70 rounded-xl border border-[#2a3a54]">
            <span className="text-[10px] font-mono text-neutral-400 block">Lượt Đọc Seeding</span>
            <span className="text-sm font-bold text-purple-300 font-mono">{userRefHits} views</span>
          </div>
          <div className="p-3 bg-[#182234]/70 rounded-xl border border-[#2a3a54]">
            <span className="text-[10px] font-mono text-neutral-400 block">Ngày Gia Nhập</span>
            <span className="text-sm font-bold text-neutral-300 font-mono">{currentStaff.joinDate || '2026-01-15'}</span>
          </div>
          <div className="p-3 bg-[#182234]/70 rounded-xl border border-[#2a3a54]">
            <span className="text-[10px] font-mono text-neutral-400 block">Trạng Thái Làm Việc</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle className="w-3.5 h-3.5" /> Đang Hoạt Động
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#111726] rounded-2xl border border-[#1e293b]">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'info'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-neutral-400 hover:bg-[#182234] hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Hồ Sơ & Thông Tin Cá Nhân</span>
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'password'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-neutral-400 hover:bg-[#182234] hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Đổi Mật Khẩu</span>
        </button>

        <button
          onClick={() => setActiveTab('seeding')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'seeding'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-neutral-400 hover:bg-[#182234] hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trung Tâm Seeding (?ref)</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-neutral-400 hover:bg-[#182234] hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch Sử Thao Tác ({myLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: EDIT PROFILE */}
      {activeTab === 'info' && (
        <form onSubmit={handleUpdateProfile} className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-1">
              Chỉnh Sửa Thông Tin Cá Nhân
            </h3>
            <p className="text-xs text-neutral-400">
              Cập nhật tên hiển thị, ảnh đại diện và thông tin liên hệ công việc.
            </p>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-2">
              Chọn Ảnh Đại Diện (Avatar)
            </label>
            <div className="flex items-center space-x-3">
              <img 
                src={profileForm.avatar} 
                alt="Avatar Preview" 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md flex-shrink-0"
              />
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt="preset"
                    onClick={() => setProfileForm({ ...profileForm, avatar: preset })}
                    className={`w-9 h-9 rounded-xl object-cover cursor-pointer border transition-all ${
                      profileForm.avatar === preset ? 'ring-2 ring-blue-500 scale-105 border-transparent' : 'opacity-60 hover:opacity-100 border-[#2a3a54]'
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
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
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
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-300 mb-1.5">
                Số Điện Thoại Liên Hệ
              </label>
              <input
                type="text"
                placeholder="VD: 0912 345 678"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-300 mb-1.5">
                Mã Tiếp Thị Seeding (?ref=...)
              </label>
              <input
                type="text"
                placeholder="VD: MINH, AN, QB, TECH..."
                value={profileForm.refCode}
                onChange={(e) => setProfileForm({ ...profileForm, refCode: e.target.value.toUpperCase().trim() })}
                className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-purple-300 font-mono font-bold uppercase focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-300 mb-1.5">
                Tên Đăng Nhập (Cố định do Admin cấp)
              </label>
              <input
                type="text"
                disabled
                value={currentStaff.username || 'admin'}
                className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-[#1e293b] rounded-xl text-neutral-400 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1e293b]">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thay Đổi Hồ Sơ & Mã Seeding</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: CHANGE PASSWORD */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-5 max-w-xl">
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-1">
              Đổi Mật Khẩu Truy Cập CMS
            </h3>
            <p className="text-xs text-neutral-400">
              Nhập mật khẩu mới để bảo vệ tài khoản của bạn.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-300 mb-1.5">
                Mật Khẩu Mới *
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu mới"
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="p-1.5 absolute right-3 top-2 text-neutral-400 hover:text-white"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-neutral-300 mb-1.5">
                Xác Nhận Mật Khẩu Mới *
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu mới"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1e293b]">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Key className="w-4 h-4" />
              <span>Cập Nhật Mật Khẩu</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SEEDING REFERRAL CENTER */}
      {activeTab === 'seeding' && (
        <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-1">
              Trung Tâm Tiếp Thị & Tùy Chỉnh Link Seeding Cá Nhân
            </h3>
            <p className="text-xs text-neutral-400">
              Bạn có thể tự đổi mã nhận diện Seeding (Ref Code) theo ý muốn và chia sẻ đường link lên mạng xã hội.
            </p>
          </div>

          {/* Edit Custom Ref Code Box */}
          <div className="p-5 bg-[#182234] rounded-2xl border border-purple-800/60 space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase font-mono">
              <TrendingUp className="w-4 h-4" />
              <span>Tùy Chỉnh Mã Tiếp Thị Của Bạn:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  placeholder="Nhập mã ref mới (VD: TECH2026, QB, MINH, AN...)"
                  value={profileForm.refCode}
                  onChange={(e) => setProfileForm({ ...profileForm, refCode: e.target.value.toUpperCase().trim() })}
                  className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-[#2a3a54] rounded-xl text-xs font-mono font-bold text-purple-300 uppercase focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="sm:col-span-4">
                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-mono shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Mã Ref Mới</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2a3a54]/80 space-y-2">
              <span className="text-xs font-bold text-purple-300 uppercase font-mono block">
                Đường Dẫn Seeding Sau Khi Cập Nhật:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={seedingLink}
                  className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-[#2a3a54] rounded-xl text-xs font-mono text-purple-300"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Link</span>
                </button>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-neutral-400">
                  💡 <strong>Mẹo rải link bài viết:</strong> Gắn <code className="text-purple-300 font-mono">?ref={profileForm.refCode || 'SEEK'}</code> vào cuối link bài viết bất kỳ: <code className="text-neutral-300 font-mono">https://www.thehori.click/post/slug?ref={profileForm.refCode || 'SEEK'}</code>
                </p>
                <button
                  type="button"
                  onClick={() => setIsShortLinkModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-mono shadow-md flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  <span>🔗 Mở Công Cụ Rút Gọn Link Bài Viết</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>Đo Lường & Đối Soát Views Seeding Trực Tiếp Trên Google Analytics 4 (GA4):</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                GA4 ID: G-MZ34K70519
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                <span className="text-[11px] font-bold text-neutral-600 block">1. Nhận Diện Mã CTV</span>
                <p className="text-[11px] text-neutral-500">Mã <strong className="text-purple-700 font-mono">?ref={profileForm.refCode || 'QB'}</strong> được gửi tự động kèm mỗi lượt xem.</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                <span className="text-[11px] font-bold text-neutral-600 block">2. Thống Kê Chuẩn 100%</span>
                <p className="text-[11px] text-neutral-500">Không có view ảo, báo cáo hiển thị trực tiếp trên Dashboard Google Analytics.</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                <span className="text-[11px] font-bold text-neutral-600 block">3. Trạng Thái Tracking</span>
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Đồng bộ thời gian thực
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MY ACTIVITY LOGS */}
      {activeTab === 'activity' && (
        <div className="bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md p-6 space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-1">
              Lịch Sử Thao Tác Của Bạn
            </h3>
            <p className="text-xs text-neutral-400">
              Ghi nhận các hoạt động đăng nhập, xuất bản bài viết và lượt đọc seeding.
            </p>
          </div>

          {myLogs.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs font-mono">
              Chưa có lịch sử hoạt động nào được ghi nhận.
            </div>
          ) : (
            <div className="divide-y divide-[#1e293b]">
              {myLogs.map((log, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">{log.title}</p>
                    <p className="text-[11px] text-neutral-400">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 flex-shrink-0">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : 'Vừa xong'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Short Link Modal */}
      <ShortLinkModal
        isOpen={isShortLinkModalOpen}
        onClose={() => setIsShortLinkModalOpen(false)}
        defaultPost={null}
      />
    </div>
  );
};
