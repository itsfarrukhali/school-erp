import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  // SYSTEM Permissions (SUPERADMIN only)
  { name: 'system:manage', label: 'Manage System', category: 'SYSTEM', description: 'Full system administration access' },
  { name: 'schools:create', label: 'Create Schools', category: 'SYSTEM', description: 'Create new schools in the system' },
  { name: 'schools:delete', label: 'Delete Schools', category: 'SYSTEM', description: 'Delete schools from the system' },
  { name: 'schools:update', label: 'Update Schools', category: 'SYSTEM', description: 'Update school information' },
  { name: 'schools:view', label: 'View Schools', category: 'SYSTEM', description: 'View all schools in the system' },
  
  // SCHOOL Permissions
  { name: 'school:manage', label: 'Manage School', category: 'SCHOOL', description: 'Manage school settings and configuration' },
  { name: 'campuses:create', label: 'Create Campuses', category: 'SCHOOL', description: 'Create new campuses' },
  { name: 'campuses:update', label: 'Update Campuses', category: 'SCHOOL', description: 'Update campus information' },
  { name: 'campuses:delete', label: 'Delete Campuses', category: 'SCHOOL', description: 'Delete campuses' },
  { name: 'campuses:view', label: 'View Campuses', category: 'SCHOOL', description: 'View campus information' },
  
  // CAMPUS Permissions
  { name: 'campus:manage', label: 'Manage Campus', category: 'CAMPUS', description: 'Manage campus operations' },
  { name: 'campus:view', label: 'View Campus', category: 'CAMPUS', description: 'View campus information' },
  { name: 'campus:settings', label: 'Campus Settings', category: 'CAMPUS', description: 'Modify campus settings' },
  
  // STAFF Permissions
  { name: 'staff:create', label: 'Create Staff', category: 'STAFF', description: 'Register new staff members' },
  { name: 'staff:update', label: 'Update Staff', category: 'STAFF', description: 'Update staff information' },
  { name: 'staff:delete', label: 'Delete Staff', category: 'STAFF', description: 'Remove staff members' },
  { name: 'staff:view', label: 'View Staff', category: 'STAFF', description: 'View staff information' },
  { name: 'teachers:create', label: 'Create Teachers', category: 'STAFF', description: 'Register new teachers' },
  { name: 'teachers:update', label: 'Update Teachers', category: 'STAFF', description: 'Update teacher information' },
  { name: 'teachers:delete', label: 'Delete Teachers', category: 'STAFF', description: 'Remove teachers' },
  { name: 'teachers:view', label: 'View Teachers', category: 'STAFF', description: 'View teacher information' },
  
  // STUDENT Permissions
  { name: 'students:create', label: 'Create Students', category: 'STUDENT', description: 'Register new students' },
  { name: 'students:update', label: 'Update Students', category: 'STUDENT', description: 'Update student information' },
  { name: 'students:delete', label: 'Delete Students', category: 'STUDENT', description: 'Remove students' },
  { name: 'students:view', label: 'View Students', category: 'STUDENT', description: 'View student information' },
  { name: 'students:approve', label: 'Approve Students', category: 'STUDENT', description: 'Approve student admissions' },
  { name: 'students:reject', label: 'Reject Students', category: 'STUDENT', description: 'Reject student admissions' },
  
  // FINANCE Permissions
  { name: 'vouchers:create', label: 'Create Vouchers', category: 'FINANCE', description: 'Generate fee vouchers' },
  { name: 'vouchers:view', label: 'View Vouchers', category: 'FINANCE', description: 'View fee vouchers' },
  { name: 'vouchers:update', label: 'Update Vouchers', category: 'FINANCE', description: 'Modify fee vouchers' },
  { name: 'vouchers:delete', label: 'Delete Vouchers', category: 'FINANCE', description: 'Delete fee vouchers' },
  { name: 'payments:reconcile', label: 'Reconcile Payments', category: 'FINANCE', description: 'Reconcile payments' },
  { name: 'payments:view', label: 'View Payments', category: 'FINANCE', description: 'View payment records' },
  { name: 'payments:import', label: 'Import Payments', category: 'FINANCE', description: 'Import payment statements' },
  { name: 'discounts:manage', label: 'Manage Discounts', category: 'FINANCE', description: 'Manage fee discounts' },
  { name: 'discounts:approve', label: 'Approve Discounts', category: 'FINANCE', description: 'Approve discount requests' },
  
  // ACADEMIC Permissions
  { name: 'classes:create', label: 'Create Classes', category: 'ACADEMIC', description: 'Create new classes' },
  { name: 'classes:update', label: 'Update Classes', category: 'ACADEMIC', description: 'Update class information' },
  { name: 'classes:delete', label: 'Delete Classes', category: 'ACADEMIC', description: 'Delete classes' },
  { name: 'classes:view', label: 'View Classes', category: 'ACADEMIC', description: 'View class information' },
  { name: 'attendance:mark', label: 'Mark Attendance', category: 'ACADEMIC', description: 'Mark student attendance' },
  { name: 'attendance:view', label: 'View Attendance', category: 'ACADEMIC', description: 'View attendance records' },
  { name: 'attendance:edit', label: 'Edit Attendance', category: 'ACADEMIC', description: 'Modify attendance records' },
  { name: 'exams:create', label: 'Create Exams', category: 'ACADEMIC', description: 'Create exam schedules' },
  { name: 'exams:view', label: 'View Exams', category: 'ACADEMIC', description: 'View exam information' },
  { name: 'results:enter', label: 'Enter Results', category: 'ACADEMIC', description: 'Enter exam results' },
  { name: 'results:view', label: 'View Results', category: 'ACADEMIC', description: 'View exam results' },
  
  // REPORTS Permissions
  { name: 'reports:view', label: 'View Reports', category: 'REPORTS', description: 'View system reports' },
  { name: 'reports:generate', label: 'Generate Reports', category: 'REPORTS', description: 'Generate custom reports' },
  { name: 'reports:export', label: 'Export Reports', category: 'REPORTS', description: 'Export reports to files' },
  { name: 'reports:financial', label: 'Financial Reports', category: 'REPORTS', description: 'View financial reports' },
  { name: 'reports:academic', label: 'Academic Reports', category: 'REPORTS', description: 'View academic reports' },
  { name: 'reports:attendance', label: 'Attendance Reports', category: 'REPORTS', description: 'View attendance reports' },
];

async function main() {
  console.log('🌱 Seeding permissions...');
  console.log('');

  let created = 0;
  let updated = 0;

  for (const permission of permissions) {
    const result = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        label: permission.label,
        category: permission.category,
        description: permission.description,
      },
      create: permission,
    });

    // Check if it was created or updated
    const existing = await prisma.permission.findUnique({
      where: { name: permission.name },
    });

    if (existing && existing.createdAt.getTime() === existing.updatedAt.getTime()) {
      created++;
      console.log(`✅ Created: ${permission.label} (${permission.category})`);
    } else {
      updated++;
      console.log(`🔄 Updated: ${permission.label} (${permission.category})`);
    }
  }

  console.log('');
  console.log('✅ Permissions seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Total permissions: ${permissions.length}`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log('');
  console.log('📂 Permissions by category:');
  
  const categoryCounts = permissions.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} permissions`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
