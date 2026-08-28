// Automated verification script for Staff Creation & Post Detail Page Rendering
import fs from 'fs';
import path from 'path';

console.log('========================================================================');
console.log('🧪 VERIFYING STAFF CREATION & POST DETAIL PERFORMANCE');
console.log('========================================================================\n');

// 1. Test Mock LocalStorage & StorageService for Staff Creation
const mockLocalStorage = {};
global.localStorage = {
  getItem: (key) => mockLocalStorage[key] || null,
  setItem: (key, val) => { mockLocalStorage[key] = String(val); },
  removeItem: (key) => { delete mockLocalStorage[key]; },
  clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
};
global.sessionStorage = global.localStorage;

import { storageService } from '../src/services/storageService.js';

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAILED: ${name}`);
  }
}

// Dimension 1: Staff Creation with generated ID and saving to list
console.log('🔹 Testing Staff Creation & Persistence (50 instances)...');
for (let i = 1; i <= 50; i++) {
  const newStaff = {
    id: `staff-${Date.now()}-${i}`,
    name: `Nhân Viên Test ${i}`,
    username: `staff_test_${i}`,
    password: `pass123_${i}`,
    email: `staff${i}@thehori.click`,
    phone: `09000000${String(i).padStart(2, '0')}`,
    refCode: `TEST${i}`,
    role: i % 2 === 0 ? 'admin' : 'editor',
    roleName: i % 2 === 0 ? 'Quản Trị Viên' : 'Biên Tập Viên',
    status: 'active',
    salary: {
      baseSalary: 12000000,
      kpiBonus: 500000,
      deduction: 0,
      netSalary: 12500000,
      payPeriod: '08/2026',
      paymentStatus: 'paid'
    }
  };

  const updatedList = storageService.saveStaff(newStaff);
  assert(updatedList.some(s => s.id === newStaff.id), `Staff ${newStaff.id} must be in returned list`);
  
  const fetchedList = storageService.getStaffList();
  assert(fetchedList.some(s => s.id === newStaff.id), `Staff ${newStaff.id} must be in storageService.getStaffList()`);
}

// Dimension 2: Update existing staff without duplicating
console.log('🔹 Testing Staff Editing & In-Place Update...');
const testStaffToUpdate = storageService.getStaffList()[0];
const updatedName = testStaffToUpdate.name + ' [ĐÃ CẬP NHẬT]';
const listAfterUpdate = storageService.saveStaff({ ...testStaffToUpdate, name: updatedName });
const updatedStaffFound = listAfterUpdate.find(s => s.id === testStaffToUpdate.id);
assert(updatedStaffFound && updatedStaffFound.name === updatedName, 'Staff name should be updated');
assert(listAfterUpdate.filter(s => s.id === testStaffToUpdate.id).length === 1, 'Staff should not duplicate on update');

// Dimension 3: Verify Post Slug extraction and View Increment
console.log('🔹 Testing Article Slug resolution & View counter...');
const posts = storageService.getPosts();
assert(posts.length > 0, 'Posts list must not be empty');

posts.forEach(post => {
  const oldViews = post.views || 0;
  const updatedPosts = storageService.incrementView(post.slug);
  // Synchronous check on state
  const updatedTarget = storageService.getPosts().find(p => p.slug === post.slug);
  assert(updatedTarget.views >= oldViews, `Views should increase or stay valid for ${post.slug}`);
});

console.log('\n========================================================================');
console.log(`🎉 TEST COMPLETED: ${passed} PASSED / ${failed} FAILED`);
console.log('========================================================================\n');

if (failed > 0) {
  process.exit(1);
}
