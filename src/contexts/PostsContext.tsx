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
}

const PostsContext = createContext<PostsContextType | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("iobee-posts");
    return saved ? JSON.parse(saved) : samplePosts;
  });

  useEffect(() => {
    localStorage.setItem("iobee-posts", JSON.stringify(posts));
  }, [posts]);

  const clients = useMemo(() => getClients(posts), [posts]);
  const analysts = useMemo(() => getAnalysts(posts), [posts]);

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

  return (
    <PostsContext.Provider value={{ posts, clients, analysts, addPost, addPosts, updatePostDate, deletePost }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}