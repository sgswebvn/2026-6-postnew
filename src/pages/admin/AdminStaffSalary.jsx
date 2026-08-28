import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  ArrowLeft, 
  Save, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  FileText,
  User,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export const AdminStaffSalary = ({ staffId }) => {
  const { staffList, saveStaff, updateStaffSalary, navigate, showToast } = useBlog();

  const targetStaff = staffList.find(s => s.id === staffId || s.username === staffId) || null;

  const [form, setForm] = useState({
    baseSalary: 10000000,
    kpiBonus: 0,
    deduction: 0,
    payPeriod: '08/2026',
    paymentStatus: 'paid',
    paymentDate: new Date().toISOString().split('T')[0],
    bankName: 'Vietcombank',
    accountNumber: '1012345678',
    notes: 'Lương cứng cố định + Thưởng KPI Seeding'
  });

  useEffect(() => {
    if (targetStaff?.salary) {
      setForm({
        baseSalary: targetStaff.salary.baseSalary || 10000000,
        kpiBonus: targetStaff.salary.kpiBonus || 0,
        deduction: targetStaff.salary.deduction || 0,
        payPeriod: targetStaff.salary.payPeriod || '08/2026',
        paymentStatus: targetStaff.salary.paymentStatus || 'paid',
        paymentDate: targetStaff.salary.paymentDate || new Date().toISOString().split('T')[0],
        bankName: targetStaff.salary.bankName || 'Vietcombank',
        accountNumber: targetStaff.salary.accountNumber || '1012345678',
        notes: targetStaff.salary.notes || ''
      });
    }
  }, [targetStaff]);

  const base = Number(form.baseSalary) || 0;
  const bonus = Number(form.kpiBonus) || 0;
  const deduct = Number(form.deduction) || 0;
  const netSalary = Math.max(0, base + bonus - deduct);

  // Seeding referral stats
  const referralData = JSON.parse(localStorage.getItem('horizon_staff_referrals_v2') || '{}');
  const userRefHits = (targetStaff?.refCode && referralData[targetStaff.refCode]) || 0;
  const suggestedKpiBonus = userRefHits * 500;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetStaff) return;

    const updatedPayload = {
      ...targetStaff,
      salary: {
        baseSalary: base,
        kpiBonus: bonus,
        deduction: deduct,
        netSalary: netSalary,
        payPeriod: form.payPeriod,
        paymentStatus: form.paymentStatus,
        paymentDate: form.paymentDate,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        notes: form.notes
      }
    };

    saveStaff(updatedPayload);
    showToast(`Đã lưu cập nhật bảng lương cho "${targetStaff.name}"!`, 'success');
    navigate('/admin/staff');
  };

  if (!targetStaff) {
    return (
      <div className="p-12 text-center bg-[#111726] rounded-3xl border border-[#1e293b] space-y-4">
        <p className="text-sm font-mono text-neutral-400">Không tìm thấy thông tin nhân viên để cập nhật lương.</p>
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
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Quản Lý & Điều Chỉnh Bảng Lương: {targetStaff.name}</span>
            </h1>
            <p className="text-xs text-neutral-400">
              Nhập mức lương cơ bản, thưởng KPI Seeding, các khoản khấu trừ và trạng thái chuyển khoản.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/admin/staff')}
            className="px-4 py-2.5 bg-[#182234] hover:bg-[#202d44] text-neutral-300 rounded-xl text-xs font-semibold border border-[#2a3a54] transition-colors"
          >
            Hủy Bỏ
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Bảng Lương</span>
          </button>
        </div>
      </div>

      {/* Staff Snapshot Hero Card */}
      <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img 
            src={targetStaff.avatar} 
            alt={targetStaff.name} 
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md flex-shrink-0"
          />
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-white">
              {targetStaff.name}
            </h2>
            <p className="text-xs text-neutral-400 font-mono flex items-center gap-3">
              <span>Chức vụ: <strong>{targetStaff.roleName || targetStaff.role}</strong></span>
              {targetStaff.refCode && <span className="text-purple-300">Mã Ref: ?ref={targetStaff.refCode}</span>}
              <span>Email: {targetStaff.email}</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#182234] rounded-2xl border border-[#2a3a54] flex items-center gap-6">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 block uppercase">Lượt Đọc Seeding:</span>
            <span className="text-lg font-bold text-purple-300 font-mono">{userRefHits} views</span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-neutral-400 block uppercase">Thưởng KPI Gợi Ý:</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">+{suggestedKpiBonus.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

      {/* Main Grid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: Salary Numbers */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono pb-2 border-b border-[#1e293b]">
              <DollarSign className="w-4 h-4" />
              <span>1. Chi Tiết Các Khoản Thu Nhập & Khấu Trừ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Lương Cứng Cơ Bản (VND) *
                </label>
                <input
                  type="number"
                  step="500000"
                  required
                  value={form.baseSalary}
                  onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-neutral-300">
                    Thưởng KPI / Seeding (VND)
                  </label>
                  {suggestedKpiBonus > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, kpiBonus: suggestedKpiBonus })}
                      className="text-[10px] text-emerald-400 hover:underline font-mono"
                    >
                      Dùng KPI gợi ý (+{suggestedKpiBonus.toLocaleString()}đ)
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="100000"
                  value={form.kpiBonus}
                  onChange={(e) => setForm({ ...form, kpiBonus: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Các Khoản Khấu Trừ / Tạm Ứng (VND)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={form.deduction}
                  onChange={(e) => setForm({ ...form, deduction: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-rose-300 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Kỳ Chi Trả Lương (Tháng/Năm)
                </label>
                <input
                  type="text"
                  placeholder="VD: 08/2026"
                  value={form.payPeriod}
                  onChange={(e) => setForm({ ...form, payPeriod: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Total Net Salary Preview Box */}
            <div className="p-4 bg-[#182234] rounded-2xl border border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-neutral-400 block">Lương Thực Nhận (Net Salary):</span>
                <span className="text-[11px] text-neutral-500 font-mono">= Lương cứng + Thưởng KPI - Khấu trừ</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {netSalary.toLocaleString('vi-VN')} VND
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: Payment Status & Bank Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-[#111726] rounded-3xl border border-[#1e293b] shadow-md space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase font-mono pb-2 border-b border-[#1e293b]">
              <CreditCard className="w-4 h-4" />
              <span>2. Trạng Thái Thanh Toán & Ngân Hàng</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Trạng Thái Chi Trả
                </label>
                <select
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="paid">✓ Đã Thanh Toán (Đã chuyển khoản)</option>
                  <option value="pending">⏳ Chờ Duyệt Chi / Đang Xử Lý</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Ngày Thực Hiện Chuyển Khoản
                </label>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Ngân Hàng Thụ Hưởng
                </label>
                <input
                  type="text"
                  placeholder="VD: Vietcombank, Techcombank, MB..."
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Số Tài Khoản Ngân Hàng
                </label>
                <input
                  type="text"
                  placeholder="VD: 1012345678"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Ghi Chú Kế Toán
                </label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú thêm về kỳ lương này..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#2a3a54] rounded-xl text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
