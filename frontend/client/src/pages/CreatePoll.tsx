import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CreatePoll() {
  const [step, setStep] = useState(1);
  const [options, setOptions] = useState(["", ""]);
  const [distribution, setDistribution] = useState("equal");
  const { toast } = useToast();

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  
  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCreate = () => {
    toast({
      title: "Poll Created!",
      description: "Your poll has been deployed to the Movement network.",
    });
  };

  const steps = [
    { id: 1, title: "Basic Info" },
    { id: 2, title: "Voting Options" },
    { id: 3, title: "Incentives" },
  ];

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Create New Poll</h1>
          <p className="text-muted-foreground">Design your survey and set incentives.</p>
        </div>
        <Button variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
          <Sparkles className="w-4 h-4" /> AI Assist
        </Button>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }} 
          />
          
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 font-bold text-sm",
                  step >= s.id 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-muted border-muted-foreground/20 text-muted-foreground"
                )}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors duration-300",
                step >= s.id ? "text-primary" : "text-muted-foreground"
              )}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 min-h-[400px]">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-right-8 duration-300">
            <CardHeader>
              <CardTitle>Step 1: Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title</Label>
                <Input id="title" placeholder="e.g., Ecosystem Grant Proposal #12" className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe what this poll is about..." className="bg-muted/30 min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="governance">Governance</SelectItem>
                      <SelectItem value="product">Product Research</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Hours</SelectItem>
                      <SelectItem value="3d">3 Days</SelectItem>
                      <SelectItem value="1w">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Voting Options */}
        {step === 2 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-right-8 duration-300">
            <CardHeader>
              <CardTitle>Step 2: Voting Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {options.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input placeholder={`Option ${index + 1}`} className="bg-muted/30" />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(index)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addOption} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Option
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Incentives */}
        {step === 3 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-right-8 duration-300">
            <CardHeader>
              <CardTitle>Step 3: Incentives (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Token Type</Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="move">MOVE</SelectItem>
                      <SelectItem value="usdc">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total Fund Amount</Label>
                  <Input type="number" placeholder="0.00" className="bg-muted/30" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Distribution Method</Label>
                <RadioGroup defaultValue="equal" onValueChange={setDistribution} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={cn(
                    "flex items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm cursor-pointer transition-all",
                    distribution === "equal" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}>
                    <RadioGroupItem value="equal" id="equal" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="equal" className="font-medium cursor-pointer">Equal Split</Label>
                      <p className="text-xs text-muted-foreground">
                        Total fund is divided equally among all participants when the poll closes.
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm cursor-pointer transition-all",
                    distribution === "fixed" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}>
                    <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="fixed" className="font-medium cursor-pointer">Fixed Amount</Label>
                      <p className="text-xs text-muted-foreground">
                        Each participant receives a fixed amount until the fund runs out.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Max Target Responders</Label>
                <Input type="number" placeholder="e.g. 1000" className="bg-muted/30" />
                <p className="text-xs text-muted-foreground">
                  Optional. The poll will automatically close when this number of responses is reached.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            disabled={step === 1}
            className={cn(step === 1 && "invisible")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              Launch Poll <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
