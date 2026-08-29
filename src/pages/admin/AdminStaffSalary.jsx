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
  BarChart3, 
  FileText,
  User,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  Zap
} from 'lucide-react';

export const AdminStaffSalary = ({ staffId }) => {
  const { staffList, saveStaff, navigate, showToast } = useBlog();

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
    notes: 'Lương cố định + Thưởng KPI theo Google Analytics'
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
      <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 space-y-4">
        <p className="text-sm font-mono text-neutral-500">Không tìm thấy thông tin nhân viên để cập nhật lương.</p>
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
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn pb-16 font-admin text-neutral-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/staff')}
            className="p-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded-xl border border-neutral-300 transition-colors"
            title="Quay lại danh sách nhân sự"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Quản Lý & Điều Chỉnh Bảng Lương: {targetStaff.name}</span>
            </h1>
            <p className="text-xs text-neutral-500">
              Nhập mức lương cơ bản, thưởng KPI (dựa trên Google Analytics), khấu trừ và chuyển khoản.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/admin/staff')}
            className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold border border-neutral-300 transition-colors"
          >
            Hủy Bỏ
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Bảng Lương</span>
          </button>
        </div>
      </div>

      {/* Staff Snapshot Hero Card */}
      <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img 
            src={targetStaff.avatar} 
            alt={targetStaff.name} 
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm flex-shrink-0"
          />
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              {targetStaff.name}
            </h2>
            <p className="text-xs text-neutral-500 font-mono flex items-center gap-3">
              <span>Chức vụ: <strong>{targetStaff.roleName || targetStaff.role}</strong></span>
              {targetStaff.refCode && (
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                  Mã Seeding: ?ref={targetStaff.refCode}
                </span>
              )}
              <span>Email: {targetStaff.email}</span>
            </p>
          </div>
        </div>

        {/* GA4 Verification Notice */}
        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-purple-900 block">Đo Lường View Trực Tiếp:</span>
            <span className="text-[11px] text-purple-700">100% dữ liệu view nhân viên được xác minh qua Google Analytics 4 (GA4).</span>
          </div>
        </div>
      </div>

      {/* Main Grid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: Salary Numbers */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase font-mono pb-2 border-b border-neutral-200">
              <DollarSign className="w-4 h-4" />
              <span>1. Chi Tiết Các Khoản Thu Nhập & Khấu Trừ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Lương Cứng Cơ Bản (VND) *
                </label>
                <input
                  type="number"
                  step="500000"
                  required
                  value={form.baseSalary}
                  onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Thưởng KPI / Seeding (VND)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={form.kpiBonus}
                  onChange={(e) => setForm({ ...form, kpiBonus: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-emerald-800 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Khấu Trừ / Phạt (VND)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={form.deduction}
                  onChange={(e) => setForm({ ...form, deduction: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-rose-700 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Kỳ Tính Lương (Tháng/Năm) *
                </label>
                <input
                  type="text"
                  placeholder="08/2026"
                  required
                  value={form.payPeriod}
                  onChange={(e) => setForm({ ...form, payPeriod: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Net Salary Summary Callout */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-700 block font-bold uppercase">Thực Lĩnh Sau Cùng (Net):</span>
                <span className="text-[11px] text-neutral-500">Công thức: Lương cứng + Thưởng KPI - Khấu trừ</span>
              </div>
              <p className="text-2xl font-black text-emerald-800 font-mono">
                {netSalary.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase font-mono pb-2 border-b border-neutral-200">
              <CreditCard className="w-4 h-4" />
              <span>2. Thông Tin Tài Khoản Nhận Lương</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Tên Ngân Hàng
                </label>
                <input
                  type="text"
                  placeholder="VD: Vietcombank, Techcombank, MB..."
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Số Tài Khoản Ngân Hàng
                </label>
                <input
                  type="text"
                  placeholder="VD: 1012345678"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: Status & Notes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-neutral-700 font-bold text-xs uppercase font-mono pb-2 border-b border-neutral-200">
              <Calendar className="w-4 h-4" />
              <span>3. Trạng Thái & Ngày Chuyển Khoản</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Trạng Thái Thanh Toán *
                </label>
                <select
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="paid">✓ Đã Chuyển Khoản Thành Công (Paid)</option>
                  <option value="pending">⏳ Đang Chờ Duyệt Chi (Pending)</option>
                  <option value="processing">⚙ Đang Xử Lý Giao Dịch (Processing)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Ngày Chuyển Tiền
                </label>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Ghi Chú Kế Toán
                </label>
                <textarea
                  rows="3"
                  placeholder="Ghi chú thêm về thưởng KPI, hoa hồng hoặc khấu trừ..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
