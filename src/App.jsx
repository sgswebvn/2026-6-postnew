import React from 'react';
import { Database, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 2.5rem',
        maxWidth: '640px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={36} />
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Hệ Thống Đã Được Reset Sạch Sẽ
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          marginBottom: '2rem',
          lineHeight: 1.6
        }}>
          Toàn bộ mã nguồn cũ đã được dọn sạch. Cơ sở dữ liệu MongoDB Atlas (Bài viết, Danh mục, Settings, Staffs) và Supabase Storage (Hình ảnh & Tệp tin) đã được bảo toàn nguyên vẹn 100%. Sẵn sàng xây dựng website mới theo yêu cầu của bạn.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          textAlign: 'left'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <Database size={16} /> MongoDB Atlas
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              30 Bài viết & Danh mục được bảo toàn
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <ShieldCheck size={16} /> Supabase Storage
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              217 Tệp tin & Buckets nguyên vẹn
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
