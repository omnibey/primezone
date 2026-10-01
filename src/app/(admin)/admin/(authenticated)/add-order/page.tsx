
export const runtime = 'edge';

import { Suspense } from 'react';
import AddOrderForm from '@/components/admin/AddOrderForm';

export default function AddOrderPage() {
  return (
    <Suspense fallback={<div className="admin-loading"><div className="admin-spinner" /></div>}>
      <AddOrderForm editId={null} />
    </Suspense>
  );
}
