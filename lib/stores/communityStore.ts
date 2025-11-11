import { create } from 'zustand';

export interface Community {
  id: string;
  name: string;
  description: string;
  short_description: string;
  image_url: string;
  admin_id: string;
  member_count: number;
  created_at: string;
}

interface CommunityState {
  communities: Community[];
  myCommunities: Community[];
  loading: boolean;
  setCommunities: (communities: Community[]) => void;
  setMyCommunities: (communities: Community[]) => void;
  setLoading: (loading: boolean) => void;
  addCommunity: (community: Community) => void;
  removeCommunity: (id: string) => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  communities: [],
  myCommunities: [],
  loading: false,

  setCommunities: (communities) => set({ communities }),
  setMyCommunities: (communities) => set({ myCommunities: communities }),
  setLoading: (loading) => set({ loading }),

  addCommunity: (community) =>
    set((state) => ({ communities: [...state.communities, community] })),

  removeCommunity: (id) =>
    set((state) => ({
      communities: state.communities.filter((c) => c.id !== id),
      myCommunities: state.myCommunities.filter((c) => c.id !== id),
    })),
}));

