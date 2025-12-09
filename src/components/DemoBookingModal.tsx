import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const propertyTypes = [
  { id: "multi-family", label: "Multi-Family" },
  { id: "single-family", label: "Single-Family" },
  { id: "commercial", label: "Commercial" },
  { id: "student-housing", label: "Student Housing" },
  { id: "short-term-rentals", label: "Short-Term Rentals" },
  { id: "other", label: "Other" },
] as const;

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address").max(255),
  companyName: z.string().trim().min(1, "Company name is required").max(100),
  unitsManaged: z.string().min(1, "Please select the number of units"),
  propertyTypes: z.array(z.string()).min(1, "Select at least one property type"),
  aiFeature: z.string().min(1, "Please select an AI feature"),
});

type FormData = z.infer<typeof formSchema>;

interface DemoBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoBookingModal({ open, onOpenChange }: DemoBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      unitsManaged: "",
      propertyTypes: [],
      aiFeature: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    console.log("Demo booking submitted:", data);
    
    setIsSubmitting(false);
    onOpenChange(false);
    form.reset();
    
    toast({
      title: "Thank you!",
      description: "Our team will contact you shortly to schedule your demo.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Book Your Personalized AI Demo</DialogTitle>
          <DialogDescription className="text-base">
            You're one step away. Fill out the form, and we'll show you exactly how our AI can
            streamline your operations, reduce costs, and save you time.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitsManaged"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How many units do you manage? *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-10">1 - 10 units</SelectItem>
                      <SelectItem value="11-50">11 - 50 units</SelectItem>
                      <SelectItem value="51-250">51 - 250 units</SelectItem>
                      <SelectItem value="250+">250+ units</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyTypes"
              render={() => (
                <FormItem>
                  <FormLabel>What types of properties do you manage? *</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {propertyTypes.map((type) => (
                      <FormField
                        key={type.id}
                        control={form.control}
                        name="propertyTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={type.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== type.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{type.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiFeature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Which AI feature are you most interested in? *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a feature" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="chatbot">24/7 AI Tenant Support Chatbot</SelectItem>
                      <SelectItem value="maintenance">Predictive Maintenance Insights</SelectItem>
                      <SelectItem value="screening">AI-Powered Tenant Screening</SelectItem>
                      <SelectItem value="reporting">Automated Financial Reporting</SelectItem>
                      <SelectItem value="pricing">Dynamic Rental Pricing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Book My Demo"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
