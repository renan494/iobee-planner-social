import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getClients, type Post, type PostFormat, type FunnelStage, type InstagramStatus } from "@/data/posts";

export interface ClientFormData {
  name: string;
  instagramHandle?: string;
  objective?: string;
  avatarUrl?: string;
  niche?: string;
  targetAudience?: string;
  audiencePains?: string;
  toneOfVoice?: string;
  differentials?: string;
  productsServices?: string;
  postingFrequency?: string;
  brandValues?: string;
  currentSocialPresence?: string;
  competitors?: string[];
  socialNetworks?: string[];
  contentPillars?: string;
  mainOffer?: string;
  ctaPreferences?: string;
  bannedTopics?: string;
  successReferences?: string;
  hashtagsBase?: string;
}

interface PostsContextType {
  posts: Post[];
  clients: string[];
  analysts: string[];
  loading: boolean;
  addPost: (post: Omit<Post, "id">) => Promise<void>;
  addPosts: (posts: Omit<Post, "id">[]) => Promise<void>;
  updatePostDate: (postId: string, newDate: string) => Promise<void>;
  updatePostArt: (postId: string, artUrl: string | null) => Promise<void>;
  updatePost: (postId: string, fields: Partial<Omit<Post, "id">>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  addAnalyst: (name: string) => Promise<void>;
  updateAnalyst: (oldName: string, newName: string) => Promise<void>;
  removeAnalyst: (name: string) => Promise<void>;
  addClient: (data: ClientFormData) => Promise<void>;
  deleteClient: (name: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | null>(null);

// Shared query keys — pages can also useQuery directly with these keys to read from cache.
export const POSTS_QUERY_KEY = ["posts"] as const;
export const ANALYSTS_QUERY_KEY = ["analysts"] as const;
export const CLIENTS_QUERY_KEY = ["clients"] as const;

async function fetchPostsFn(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    client: row.client,
    analyst: row.analyst,
    title: row.title,
    headline: row.headline,
    format: row.format as PostFormat,
    funnelStage: row.funnel_stage as FunnelStage,
    date: row.date,
    scheduledTime: ((row as any).scheduled_time as string | null)?.slice(0, 5) ?? "09:00",
    autoPublishInstagram: (row as any).auto_publish_instagram ?? false,
    instagramStatus: ((row as any).instagram_status as InstagramStatus | null) ?? null,
    hashtags: row.hashtags || [],
    legend: row.legend ?? undefined,
    artUrl: (row as any).art_url ?? undefined,
    artUrls: (row as any).art_urls ?? [],
    channels: (row as any).channels ?? [],
    reference: (row as any).reference ?? undefined,
  }));
}

async function fetchAnalystsFn(): Promise<string[]> {
  const { data, error } = await supabase.from("analysts").select("name").order("name");
  if (error) throw error;
  return (data ?? []).map((a) => a.name);
}

