import { supabase } from '../supabase';

export interface Event {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
  max_attendees: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_profile: {
    full_name: string;
    avatar_url?: string;
  };
  attendee_count?: number;
  user_rsvp_status?: 'going' | 'maybe' | 'not_going' | null;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  created_at: string;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Fetch events for a community
 */
export const fetchEvents = async (
  communityId: string,
  userId?: string
): Promise<Event[]> => {
  // Fetch events from today onwards (not just future)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  // Fetch events
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('community_id', communityId)
    .gte('event_date', today.toISOString()) // Events from start of today
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  if (!events || events.length === 0) {
    return [];
  }

  // Fetch creator profiles
  const creatorIds = [...new Set(events.map((e) => e.created_by))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', creatorIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Fetch RSVP counts and user's RSVP status
  const eventIds = events.map((e) => e.id);
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('event_id, user_id, status')
    .in('event_id', eventIds);

  // Create maps for attendee counts and user RSVP status
  const attendeeCountMap = new Map<string, number>();
  const userRsvpMap = new Map<string, 'going' | 'maybe' | 'not_going'>();

  rsvps?.forEach((rsvp) => {
    if (rsvp.status === 'going') {
      attendeeCountMap.set(rsvp.event_id, (attendeeCountMap.get(rsvp.event_id) || 0) + 1);
    }
    if (userId && rsvp.user_id === userId) {
      userRsvpMap.set(rsvp.event_id, rsvp.status);
    }
  });

  // Merge events with profiles and counts
  return events.map((event) => ({
    ...event,
    creator_profile: profileMap.get(event.created_by) || {
      full_name: 'Unknown',
      avatar_url: undefined,
    },
    attendee_count: attendeeCountMap.get(event.id) || 0,
    user_rsvp_status: userRsvpMap.get(event.id) || null,
  }));
};

/**
 * Fetch past events for a community
 */
export const fetchPastEvents = async (communityId: string): Promise<Event[]> => {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('community_id', communityId)
    .lt('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching past events:', error);
    throw error;
  }

  if (!events || events.length === 0) {
    return [];
  }

  // Fetch creator profiles
  const creatorIds = [...new Set(events.map((e) => e.created_by))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', creatorIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return events.map((event) => ({
    ...event,
    creator_profile: profileMap.get(event.created_by) || {
      full_name: 'Unknown',
      avatar_url: undefined,
    },
  }));
};

/**
 * Create a new event
 */
export const createEvent = async (
  communityId: string,
  userId: string,
  eventData: {
    title: string;
    description: string;
    event_date: string;
    end_date?: string;
    location?: string;
    max_attendees?: number;
  }
): Promise<Event> => {
  const { data, error } = await supabase
    .from('events')
    .insert({
      community_id: communityId,
      created_by: userId,
      ...eventData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  // Fetch creator profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  return {
    ...data,
    creator_profile: profile || { full_name: 'Unknown', avatar_url: undefined },
    attendee_count: 0,
    user_rsvp_status: null,
  };
};

/**
 * Update an event
 */
export const updateEvent = async (
  eventId: string,
  updates: Partial<Event>
): Promise<void> => {
  const { error } = await supabase.from('events').update(updates).eq('id', eventId);

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * RSVP to an event
 */
export const rsvpToEvent = async (
  eventId: string,
  userId: string,
  status: 'going' | 'maybe' | 'not_going'
): Promise<void> => {
  const { error } = await supabase.from('event_rsvps').upsert(
    {
      event_id: eventId,
      user_id: userId,
      status,
    },
    {
      onConflict: 'event_id,user_id',
    }
  );

  if (error) {
    console.error('Error RSVPing to event:', error);
    throw error;
  }
};

/**
 * Fetch attendees for an event
 */
export const fetchEventAttendees = async (eventId: string): Promise<EventRSVP[]> => {
  // Fetch RSVPs
  const { data: rsvps, error } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'going')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching attendees:', error);
    throw error;
  }

  if (!rsvps || rsvps.length === 0) {
    return [];
  }

  // Fetch profiles
  const userIds = rsvps.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return rsvps.map((rsvp) => ({
    ...rsvp,
    profile: profileMap.get(rsvp.user_id) || {
      full_name: 'Unknown',
      avatar_url: undefined,
    },
  }));
};

