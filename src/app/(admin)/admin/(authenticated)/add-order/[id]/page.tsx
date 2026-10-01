
export const runtime = 'edge';

import { Suspense } from 'react';
import AddOrderForm from '@/components/admin/AddOrderForm';

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={<div className="admin-loading"><div className="admin-spinner" /></div>}>
      <AddOrderForm editId={resolvedParams.id} />
    </Suspense>
  );
}
