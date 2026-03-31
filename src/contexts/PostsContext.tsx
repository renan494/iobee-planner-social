import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { samplePosts, getClients, getAnalysts, type Post } from "@/data/posts";

interface PostsContextType {
  posts: Post[];
  clients: string[];
  analysts: string[];
  addPost: (post: Post) => void;
  addPosts: (posts: Post[]) => void;
  updatePostDate: (postId: string, newDate: string) => void;
  deletePost: (postId: string) => void;
  addAnalyst: (name: string) => void;
  removeAnalyst: (name: string) => void;
}

const PostsContext = createContext<PostsContextType | null>(null);

const DEFAULT_ANALYSTS = ["Maria Julya", "Julia"];

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("iobee-posts");
    return saved ? JSON.parse(saved) : samplePosts;
  });

  const [extraAnalysts, setExtraAnalysts] = useState<string[]>(() => {
    const saved = localStorage.getItem("iobee-analysts");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("iobee-posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("iobee-analysts", JSON.stringify(extraAnalysts));
  }, [extraAnalysts]);

  const clients = useMemo(() => getClients(posts), [posts]);
  const analysts = useMemo(() => {
    const fromPosts = getAnalysts(posts);
    const all = [...new Set([...DEFAULT_ANALYSTS, ...extraAnalysts, ...fromPosts])];
    return all.sort();
  }, [posts, extraAnalysts]);

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [...prev, post]);
  }, []);

  const addPosts = useCallback((newPosts: Post[]) => {
    setPosts((prev) => [...prev, ...newPosts]);
  }, []);

  const updatePostDate = useCallback((postId: string, newDate: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, date: newDate } : p)));
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const addAnalyst = useCallback((name: string) => {
    setExtraAnalysts((prev) => prev.includes(name) ? prev : [...prev, name]);
  }, []);

  const removeAnalyst = useCallback((name: string) => {
    setExtraAnalysts((prev) => prev.filter((a) => a !== name));
  }, []);

  return (
    <PostsContext.Provider value={{ posts, clients, analysts, addPost, addPosts, updatePostDate, deletePost, addAnalyst, removeAnalyst }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}