async function fetchClientsFn(): Promise<string[]> {
  const { data, error } = await supabase.from("clients").select("name").order("name");
  if (error) throw error;
  return (data ?? []).map((c) => c.name);
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const postsQuery = useQuery({
    queryKey: POSTS_QUERY_KEY,
    queryFn: fetchPostsFn,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const analystsQuery = useQuery({
    queryKey: ANALYSTS_QUERY_KEY,
    queryFn: fetchAnalystsFn,
    staleTime: 5 * 60_000,
  });
  const clientsQuery = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: fetchClientsFn,
    staleTime: 5 * 60_000,
  });

  const posts = postsQuery.data ?? [];
  const analystNames = analystsQuery.data ?? [];
  const registeredClients = clientsQuery.data ?? [];

  const clients = useMemo(() => {
    const fromPosts = getClients(posts);
    return [...new Set([...registeredClients, ...fromPosts])].sort();
  }, [posts, registeredClients]);

  const invalidatePosts = useCallback(() => {
    qc.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
  }, [qc]);
  const invalidateAnalysts = useCallback(() => {
    qc.invalidateQueries({ queryKey: ANALYSTS_QUERY_KEY });
  }, [qc]);
  const invalidateClients = useCallback(() => {
    qc.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
  }, [qc]);

  const addPostMut = useMutation({
    mutationFn: async (post: Omit<Post, "id">) => {
      const { error } = await supabase.from("posts").insert({
        client: post.client,
        analyst: post.analyst,
        title: post.title,
        headline: post.headline,
        format: post.format,
        funnel_stage: post.funnelStage,
        date: post.date,
        hashtags: post.hashtags,
        legend: post.legend || null,
        art_url: post.artUrl || null,
        art_urls: post.artUrls || [],
        channels: post.channels || [],
        reference: post.reference || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: invalidatePosts,
  });

  const addPostsMut = useMutation({
    mutationFn: async (newPosts: Omit<Post, "id">[]) => {
      const rows = newPosts.map((p) => ({
        client: p.client,
        analyst: p.analyst,
        title: p.title,
        headline: p.headline,
        format: p.format,
        funnel_stage: p.funnelStage,
        date: p.date,
        hashtags: p.hashtags,
        legend: p.legend || null,
        art_url: p.artUrl || null,
        art_urls: p.artUrls || [],
        channels: p.channels || [],
        reference: p.reference || null,
      } as any));
      const { error } = await supabase.from("posts").insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidatePosts,
  });

  const updatePostDateMut = useMutation({
    mutationFn: async ({ postId, newDate }: { postId: string; newDate: string }) => {
      const { error } = await supabase.from("posts").update({ date: newDate }).eq("id", postId);
      if (error) throw error;
    },
    onMutate: async ({ postId, newDate }) => {
      await qc.cancelQueries({ queryKey: POSTS_QUERY_KEY });
      const prev = qc.getQueryData<Post[]>(POSTS_QUERY_KEY);
      if (prev) {
        qc.setQueryData<Post[]>(POSTS_QUERY_KEY, prev.map((p) => p.id === postId ? { ...p, date: newDate } : p));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(POSTS_QUERY_KEY, ctx.prev);
    },
    onSettled: invalidatePosts,
  });

  const updatePostArtMut = useMutation({
    mutationFn: async ({ postId, artUrl }: { postId: string; artUrl: string | null }) => {
      const { error } = await supabase.from("posts").update({ art_url: artUrl } as any).eq("id", postId);
      if (error) throw error;
    },
    onSuccess: invalidatePosts,
  });

  const updatePostMut = useMutation({
    mutationFn: async ({ postId, fields }: { postId: string; fields: Partial<Omit<Post, "id">> }) => {
      const dbFields: Record<string, unknown> = {};
      if (fields.title !== undefined) dbFields.title = fields.title;
      if (fields.headline !== undefined) dbFields.headline = fields.headline;
      if (fields.legend !== undefined) dbFields.legend = fields.legend || null;
      if (fields.format !== undefined) dbFields.format = fields.format;
      if (fields.funnelStage !== undefined) dbFields.funnel_stage = fields.funnelStage;
      if (fields.date !== undefined) dbFields.date = fields.date;
      if (fields.hashtags !== undefined) dbFields.hashtags = fields.hashtags;
      if (fields.client !== undefined) dbFields.client = fields.client;
      if (fields.analyst !== undefined) dbFields.analyst = fields.analyst;
      if (fields.channels !== undefined) dbFields.channels = fields.channels;
      if (fields.reference !== undefined) dbFields.reference = fields.reference || null;
      if (fields.scheduledTime !== undefined) {
        // garante formato HH:MM:SS para o tipo TIME do Postgres
        const t = fields.scheduledTime;
        dbFields.scheduled_time = t ? (t.length === 5 ? `${t}:00` : t) : "09:00:00";
      }
      if (fields.autoPublishInstagram !== undefined) dbFields.auto_publish_instagram = fields.autoPublishInstagram;
      if (fields.instagramStatus !== undefined) dbFields.instagram_status = fields.instagramStatus;
      const { error } = await supabase.from("posts").update(dbFields as any).eq("id", postId);
      if (error) throw error;
    },
    onSuccess: invalidatePosts,
  });

  const deletePostMut = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: invalidatePosts,
  });

  const addAnalystMut = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("analysts").insert({ name });
      if (error) throw error;
    },
    onSuccess: invalidateAnalysts,
  });

  const updateAnalystMut = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const { error } = await supabase.from("analysts").update({ name: newName }).eq("name", oldName);
      if (error) throw error;
    },
    onSuccess: invalidateAnalysts,
  });

  const removeAnalystMut = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("analysts").delete().eq("name", name);
      if (error) throw error;
    },
    onSuccess: invalidateAnalysts,
  });

  const addClientMut = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const { error } = await supabase.from("clients").insert({
        name: data.name,
        instagram_handle: data.instagramHandle || null,
        objective: data.objective || null,
        avatar_url: data.avatarUrl || null,
        niche: data.niche || null,
        target_audience: data.targetAudience || null,
        audience_pains: data.audiencePains || null,
        tone_of_voice: data.toneOfVoice || null,
        differentials: data.differentials || null,
        products_services: data.productsServices || null,
        posting_frequency: data.postingFrequency || null,
        brand_values: data.brandValues || null,
        current_social_presence: data.currentSocialPresence || null,
        competitors: data.competitors?.length ? data.competitors : null,
        social_networks: data.socialNetworks?.length ? data.socialNetworks : null,
        content_pillars: data.contentPillars || null,
        main_offer: data.mainOffer || null,
        cta_preferences: data.ctaPreferences || null,
        banned_topics: data.bannedTopics || null,
        success_references: data.successReferences || null,
        hashtags_base: data.hashtagsBase || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: invalidateClients,
  });

  const deleteClientMut = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("clients").delete().eq("name", name);
      if (error) throw error;
    },
    onSuccess: invalidateClients,
  });

  const value = useMemo<PostsContextType>(() => ({
    posts,
    clients,
    analysts: analystNames,
    loading: postsQuery.isLoading,
    addPost: (p) => addPostMut.mutateAsync(p).then(() => undefined),
    addPosts: (p) => addPostsMut.mutateAsync(p).then(() => undefined),
    updatePostDate: (postId, newDate) => updatePostDateMut.mutateAsync({ postId, newDate }).then(() => undefined),
    updatePostArt: (postId, artUrl) => updatePostArtMut.mutateAsync({ postId, artUrl }).then(() => undefined),
    updatePost: (postId, fields) => updatePostMut.mutateAsync({ postId, fields }).then(() => undefined),
    deletePost: (postId) => deletePostMut.mutateAsync(postId).then(() => undefined),
    addAnalyst: (name) => addAnalystMut.mutateAsync(name).then(() => undefined),
    updateAnalyst: (oldName, newName) => updateAnalystMut.mutateAsync({ oldName, newName }).then(() => undefined),
    removeAnalyst: (name) => removeAnalystMut.mutateAsync(name).then(() => undefined),
    addClient: (data) => addClientMut.mutateAsync(data).then(() => undefined),
    deleteClient: (name) => deleteClientMut.mutateAsync(name).then(() => undefined),
  }), [posts, clients, analystNames, postsQuery.isLoading, addPostMut, addPostsMut, updatePostDateMut, updatePostArtMut, updatePostMut, deletePostMut, addAnalystMut, updateAnalystMut, removeAnalystMut, addClientMut, deleteClientMut]);

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
