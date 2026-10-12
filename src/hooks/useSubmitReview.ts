import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ReviewItem } from '../types';

export interface SubmitReviewPayload {
  toiletId: string;
  userName: string;
  cleanlinessRating: number;
  comment?: string;
  photos?: string[];
}

export function useSubmitReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = async (payload: SubmitReviewPayload): Promise<ReviewItem | null> => {
    setIsSubmitting(true);
    setError(null);

    const localItem: ReviewItem = {
      id: 'rev-' + Date.now(),
      userName: payload.userName,
      date: new Date().toISOString().split('T')[0],
      overallRating: payload.cleanlinessRating,
      ratings: {
        cleanliness: payload.cleanlinessRating,
        facilities: 5,
        accessibility: 5,
        safety_privacy: 5,
        convenience: 5,
        value: 5,
      },
      comment: payload.comment || 'สะอาด สะดวก สบายใจ',
      isVerifiedVisit: true,
    };

    if (!isSupabaseConfigured) {
      setIsSubmitting(false);
      return localItem;
    }

    try {
      // If toiletId is local mock format (e.g. 'rest-001'), don't send to UUID field in Supabase
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.toiletId);

      if (isUuid) {
        const { data, error: insertError } = await supabase
          .from('reviews')
          .insert({
            toilet_id: payload.toiletId,
            user_name: payload.userName,
            cleanliness_rating: Math.round(payload.cleanlinessRating),
            comment: payload.comment || '',
            photos: payload.photos || [],
            is_verified_visit: true,
          })
          .select()
          .single();

        if (insertError) {
          console.warn('Failed to insert review to Supabase:', insertError);
        } else if (data) {
          localItem.id = data.id;
        }
      }

      return localItem;
    } catch (err: any) {
      console.warn('Review submit error:', err.message);
      setError(err.message);
      return localItem;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitReview, isSubmitting, error };
}
