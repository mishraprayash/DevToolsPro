'use client';

import * as React from 'react';
import { Star, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type FeedbackType = 'general' | 'bug' | 'feature' | 'ui';

interface FeedbackForm {
  name: string;
  email: string;
  type: FeedbackType;
  rating: number;
  message: string;
}

const feedbackTypeOptions = [
  { value: 'general', label: 'General Feedback' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'ui', label: 'UI/UX Suggestion' },
];

export function FeedbackModal() {
  const { feedbackOpen, setFeedbackOpen } = useAppStore();
  
  const [form, setForm] = React.useState<FeedbackForm>({
    name: '',
    email: '',
    type: 'general',
    rating: 5,
    message: '',
  });

  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FeedbackForm, string>>>({});
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setFeedbackOpen(false);
    setTimeout(() => {
      setForm({
        name: '',
        email: '',
        type: 'general',
        rating: 5,
        message: '',
      });
      setErrors({});
      setSubmitted(false);
      setLoading(false);
    }, 200);
  }, [setFeedbackOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FeedbackForm, string>> = {};

    if (form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!form.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (form.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    if (form.rating < 1 || form.rating > 5) {
      newErrors.rating = 'Please select a rating between 1 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      setSubmitted(true);
      toast({
        type: 'success',
        message: 'Feedback submitted successfully! Thank you.',
      });

      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      toast({
        type: 'error',
        message: (err as Error).message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={feedbackOpen}
      onClose={handleClose}
      title="Share Your Feedback"
    >
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold font-outfit text-text-primary mb-2">Thank You!</h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Your feedback has been received. We appreciate you taking the time to help us improve DevTools Pro!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-outfit">
          <p className="text-xs text-text-secondary">
            Have a suggestion, found a bug, or want to request a new tool? Let us know below!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Name <span className="text-text-muted text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Email <span className="text-text-muted text-xs">(Optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. john@example.com"
                className={cn(
                  "w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200",
                  errors.email && "border-error focus:border-error focus:ring-error/30"
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-error flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Select
              label="Feedback Type"
              options={feedbackTypeOptions}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as FeedbackType })}
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Rating
              </label>
              <div className="flex items-center gap-1.5 h-10">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = hoveredRating !== null ? star <= hoveredRating : star <= form.rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, rating: star })}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="p-1 rounded-md text-text-muted hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 stroke-1.5 transition-all duration-150",
                          filled ? "fill-accent stroke-accent scale-110" : "text-text-muted"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              {errors.rating && (
                <p className="mt-1 text-xs text-error flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.rating}
                </p>
              )}
            </div>
          </div>

          <div>
            <Input
              label="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us what you think or describe the issue..."
              error={errors.message}
              className="min-h-[120px] text-sm"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-[11px] text-text-muted">
                Keep it constructive to help us make DevTools Pro better.
              </p>
              <p className={cn(
                "text-xs font-mono",
                form.message.length >= 10 ? "text-success" : "text-text-muted"
              )}>
                {form.message.length} chars
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={<Send className="h-4 w-4" />}
            >
              Submit Feedback
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
