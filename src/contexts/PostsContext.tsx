import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClients, type Post, type PostFormat, type FunnelStage } from "@/data/posts";

export interface ClientFormData {
  name: string;
  instagramHandle?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  gmbUrl?: string;
  objective?: string;
  avatarUrl?: string;
  niche?: string;
  targetAudience?: string;
  toneOfVoice?: string;
  differentials?: string;
  productsServices?: string;
  postingFrequency?: string;
  brandValues?: string;
  currentSocialPresence?: string;
  competitors?: string[];
  websiteUrl?: string;
  ticketMedio?: number;
  verbaMensal?: number;
  platforms?: string[];
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

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [analystNames, setAnalystNames] = useState<string[]>([]);
  const [registeredClients, setRegisteredClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("date", { ascending: true });

    if (!error && data) {
      const mapped: Post[] = data.map((row) => ({
        id: row.id,
        client: row.client,
        analyst: row.analyst,
        title: row.title,
        headline: row.headline,
        format: row.format as PostFormat,
        funnelStage: row.funnel_stage as FunnelStage,
        date: row.date,
        hashtags: row.hashtags || [],
        legend: row.legend ?? undefined,
        artUrl: (row as any).art_url ?? undefined,
        artUrls: (row as any).art_urls ?? [],
        channels: (row as any).channels ?? [],
        reference: (row as any).reference ?? undefined,
      }));
      setPosts(mapped);
    }
  }, []);

  const fetchAnalysts = useCallback(async () => {
    const { data, error } = await supabase
      .from("analysts")
      .select("name")
      .order("name");

    if (!error && data) {
      setAnalystNames(data.map((a) => a.name));
    }
  }, []);

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("name")
      .order("name");

    if (!error && data) {
      setRegisteredClients(data.map((c) => c.name));
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPosts(), fetchAnalysts(), fetchClients()]).then(() => setLoading(false));
  }, [fetchPosts, fetchAnalysts, fetchClients]);

  // Merge clients from posts + registered clients table
  const clientsFromPosts = getClients(posts);
  const clients = [...new Set([...registeredClients, ...clientsFromPosts])].sort();
  const analysts = analystNames;

  const addPost = useCallback(async (post: Omit<Post, "id">) => {
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
    if (!error) await fetchPosts();
  }, [fetchPosts]);

  const addPosts = useCallback(async (newPosts: Omit<Post, "id">[]) => {
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
    if (!error) await fetchPosts();
  }, [fetchPosts]);

  const updatePostDate = useCallback(async (postId: string, newDate: string) => {
    const { error } = await supabase.from("posts").update({ date: newDate }).eq("id", postId);
    if (!error) await fetchPosts();
  }, [fetchPosts]);

  const updatePostArt = useCallback(async (postId: string, artUrl: string | null) => {
    const { error } = await supabase.from("posts").update({ art_url: artUrl } as any).eq("id", postId);
    if (!error) await fetchPosts();
  }, [fetchPosts]);

  const updatePost = useCallback(async (postId: string, fields: Partial<Omit<Post, "id">>) => {
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
    const { error } = await supabase.from("posts").update(dbFields as any).eq("id", postId);
    if (!error) await fetchPosts();
  }, [fetchPosts]);

  const deletePost = useCallback(async (postId: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) await fetchPosts();
  }, [fetchPosts]);

  const addAnalyst = useCallback(async (name: string) => {
    const { error } = await supabase.from("analysts").insert({ name });
    if (error) throw error;
    await fetchAnalysts();
  }, [fetchAnalysts]);

  const updateAnalyst = useCallback(async (oldName: string, newName: string) => {
    const { error } = await supabase.from("analysts").update({ name: newName }).eq("name", oldName);
    if (error) throw error;
    await fetchAnalysts();
  }, [fetchAnalysts]);

  const removeAnalyst = useCallback(async (name: string) => {
    const { error } = await supabase.from("analysts").delete().eq("name", name);
    if (!error) await fetchAnalysts();
  }, [fetchAnalysts]);

  const addClient = useCallback(async (data: ClientFormData) => {
    const { error } = await supabase.from("clients").insert({
      name: data.name,
      instagram_handle: data.instagramHandle || null,
      facebook_url: data.facebookUrl || null,
      linkedin_url: data.linkedinUrl || null,
      gmb_url: data.gmbUrl || null,
      objective: data.objective || null,
      avatar_url: data.avatarUrl || null,
      niche: data.niche || null,
      target_audience: data.targetAudience || null,
      tone_of_voice: data.toneOfVoice || null,
      differentials: data.differentials || null,
      products_services: data.productsServices || null,
      posting_frequency: data.postingFrequency || null,
      brand_values: data.brandValues || null,
      current_social_presence: data.currentSocialPresence || null,
      competitors: data.competitors?.length ? data.competitors : null,
    } as any);
    if (error) throw error;
    await fetchClients();
  }, [fetchClients]);

  const deleteClient = useCallback(async (name: string) => {
    const { error } = await supabase.from("clients").delete().eq("name", name);
    if (error) throw error;
    await fetchClients();
  }, [fetchClients]);

  return (
    <PostsContext.Provider value={{ posts, clients, analysts, loading, addPost, addPosts, updatePostDate, updatePostArt, updatePost, deletePost, addAnalyst, updateAnalyst, removeAnalyst, addClient, deleteClient }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
