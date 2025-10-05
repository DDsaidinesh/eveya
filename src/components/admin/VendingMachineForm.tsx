import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Edit } from 'lucide-react';
import { VendingMachine } from '@/types/vending';
import { useToast } from '@/hooks/use-toast';

const machineSchema = z.object({
  machine_code: z.string().min(1, 'Machine code is required'),
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  status: z.string(),
});

type MachineFormData = z.infer<typeof machineSchema>;

interface VendingMachineFormProps {
  machine?: VendingMachine;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export const VendingMachineForm = ({ machine, onSuccess, trigger }: VendingMachineFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<MachineFormData>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      machine_code: machine?.machine_code || '',
      name: machine?.name || '',
      location: machine?.location || '',
      latitude: machine?.latitude?.toString() || '',
      longitude: machine?.longitude?.toString() || '',
      status: (machine?.status as string) || 'active',
    },
  });

  const onSubmit = async (data: MachineFormData) => {
    setLoading(true);
    try {
      const machineData = {
        machine_code: data.machine_code,
        name: data.name,
        location: data.location,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        status: data.status,
      };

      if (machine) {
        const { error } = await supabase
          .from('vending_machines')
          .update(machineData)
          .eq('id', machine.id);
        
        if (error) throw error;
        toast({ title: 'Vending machine updated successfully' });
      } else {
        const { error } = await supabase
          .from('vending_machines')
          .insert([machineData]);
        
        if (error) throw error;
        toast({ title: 'Vending machine created successfully' });
      }

      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving machine:', error);
      toast({ 
        title: 'Error saving vending machine', 
        description: 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {machine ? 'Edit Vending Machine' : 'Add New Vending Machine'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="machine_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine Code</FormLabel>
                  <FormControl>
                    <Input placeholder="VM001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Campus VM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Building A, Ground Floor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="12.9716" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="77.5946" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : machine ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};