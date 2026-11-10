import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { calculateBookPricing, type ActiveCampaignInfo, type PricingResult } from '@/lib/campaignUtils';

interface CampaignContextValue {
  campaign: ActiveCampaignInfo | null;
  isActive: boolean;
  discountPercent: number;
  getPricing: (price: number | string | null | undefined, originalPrice?: number | string | null | undefined) => PricingResult;
  activateCampaign: (name: string, discountPercent: number) => Promise<void>;
  deactivateCampaign: () => Promise<void>;
  refetch: () => void;
  isLoading: boolean;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch active campaign from backend API
  const { data, refetch, isLoading } = useQuery<{ isActive: boolean; campaign: ActiveCampaignInfo | null }>({
    queryKey: ['active-campaign'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/campaign/active');
        if (!res.ok) throw new Error('Failed to load campaign');
        return await res.json();
      } catch {
        return { isActive: false, campaign: null };
      }
    },
    staleTime: 15 * 1000,       // 15 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });

  const campaign = data?.isActive && data?.campaign ? data.campaign : null;
  const isActive = !!campaign;
  const discountPercent = campaign?.discountPercent ?? 0;

  const getPricing = useCallback(
    (price: number | string | null | undefined, originalPrice?: number | string | null | undefined): PricingResult => {
      return calculateBookPricing(price, originalPrice, campaign);
    },
    [campaign]
  );

  // Activate Campaign Mutation
  const activateMutation = useMutation({
    mutationFn: async ({ name, discountPercent }: { name: string; discountPercent: number }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Authentication required');

      const res = await fetch('/api/campaign/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, discountPercent }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to activate campaign');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-campaign'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  // Deactivate Campaign Mutation
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Authentication required');

      const res = await fetch('/api/campaign/deactivate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to deactivate campaign');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-campaign'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const activateCampaign = useCallback(
    async (name: string, pct: number) => {
      await activateMutation.mutateAsync({ name, discountPercent: pct });
    },
    [activateMutation]
  );

  const deactivateCampaign = useCallback(async () => {
    await deactivateMutation.mutateAsync();
  }, [deactivateMutation]);

  return (
    <CampaignContext.Provider
      value={{
        campaign,
        isActive,
        discountPercent,
        getPricing,
        activateCampaign,
        deactivateCampaign,
        refetch,
        isLoading,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider');
  return ctx;
}

