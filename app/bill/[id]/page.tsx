'use client';

import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit,
  Globe,
  Trash2,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreateBillInstanceDialog } from '@/app/bill/_components/CreateBillInstanceDialog';
import { EditBillDialog } from '@/app/bill/_components/EditBillDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { BillInstanceCard } from '../_components/BillInstanceCard';

export default function BillDetails() {
  const { id } = useParams();
  const router = useRouter();

  // State management
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Queries and mutations
  const bill = useQuery(api.bills.getBill, { id: id as Id<'bills'> });
  const instances = useQuery(api.billInstances.getBillInstancesForBill, {
    billId: id as Id<'bills'>,
  });

  // Add delete bill mutation when it's created in convex/bills.ts
  const deleteBill = useMutation(api.bills.deleteBill);

  const handleDeleteBill = async () => {
    setDeleteLoading(true);
    try {
      await deleteBill({ id: id as Id<'bills'> });
      toast.success('Bill deleted successfully!');
      router.push(`/profile/${bill?.profileId}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Failed to delete bill. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!(bill && instances)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
      </div>
    );
  }

  // Calculate statistics
  const totalAmount = instances.reduce(
    (sum: number, instance) => sum + instance.amount,
    0
  );
  const paidAmount = instances
    .filter((i) => i.isPaid)
    .reduce((sum: number, instance) => sum + instance.amount, 0);
  const unpaidCount = instances.filter((i) => !i.isPaid).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button
          className="hover:bg-muted/50"
          onClick={() => router.push(`/profile/${bill.profileId}`)}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex-1">
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-3xl text-transparent">
            {bill.name}
          </h1>
          <p className="mt-1 text-muted-foreground">Bill Details & Instances</p>
        </div>
        <div className="flex space-x-2">
          <EditBillDialog bill={bill} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                disabled={deleteLoading}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Bill
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  bill "{bill.name}" and all associated bill instances.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteLoading}
                  onClick={handleDeleteBill}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Bill'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Bill Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bill.eBill?.link && (
              <div className="flex items-center space-x-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Website</p>
                  <a
                    className="block truncate text-blue-600 text-sm hover:text-blue-800"
                    href={bill.eBill.link}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {bill.eBill.link}
                  </a>
                </div>
              </div>
            )}
            {bill.eBill?.username && (
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Username</p>
                  <p className="text-muted-foreground text-sm">
                    {bill.eBill.username}
                  </p>
                </div>
              </div>
            )}
            {bill.eBill?.password && (
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 text-muted-foreground">🔒</div>
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="font-mono text-muted-foreground text-sm">
                    ••••••••
                  </p>
                </div>
              </div>
            )}
            <div className="border-t pt-4">
              <p className="text-muted-foreground text-xs">
                Created {format(bill._creationTime, 'PPP')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-blue-200/50 bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-700 text-sm">
                      Total Amount
                    </p>
                    <p className="font-bold text-blue-900 text-xl">
                      ${totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200/50 bg-gradient-to-br from-green-500/10 to-green-600/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-700 text-sm">
                      Paid Amount
                    </p>
                    <p className="font-bold text-green-900 text-xl">
                      ${paidAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-6 w-6 text-green-600">✓</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200/50 bg-gradient-to-br from-red-500/10 to-red-600/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-700 text-sm">
                      Unpaid Bills
                    </p>
                    <p className="font-bold text-red-900 text-xl">
                      {unpaidCount}
                    </p>
                  </div>
                  <div className="h-6 w-6 text-red-600">⚠</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-2xl">Bill Instances</h2>
            <CreateBillInstanceDialog billId={id as Id<'bills'>} />
          </div>

          {instances.length === 0 ? (
            <Card className="border-2 border-muted-foreground/25 border-dashed bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 font-semibold text-xl">No instances yet</h3>
                <p className="mb-6 max-w-md text-center text-muted-foreground">
                  Add your first bill instance to start tracking monthly
                  payments
                </p>
                <CreateBillInstanceDialog billId={id as Id<'bills'>} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {instances
                .sort(
                  (a, b) =>
                    new Date(b.dueDate).getTime() -
                    new Date(a.dueDate).getTime()
                )
                .map((instance) => (
                  <BillInstanceCard
                    billInstance={instance}
                    key={instance._id}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
