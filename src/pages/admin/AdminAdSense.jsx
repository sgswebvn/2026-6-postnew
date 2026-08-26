import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Calculator, 
  ShieldCheck,
  TrendingUp,
  Layout,
  HelpCircle
} from 'lucide-react';

export const AdminAdSense = () => {
  const { settings, updateSettings, showToast } = useBlog();

  const [adsConfig, setAdsConfig] = useState(settings?.adsense || {
    enabled: true,
    sandboxMode: true,
    publisherId: 'ca-pub-9876543210123456',
    autoAdsEnabled: true,
    slots: {
      headerLeaderboard: { enabled: true, slotId: '1029384756', format: 'horizontal', name: 'Banner Đầu Trang / Dưới Menu (Leaderboard 728x90)' },
      inArticleTop: { enabled: true, slotId: '2938475610', paragraphIndex: 2, format: 'fluid', name: 'Quảng Cáo Trong Thân Bài (Sau Đoạn Văn 2)' },
      inArticleMid: { enabled: true, slotId: '3847561029', paragraphIndex: 5, format: 'fluid', name: 'Quảng Cáo Trong Thân Bài (Sau Đoạn Văn 5)' },
      sidebarSticky: { enabled: true, slotId: '4756102938', format: 'rectangle', name: 'Banner Dính Thanh Bên (Sticky Half-Page 300x600)' },
      multiplexBottom: { enabled: true, slotId: '5610293847', format: 'autorelaxed', name: 'Quảng Cáo Gợi Ý Cuối Bài (Multiplex / Matched Content)' },
      mobileAnchor: { enabled: true, slotId: '6102938475', format: 'anchor', name: 'Thanh Banner Dính Đáy Di Động (Mobile Anchor 320x50)' }
    }
  });

  // RPM Calculator State
  const [calcTraffic, setCalcTraffic] = useState(50000);
  const [calcNiche, setCalcNiche] = useState('finance');

  const rpmRates = {
    finance: { name: 'Tài Chính & Đầu Tư Chứng Khoán Mỹ ($42.50 RPM)', rpm: 42.50 },
    tech: { name: 'AI, SaaS & Công Nghệ Mới ($32.00 RPM)', rpm: 32.00 },
    health: { name: 'Sức Khỏe & Tối Ưu Giấc Ngủ ($25.00 RPM)', rpm: 25.00 },
    lifestyle: { name: 'Nhà Cửa & Phong Cách Sống ($18.50 RPM)', rpm: 18.50 },
  };

  const calculatedMonthly = ((calcTraffic / 1000) * rpmRates[calcNiche].rpm).toFixed(2);
  const calculatedAnnual = (calculatedMonthly * 12).toFixed(2);

  const handleToggleSlot = (slotKey) => {
    setAdsConfig(prev => ({
      ...prev,
      slots: {
        ...prev.slots,
        [slotKey]: {
          ...prev.slots[slotKey],
          enabled: !prev.slots[slotKey].enabled
        }
      }
    }));
  };

  const handleSlotIdChange = (slotKey, newSlotId) => {
    setAdsConfig(prev => ({
      ...prev,
      slots: {
        ...prev.slots,
        [slotKey]: {
          ...prev.slots[slotKey],
          slotId: newSlotId
        }
      }
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      adsense: adsConfig
    });
    showToast('Đã lưu và áp dụng cấu hình Google AdSense thành công!');
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-fadeIn max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
              Trung Tâm Quản Lý Kiếm Tiền Google AdSense
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-mono font-bold">
              Tối Ưu RPM Thị Trường Mỹ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Cấu hình mã Publisher ID, kiểm soát vị trí chèn quảng cáo và chuyển đổi chế độ chạy thử nghiệm Sandbox.
          </p>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Cấu Hình AdSense</span>
        </button>
      </div>

      {/* Mode Switches: Master & Sandbox */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Master Switch */}
        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Công Tắc Tổng AdSense (Master Switch)
            </h3>
            <p className="text-xs text-neutral-500">
              Bật hoặc tạm dừng toàn bộ các vị trí quảng cáo trên website ngay lập tức.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={adsConfig.enabled}
              onChange={(e) => setAdsConfig({ ...adsConfig, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Sandbox vs Live Mode */}
        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Chế Độ Mô Phỏng (Sandbox Preview)
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                adsConfig.sandboxMode ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {adsConfig.sandboxMode ? 'DEMO MÔ PHỎNG' : 'SCRIPT LIVE ADSENSE'}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Chế độ Demo hiển thị banner quảng cáo nhãn hàng Mỹ sắc nét. Tắt khi tài khoản AdSense thật của bạn đã được duyệt.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={adsConfig.sandboxMode}
              onChange={(e) => setAdsConfig({ ...adsConfig, sandboxMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>
      </div>

      {/* Publisher ID & Global Scripts */}
      <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-500" />
          <span>Thông Tin Tài Khoản Google AdSense</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Mã Nhà Xuất Bản AdSense (Publisher ID - ca-pub-xxxxxxxx)
            </label>
            <input
              type="text"
              placeholder="ca-pub-9876543210123456"
              value={adsConfig.publisherId}
              onChange={(e) => setAdsConfig({ ...adsConfig, publisherId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-semibold"
            />
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Lấy từ Google AdSense Dashboard › Tài Khoản (Account) › Cài đặt.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Quảng Cáo Tự Động (Auto-Ads)
            </label>
            <label className="flex items-center gap-3 p-2.5 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={adsConfig.autoAdsEnabled}
                onChange={(e) => setAdsConfig({ ...adsConfig, autoAdsEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                Cho phép AI của Google tự động tối ưu vị trí hiển thị thêm
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Granular Ad Slot Configurations */}
      <div className="bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden space-y-0">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-emerald-500" />
              <span>Quản Lý Chi Tiết 6 Vị Trí Quảng Cáo Chiến Lược</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Mỗi vị trí được tính toán để tối đa hóa CTR của độc giả Mỹ và không làm giật khung hình (CLS = 0).
            </p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {Object.entries(adsConfig.slots).map(([slotKey, slotData]) => (
            <div key={slotKey} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {slotData.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                    {slotData.format}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-mono">Slot ID Đơn Vị:</span>
                  <input
                    type="text"
                    value={slotData.slotId}
                    onChange={(e) => handleSlotIdChange(slotKey, e.target.value)}
                    className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-mono w-36"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <span className={`text-xs font-mono font-semibold ${slotData.enabled ? 'text-emerald-500' : 'text-neutral-400'}`}>
                  {slotData.enabled ? '● Đang Bật' : '○ Đang Tắt'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleSlot(slotKey)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                    slotData.enabled 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                  }`}
                >
                  {slotData.enabled ? 'Tắt Vị Trí' : 'Bật Vị Trí'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AdSense US Revenue & RPM Projection Calculator */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-[#0c121e] to-neutral-950 text-white rounded-3xl border border-neutral-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-xl font-bold">
              Bộ Tính Dự Phóng Thu Nhập Google AdSense (Thị Trường Mỹ)
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Dựa trên RPM thực tế của độc giả US/UK/Canada
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Chủ Đề Ngách (Niche)
              </label>
              <select
                value={calcNiche}
                onChange={(e) => setCalcNiche(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {Object.entries(rpmRates).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold uppercase tracking-wider text-neutral-300">Lượt Xem Trang Hàng Tháng (US Views)</span>
                <span className="font-mono text-amber-400 font-bold">{calcTraffic.toLocaleString()} lượt xem/tháng</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={calcTraffic}
                onChange={(e) => setCalcTraffic(Number(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
                <span>10k views</span>
                <span>100k views</span>
                <span>250k views</span>
                <span>500k views</span>
              </div>
            </div>
          </div>

          {/* Result Box */}
          <div className="p-6 bg-neutral-900/90 rounded-2xl border border-amber-500/30 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase text-amber-400">
                Doanh Thu Ước Tính Mỗi Tháng
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-black text-white">
                ${Number(calculatedMonthly).toLocaleString()}
                <span className="text-sm font-sans font-normal text-neutral-400"> USD / tháng</span>
              </h2>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Quy mô cả năm:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                ${Number(calculatedAnnual).toLocaleString()} USD / năm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 100% AdSense Approval Checklist (Compliance Widget) */}
      <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>Danh Sách Kiểm Tra Đạt Chuẩn Duyệt Google AdSense 100%</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Trang Privacy Policy có điều khoản DART Cookies & CCPA (Đã Tích Hợp)</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Trang About Us & Hồ Sơ Ban Biên Tập Chuẩn E-E-A-T (Đã Tích Hợp)</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Trang Liên Hệ (Contact) với địa chỉ trụ sở tại Mỹ & email (Đã Tích Hợp)</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Trang Điều Khoản & Công Khai Đối Tác Quảng Cáo FTC (Đã Tích Hợp)</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Bài viết chuyên sâu 1,200+ từ có cấu trúc Heading & Tables (Đã Tích Hợp)</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Không bị giật dịch chuyển layout (CLS = 0), Responsive 100% (Đã Tối Ưu)</span>
          </div>
        </div>
      </div>
    </form>
  );
};
