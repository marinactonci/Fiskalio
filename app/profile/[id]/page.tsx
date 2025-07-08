'use client';

import { useQuery } from 'convex/react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import BillCard from '../_components/BillCard';
import CreateBillDialog from '../_components/CreateBillDialog';
import DeleteProfileAlertDialog from '../_components/DeleteProfileAlertDialog';
import UpdateProfileDialog from '../_components/UpdateProfileDialog';

export default function Profile() {
  const { id } = useParams();

  const profile = useQuery(api.profiles.getProfile, {
    id: id as Id<'profiles'>,
  });

  const bills = useQuery(api.bills.getBillsForProfile, {
    profileId: id as Id<'profiles'>,
  });

  if (!profile) {
    return (
      <div className="py-16 text-center">
        <h2 className="mb-4 font-semibold text-2xl">Profile not found</h2>
        <Link className={cn(buttonVariants, { variant: 'outline' })} href={'/'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <Link
          className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'hover:bg-muted/50'
          )}
          href={'/'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex-1">
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-2xl text-transparent sm:text-3xl">
        {profile.name}
          </h1>
          <div className="mt-1 flex flex-col space-y-1 text-muted-foreground sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4" />
          <span className="break-all text-sm sm:text-base">
            {profile.address.street}, {profile.address.city},{' '}
            {profile.address.country}
          </span>
        </div>
          </div>
        </div>
        <div className="flex w-full space-x-2 sm:w-auto">
          <UpdateProfileDialog profile={profile} />
          <DeleteProfileAlertDialog profile={profile} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-blue-200/50 bg-gradient-to-br from-blue-500/15 to-blue-600/15 dark:border-blue-700/50 dark:from-blue-400/25 dark:to-blue-500/25">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-700 text-sm dark:text-blue-300">
                  Total Bills
                </p>
                <p className="font-bold text-2xl text-blue-900 dark:text-blue-100">
                  {bills?.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200/50 bg-gradient-to-br from-green-500/15 to-green-600/15 dark:border-green-700/50 dark:from-green-400/25 dark:to-green-500/25">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-700 text-sm dark:text-green-300">
                  Active Bills
                </p>
                <p className="font-bold text-2xl text-green-900 dark:text-green-100">
                  {bills?.filter((b) => b.billInstanceCount > 0).length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/50 bg-gradient-to-br from-purple-500/15 to-purple-600/15 dark:border-purple-700/50 dark:from-purple-400/25 dark:to-purple-500/25">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-purple-700 text-sm dark:text-purple-300">
                  Total Instances
                </p>
                <p className="font-bold text-2xl text-purple-900 dark:text-purple-100">
                  {bills?.reduce(
                    (sum, bill) => sum + bill.billInstanceCount,
                    0
                  )}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-2xl">Bills</h2>
        <div className="flex space-x-3">
          <Link href={`/profile/${profile._id}/calendar`}>
            <Button className="hover:bg-muted/50" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </Link>
          <CreateBillDialog profileId={id as Id<'profiles'>} />
        </div>
      </div>

      {bills?.length === 0 ? (
        <Card className="border-2 border-muted-foreground/25 border-dashed bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 font-semibold text-xl">No bills yet</h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              Add your first bill to start tracking monthly instances
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Bill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bills?.map((bill) => (
            <BillCard bill={bill} key={bill._id} />
          ))}
        </div>
      )}
    </div>
  );
}
