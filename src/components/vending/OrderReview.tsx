import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Star, ArrowLeft, ThumbsUp, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine } from '@/types/vending';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VendingOrderData {
  id: string;
  order_number: string;
  dispensing_code: string;
  total_amount: number;
  created_at: string;
  items?: Array<{
    product: any;
    quantity: number;
    slotNumber: string;
  }>;
}

interface OrderReviewProps {
  machine: VendingMachine;
  orderData: VendingOrderData;
  onBack: () => void;
  onComplete: () => void;
}

const OrderReview: React.FC<OrderReviewProps> = ({
  machine,
  orderData,
  onBack,
  onComplete
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          machine_id: machine.id,
          order_id: orderData.id,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      setSubmitted(true);
      
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Auto-complete after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    onComplete();
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="container mx-auto max-w-md">
          <Card className="text-center">
            <CardContent className="pt-12 pb-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your review has been submitted successfully. We appreciate your feedback!
              </p>
              <Button onClick={onComplete} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10 p-4">
        <div className="container mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Rate Your Experience</h1>
              <p className="text-sm text-muted-foreground">
                Help us improve our service
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-md p-4 space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Completed</CardTitle>
            <CardDescription>
              Your order has been successfully completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Order Number:</span>
              <span className="font-mono text-sm">{orderData.order_number}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Machine:</span>
              <div className="text-right">
                <p className="text-sm font-medium">{machine.name}</p>
                <Badge variant="outline" className="text-xs">{machine.machine_code}</Badge>
              </div>
            </div>
            
            {orderData.items && orderData.items.length > 0 && (
              <>
                <Separator />
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-muted-foreground">
                        Slot {item.slotNumber} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-primary text-lg">₹{orderData.total_amount.toFixed(2)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <span>Completed at:</span>
              <span>{new Date(orderData.created_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Rating Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rate Your Experience</CardTitle>
            <CardDescription>
              How satisfied were you with your purchase?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    )}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground hover:text-yellow-400"
                      )}
                    />
                  </button>
                ))}
              </div>
              
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {getRatingText(rating)}
                </p>
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground">
                    You rated this experience {rating} out of 5 stars
                  </p>
                )}
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-3">
              <Label htmlFor="comment">
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Tell us more about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your feedback helps us improve our service quality
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Feedback Options */}
        {rating > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What went well?</CardTitle>
              <CardDescription>
                Select what you liked about your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Easy to use',
                  'Fast service',
                  'Good location',
                  'Product quality',
                  'Fair pricing',
                  'Machine reliability'
                ].map((feedback) => (
                  <Button
                    key={feedback}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (comment) {
                        setComment(comment + (comment.endsWith('.') ? ' ' : '. ') + feedback + '.');
                      } else {
                        setComment(feedback + '.');
                      }
                    }}
                    className="text-xs h-auto py-2"
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    {feedback}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmitReview}
            disabled={submitting || rating === 0}
            size="lg"
            className="w-full"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting Review...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Submit Review
              </div>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSkipReview}
            className="w-full"
          >
            Skip Review
          </Button>
        </div>

        {/* Privacy Notice */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground text-center">
              Your review may be used to improve our service quality. 
              Personal information will not be shared publicly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderReview;
