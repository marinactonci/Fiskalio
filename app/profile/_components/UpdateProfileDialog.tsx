import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import type { Profile } from '@/convex/schema';

const profileSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  streetAddress: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  color: z.string().min(1, 'Color is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UpdateProfileDialogProps {
  profile: Profile;
}

function UpdateProfileDialog({ profile }: UpdateProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const updateProfile = useMutation(api.profiles.updateProfile);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      streetAddress: profile.address.street,
      city: profile.address.city,
      country: profile.address.country,
      color: profile.color || '#3b82f6',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile({
        id: profile._id,
        name: values.name,
        address: {
          street: values.streetAddress,
          city: values.city,
          country: values.country,
        },
        color: values.color,
      });
      toast.success('Profile updated successfully!');
      setOpen(false);
    } catch {
      toast.error('Failed to update profile. Please try again.');
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="hover:bg-muted/50" variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-sm sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold text-transparent text-xl">
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your profile information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Main House, Rental Property"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: "#3b82f6", name: "Blue" },
                        { value: "#10b981", name: "Green" },
                        { value: "#f59e0b", name: "Orange" },
                        { value: "#ef4444", name: "Red" },
                        { value: "#8b5cf6", name: "Purple" },
                        { value: "#06b6d4", name: "Cyan" },
                        { value: "#84cc16", name: "Lime" },
                        { value: "#f97316", name: "Amber" },
                        { value: "#ec4899", name: "Pink" },
                        { value: "#6366f1", name: "Indigo" },
                      ].map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => field.onChange(color.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                            field.value === color.value
                              ? "border-gray-900 ring-2 ring-gray-900/20"
                              : "border-gray-300"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="streetAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                disabled={form.formState.isSubmitting}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                disabled={form.formState.isSubmitting}
                type="submit"
              >
                {form.formState.isSubmitting ? 'Updating...' : 'Update Profile'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default UpdateProfileDialog;
