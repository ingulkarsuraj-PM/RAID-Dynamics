import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const DEMO_ITEMS = [
  {
    type: 'RISK',
    title: 'Database Outage During Launch',
    description: 'Potential for high traffic to overwhelm the primary database instance.',
    status: 'OPEN',
    priority: 'HIGH',
    owner: 'Sarah Connor',
    ownerEmail: 'sarah@example.com',
    dueDate: '2026-05-15',
    probability: 3,
    impact: 5,
    mitigationPlan: 'Provision high-availability cluster and implement read replicas.',
    contingencyPlan: 'Trigger read-only mode for non-critical services.',
    projectId: 'demo-project'
  },
  {
    type: 'ACTION',
    title: 'Security Audit Review',
    description: 'Perform a full security sweep of the new API endpoints.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    owner: 'John Doe',
    ownerEmail: 'john@example.com',
    dueDate: '2026-04-30',
    projectId: 'demo-project'
  },
  {
    type: 'ISSUE',
    title: 'Vendor Late Delivery',
    description: 'The cloud hardware components are delayed by 2 weeks.',
    status: 'OPEN',
    priority: 'HIGH',
    owner: 'Alex Rivers',
    ownerEmail: 'alex@example.com',
    dueDate: '2026-04-20', // Overdue (Yesterday)
    impact: 4,
    rootCause: 'Global supply chain disruptions in the semiconductor industry.',
    projectId: 'demo-project'
  },
  {
    type: 'DEPENDENCY',
    title: 'API Version 2 Release',
    description: 'Our frontend release depends on the Stable API v2 from the backend team.',
    status: 'OPEN',
    priority: 'HIGH',
    owner: 'Backend Team',
    ownerEmail: 'dev-leads@example.com',
    dueDate: '2026-04-22', // Due Tomorrow
    projectId: 'demo-project'
  }
];

export async function seedDemoData(userId: string) {
  const batch = writeBatch(db);
  const raidCollection = collection(db, 'raidItems');

  DEMO_ITEMS.forEach(item => {
    const newDoc = doc(raidCollection);
    batch.set(newDoc, {
      ...item,
      creatorId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  await batch.commit();
}
