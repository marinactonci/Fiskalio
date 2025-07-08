import { useMutation } from 'convex/react';
import { format } from 'date-fns';
import { Calendar, Check, DollarSign, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import type { BillInstance } from '@/convex/schema';
import { EditBillInstanceDialog } from './EditBillInstanceDialog';

interface BillInstanceCardProps {
  billInstance: BillInstance;
  onInstanceUpdated?: () => void;
}

export function BillInstanceCard({
  billInstance,
  onInstanceUpdated,
}: BillInstanceCardProps) {
  const [loading, setLoading] = useState(false);
  const togglePaidStatus = useMutation(
    api.billInstances.toggleBillInstancePaidStatus
  );

  const isOverdue = new Date(billInstance.dueDate) < new Date();

  const handleTogglePaidStatus = async () => {
    setLoading(true);
    try {
      await togglePaidStatus({ id: billInstance._id });
      toast.success(
        billInstance.isPaid
          ? 'Bill instance marked as unpaid'
          : 'Bill instance marked as paid'
      );
      onInstanceUpdated?.();
    } catch {
      toast.error('Failed to update bill instance status');
    } finally {
      setLoading(false);
    }
  };

  const getCardStyles = () => {
    if (billInstance.isPaid) {
      return 'border-green-200/50 bg-gradient-to-br from-green-50/50 to-green-100/50';
    }
    if (isOverdue) {
      return 'border-red-200/50 bg-gradient-to-br from-red-50/50 to-red-100/50';
    }
    return 'border-yellow-200/50 bg-gradient-to-br from-yellow-50/50 to-yellow-100/50';
  };

  const getBadgeStyles = () => {
    if (billInstance.isPaid) {
      return 'border-green-200 bg-green-100 text-green-800';
    }
    if (isOverdue) {
      return 'border-red-200 bg-red-100 text-red-800';
    }
    return 'border-yellow-200 bg-yellow-100 text-yellow-800';
  };

  const getBadgeVariant = () => {
    if (billInstance.isPaid) {
      return 'default';
    }
    if (isOverdue) {
      return 'destructive';
    }
    return 'secondary';
  };

  const getBadgeText = () => {
    if (billInstance.isPaid) {
      return 'Paid';
    }
    if (isOverdue) {
      return 'Overdue';
    }
    return 'Pending';
  };

  const getButtonText = () => {
    if (!loading) {
      if (billInstance.isPaid) {
        return (
          <>
            <X className="mr-1 h-4 w-4" />
            Mark Unpaid
          </>
        );
      }
      return (
        <>
          <Check className="mr-1 h-4 w-4" />
          Mark Paid
        </>
      );
    }

    return (
      <div className="h-4 w-4 animate-spin rounded-full border-current border-b-2" />
    );
  };

  return (
    <Card
      className={`group transition-all duration-300 hover:shadow-lg ${getCardStyles()}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <DollarSign className="h-5 w-5" />
            <span>${billInstance.amount.toFixed(2)}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getBadgeStyles()} variant={getBadgeVariant()}>
              {getBadgeText()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            <span>Due: {format(billInstance.dueDate, 'PPP')}</span>
          </div>

          <div className="text-sm">
            <span className="font-medium">{billInstance.month}</span>
          </div>

          {billInstance.description && (
            <p className="line-clamp-2 text-muted-foreground text-sm">
              {billInstance.description}
            </p>
          )}

          <div className="flex items-center justify-between border-muted/20 border-t pt-2">
            <EditBillInstanceDialog
              billInstance={billInstance}
              onInstanceUpdated={onInstanceUpdated}
            />

            <Button
              className={
                billInstance.isPaid
                  ? 'hover:border-red-200 hover:bg-red-50 hover:text-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }
              disabled={loading}
              onClick={handleTogglePaidStatus}
              size="sm"
              variant={billInstance.isPaid ? 'outline' : 'default'}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
