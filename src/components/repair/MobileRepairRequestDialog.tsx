import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MultipleImageUpload } from '@/components/ui/MultipleImageUpload';
import { UPLOAD_SOURCES } from '@/services/storageTrackingService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Smartphone, 
  Wrench, 
  MapPin, 
  Upload, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { RepairNotificationService } from '@/services/repairNotificationService';

interface MobileRepairRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RepairFormData {
  customer_name: string;
  mobile_number: string;
  email: string;
  device_type: 'android' | 'iphone' | '';
  brand: string;
  model: string;
  issue_types: string[];
  issue_description: string;
  other_issue: string;
  service_type: 'doorstep' | 'service_center' | '';
  address: string;
  preferred_time_slot: string;
}

const ISSUE_TYPES = [
  { id: 'screen_broken', label: 'Screen Broken/Cracked' },
  { id: 'battery_issue', label: 'Battery Issue' },
  { id: 'charging_problem', label: 'Charging Problem' },
  { id: 'speaker_mic', label: 'Speaker/Microphone Issue' },
  { id: 'water_damage', label: 'Water Damage' },
  { id: 'software_issue', label: 'Software Problem' },
  { id: 'camera_issue', label: 'Camera Not Working' },
  { id: 'network_issue', label: 'Network/Signal Problem' },
  { id: 'other', label: 'Other Issue' }
];

const BRANDS = {
  android: ['Samsung', 'Xiaomi', 'Redmi', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Motorola', 'Nokia', 'Other'],
  iphone: ['Apple iPhone']
};

const TIME_SLOTS = [
  'Morning (9 AM - 12 PM)',
  'Afternoon (12 PM - 4 PM)', 
  'Evening (4 PM - 8 PM)',
  'Flexible Timing'
];

export const MobileRepairRequestDialog = ({ open, onOpenChange }: MobileRepairRequestDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deviceImages, setDeviceImages] = useState<any[]>([]);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<RepairFormData>({
    customer_name: user?.user_metadata?.full_name || '',
    mobile_number: user?.user_metadata?.phone || '',
    email: user?.email || '',
    device_type: '',
    brand: '',
    model: '',
    issue_types: [],
    issue_description: '',
    other_issue: '',
    service_type: '',
    address: '',
    preferred_time_slot: ''
  });

  const handleIssueTypeChange = (issueType: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        issue_types: [...prev.issue_types, issueType]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        issue_types: prev.issue_types.filter(type => type !== issueType)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customer_name || !formData.mobile_number || !formData.device_type || 
        !formData.brand || !formData.model || formData.issue_types.length === 0 ||