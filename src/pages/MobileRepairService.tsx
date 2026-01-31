import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Smartphone, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Calendar,
  IndianRupee,
  Shield,
  RefreshCw,
  Star,
  Phone,
  Plus,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { QuotationModal } from '@/components/repair/QuotationModal';
import { RepairStatusTracker } from '@/components/repair/RepairStatusTracker';
import { FeedbackModal } from '@/components/repair/FeedbackModal';
import { RepairRequestDialog } from '@/components/repair/RepairRequestDialog';

interface RepairRequest {
  id: string;
  request_id: string;
  customer_name: string;
  mobile_number: string;
  email?: string;
  device_type: string;
  brand: string;
  model: string;
  issue_types: string[];
  issue_description: string;
  service_type: string;
  address?: string;
  status: string;
  created_at: string;
  updated_at: string;
  repair_quotations?: {
    id: string;
    parts_cost: number;
    labour_charges: number;
    service_charges: number;
    total_amount: number;
    estimated_delivery_days: number;
    warranty_period_days: number;
    warranty_description?: string;
    admin_notes?: string;
    status: string;
    created_at: string;
  }[];
}

const STATUS_CONFIG = {
  'request_received': { label: 'Request Received', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  'inspection_pending': { label: 'Inspection Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'quotation_sent': { label: 'Quotation Sent', color: 'bg-purple-100 text-purple-800', icon: Eye },
  'quotation_approved': { label: 'Quotation Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'quotation_rejected': { label: 'Quotation Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  'repair_in_progress': { label: 'Repair In Progress', color: 'bg-orange-100 text-orange-800', icon: Clock },
  'repair_completed': { label: 'Repair Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'ready_for_delivery': { label: 'Ready for Delivery', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  'delivered': { label: 'Delivered', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const ISSUE_LABELS = {
  'screen_broken': 'Screen Broken/Cracked',
  'battery_issue': 'Battery Issue',
  'charging_problem': 'Charging Problem',
  'speaker_mic': 'Speaker/Microphone Issue',
  'water_damage': 'Water Damage',
  'software_issue': 'Software Problem',
  'camera_issue': 'Camera Not Working',
  'network_issue': 'Network/Signal Problem',
  'other': 'Other Issue'
};

export default function MobileRepairService() {
  const { user } = useAuth();
  
  // My Requests State
  const [myRequests, setMyRequests] = useState<RepairRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequestForFeedback, setSelectedRequestForFeedback] = useState<RepairRequest | null>(null);
  const [showRepairRequestDialog, setShowRepairRequestDialog] = useState(false);

  // Fetch user's repair requests
  const fetchMyRequests = async () => {
    if (!user) return;
    
    setRequestsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('repair_requests')
        .select(`
          *,
          repair_quotations (*)
        `)
        .or(`user_id.eq.${user.id},mobile_number.eq.${user.user_metadata?.phone}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching repair requests:', error);
      toast.error('Failed to load repair requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  // Load requests when user changes
  useEffect(() => {
    if (user) {
      fetchMyRequests();
    }
  }, [user]);

  const handleRepairRequestSuccess = (requestId: string) => {
    setShowRepairRequestDialog(false);
    toast.success(`Repair request ${requestId} submitted successfully!`);
    fetchMyRequests(); // Refresh the requests list
  };

  const handleQuotationResponse = async (quotationId: string, action: 'approve' | 'reject') => {
    try {
      const { error: quotationError } = await (supabase as any)
        .from('repair_quotations')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          customer_response_at: new Date().toISOString()
        })
        .eq('id', quotationId);

      if (quotationError) throw quotationError;

      const { error: requestError } = await (supabase as any)
        .from('repair_requests')
        .update({
          status: action === 'approve' ? 'quotation_approved' : 'quotation_rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedQuotation.repair_request_id);

      if (requestError) throw requestError;

      // Log status change
      await (supabase as any)
        .from('repair_status_logs')
        .insert({
          repair_request_id: selectedQuotation.repair_request_id,
          old_status: 'quotation_sent',
          new_status: action === 'approve' ? 'quotation_approved' : 'quotation_rejected',
          change_reason: `Customer ${action}ed the quotation`
        });

      toast.success(`Quotation ${action}ed successfully!`);
      setShowQuotationModal(false);
      fetchMyRequests();
    } catch (error: any) {
      console.error('Error updating quotation:', error);
      toast.error(`Failed to ${action} quotation`);
    }
  };

  const contactSupport = () => {
    toast.info('Support contact: +91-XXXXXXXXXX');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Smartphone className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mobile Repair Service</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Track your mobile repair requests and get professional service from certified technicians.
          </p>
          
          {/* Book Repair Service Button */}
          <Button 
            onClick={() => setShowRepairRequestDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            Book Repair Service
          </Button>
        </div>

        {/* My Requests Section */}
        {!user ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h3>
              <p className="text-gray-600 mb-6">Please login to view your repair requests.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Header with refresh */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Repair Requests</h2>
                <p className="text-gray-600">Track your mobile repair service requests</p>
              </div>
              <Button
                variant="outline"
                onClick={fetchMyRequests}
                disabled={requestsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${requestsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {requestsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your repair requests...</p>
              </div>
            ) : myRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Repair Requests</h3>
                  <p className="text-gray-600 mb-6">You haven't submitted any repair requests yet.</p>
                  <Button onClick={() => setShowRepairRequestDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit New Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {myRequests.map((request) => {
                  const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || AlertCircle;
                  const quotation = request.repair_quotations?.[0];

                  return (
                    <Card key={request.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              Request #{request.request_id}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {request.brand} {request.model} ({request.device_type})
                            </p>
                          </div>
                          <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig?.label || request.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Request Details */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Issue Details</h4>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {request.issue_types.map((issue) => (
                                  <Badge key={issue} variant="secondary" className="text-xs">
                                    {ISSUE_LABELS[issue as keyof typeof ISSUE_LABELS] || issue}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm text-gray-600">{request.issue_description}</p>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(request.created_at)}
                              </div>
                              {request.service_type === 'doorstep' && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  Doorstep Service
                                </div>
                              )}
                            </div>

                            {/* Status Tracker */}
                            <RepairStatusTracker
                              currentStatus={request.status}
                              createdAt={request.created_at}
                              updatedAt={request.updated_at}
                              estimatedDelivery={quotation?.estimated_delivery_days}
                              onContactSupport={contactSupport}
                              onLeaveFeedback={
                                request.status === 'delivered' 
                                  ? () => {
                                      setSelectedRequestForFeedback(request);
                                      setShowFeedbackModal(true);
                                    }
                                  : undefined
                              }
                            />
                          </div>

                          {/* Quotation Details */}
                          <div className="space-y-4">
                            {quotation ? (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Quotation Details</h4>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Total Amount</span>
                                    <span className="text-lg font-bold text-blue-600 flex items-center">
                                      <IndianRupee className="h-4 w-4" />
                                      {quotation.total_amount.toFixed(2)}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1 text-xs text-gray-600">
                                    <div className="flex justify-between">
                                      <span>Parts Cost:</span>
                                      <span>₹{quotation.parts_cost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Labour Charges:</span>
                                      <span>₹{quotation.labour_charges.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Service Charges:</span>
                                      <span>₹{quotation.service_charges.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <Separator className="my-2" />

                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {quotation.estimated_delivery_days} days
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Shield className="h-3 w-3" />
                                      {quotation.warranty_period_days} days warranty
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                {request.status === 'quotation_sent' && quotation.status === 'sent' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedQuotation({ ...quotation, repair_request_id: request.id });
                                        setShowQuotationModal(true);
                                      }}
                                      className="flex-1"
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Review Quotation
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Quotation pending</p>
                              </div>
                            )}

                            {/* Quick Actions */}
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={contactSupport}
                                className="w-full"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Contact Support
                              </Button>
                              
                              {request.status === 'delivered' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequestForFeedback(request);
                                    setShowFeedbackModal(true);
                                  }}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Leave Feedback
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Repair Request Dialog */}
        <RepairRequestDialog
          open={showRepairRequestDialog}
          onClose={() => setShowRepairRequestDialog(false)}
          onSuccess={handleRepairRequestSuccess}
        />

        {/* Quotation Modal */}
        {showQuotationModal && selectedQuotation && (
          <QuotationModal
            quotation={selectedQuotation}
            onClose={() => setShowQuotationModal(false)}
            onApprove={() => handleQuotationResponse(selectedQuotation.id, 'approve')}
            onReject={() => handleQuotationResponse(selectedQuotation.id, 'reject')}
          />
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && selectedRequestForFeedback && (
          <FeedbackModal
            repairRequest={selectedRequestForFeedback}
            onClose={() => {
              setShowFeedbackModal(false);
              setSelectedRequestForFeedback(null);
            }}
            onSuccess={() => {
              setShowFeedbackModal(false);
              setSelectedRequestForFeedback(null);
              toast.success('Thank you for your valuable feedback!');
            }}
          />
        )}
      </div>
    </div>
  );
}