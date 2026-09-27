"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string;
  category: string;
  content: string;
  created_at: string;
  likes?: number;
  status?: string;
};

type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
};

const categories = [
  { name: "For You", emoji: "✨", value: "ALL" },
  { name: "Hot Takes", emoji: "🔥", value: "HOT TAKE" },
  { name: "Advice", emoji: "🫶", value: "NEED ADVICE" },
  { name: "Discussions", emoji: "💬", value: "DISCUSSION" },
];

const blockedWords = [
  "kill yourself",
  "kys",
  "nudes",
  "send nudes",
];

function getBrowserId() {
  const key = "sayrata_browser_id";

  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function containsBlockedContent(text: string) {
  const lower = text.toLowerCase();

  return blockedWords.some((word) => lower.includes(word));
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [active, setActive] = useState("For You");

  const [showPostForm, setShowPostForm] = useState(false);
  const [category, setCategory] = useState("HOT TAKE");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const [reportPost, setReportPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const [message, setMessage] = useState("");

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading posts:", error);
      return;
    }

    setPosts(data || []);

    const counts: Record<string, number> = {};

    for (const post of data || []) {
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      counts[post.id] = count || 0;
    }

    setLikeCounts(counts);
  }

  useEffect(() => {
    loadPosts();

    const storedLikes = localStorage.getItem("sayrata_liked_posts");

    if (storedLikes) {
      setLikedPosts(JSON.parse(storedLikes));
    }
  }, []);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    const activeCategory =
      categories.find((item) => item.name === active)?.value || "ALL";

    if (activeCategory !== "ALL") {
      result = result.filter(
        (post) => post.category === activeCategory
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((post) =>
        post.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [posts, active, search]);

  async function createPost() {
    const trimmed = content.trim();

    if (!trimmed) {
      setMessage("Write something first 💗");
      return;
    }

    if (trimmed.length > 1000) {
      setMessage("Your post is too long. Keep it under 1000 characters.");
      return;
    }

    if (containsBlockedContent(trimmed)) {
      setMessage(
        "This post contains content that isn't allowed on Just SAYrata It."
      );
      return;
    }

    setPosting(true);
    setMessage("");

    const { error } = await supabase.from("posts").insert({
      category,
      content: trimmed,
      status: "published",
    });

    if (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
      setPosting(false);
      return;
    }

    setContent("");
    setCategory("HOT TAKE");
    setShowPostForm(false);
    setPosting(false);

    await loadPosts();
  }

  async function openComments(post: Post) {
    setSelectedPost(post);

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setComments(data || []);
  }

  async function addComment() {
    if (!selectedPost || !commentText.trim()) return;

    const trimmed = commentText.trim();

    if (trimmed.length > 500) {
      setMessage("Keep comments under 500 characters.");
      return;
    }

    if (containsBlockedContent(trimmed)) {
      setMessage("That comment contains content that isn't allowed.");
      return;
    }

    setCommenting(true);

    const { error } = await supabase.from("comments").insert({
      post_id: selectedPost.id,
      content: trimmed,
    });

    if (error) {
      console.error(error);
      setMessage("Couldn't post your comment.");
      setCommenting(false);
      return;
    }

    setCommentText("");
    setCommenting(false);

    await openComments(selectedPost);
  }

  async function toggleLike(post: Post) {
    const browserId = getBrowserId();
    const alreadyLiked = likedPosts.includes(post.id);

    if (alreadyLiked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("voter_id", browserId);

      if (error) {
        console.error(error);
        return;
      }

      const updated = likedPosts.filter((id) => id !== post.id);
      setLikedPosts(updated);

      localStorage.setItem(
        "sayrata_liked_posts",
        JSON.stringify(updated)
      );

      setLikeCounts((current) => ({
        ...current,
        [post.id]: Math.max((current[post.id] || 1) - 1, 0),
      }));

      return;
    }

    const { error } = await supabase.from("post_likes").insert({
      post_id: post.id,
      voter_id: browserId,
    });

    if (error) {
      console.error(error);
      return;
    }

    const updated = [...likedPosts, post.id];

    setLikedPosts(updated);

    localStorage.setItem(
      "sayrata_liked_posts",
      JSON.stringify(updated)
    );

    setLikeCounts((current) => ({
      ...current,
      [post.id]: (current[post.id] || 0) + 1,
    }));
  }

  async function submitReport() {
    if (!reportPost || !reportReason) return;

    setReporting(true);

    const { error } = await supabase.from("reports").insert({
      post_id: reportPost.id,
      reason: reportReason,
    });

    if (error) {
      console.error(error);
      setMessage("Couldn't send the report.");
      setReporting(false);
      return;
    }

    setReportPost(null);
    setReportReason("");
    setReporting(false);

    setMessage("Thanks for reporting. We'll review it. 💗");
  }

  return (
    <main className="min-h-screen bg-[#fffafd] text-[#242124]">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-pink-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">

          <button
            onClick={() => {
              setActive("For You");
              setSearch("");
            }}
            className="text-left"
          >
            <h1 className="text-2xl font-black tracking-tight">
              just <span className="text-pink-500">SAYrata</span> it.
            </h1>

            <p className="text-xs text-gray-400">
              say it. ask it. discuss it.
            </p>
          </button>

          <button
            onClick={() => setShowPostForm(true)}
            className="rounded-full bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-pink-600 hover:scale-105"
          >
            + Post anonymously
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-10">

        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-8 md:p-14">

          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-300/20 blur-2xl" />

          <p className="relative mb-3 text-sm font-bold uppercase tracking-widest text-pink-500">
            your thoughts, your space
          </p>

          <h2 className="relative max-w-2xl text-4xl font-black leading-tight md:text-6xl">
            Say what you really think.
          </h2>

          <p className="relative mt-4 max-w-xl text-base leading-7 text-gray-600">
            Hot takes, honest questions, advice and conversations —
            without putting your name on it.
          </p>

          <button
            onClick={() => setShowPostForm(true)}
            className="relative mt-7 rounded-full bg-[#242124] px-7 py-3.5 font-bold text-white transition hover:scale-105"
          >
            Start a conversation →
          </button>
        </div>
      </section>

      {/* SEARCH */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="relative">

          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔎
          </span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-full border-0 bg-white px-11 py-3.5 text-sm shadow-sm ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
      </section>

      {/* TABS */}
      <section className="mx-auto max-w-6xl px-5 pt-5">

        <div className="flex gap-2 overflow-x-auto pb-4">

          {categories.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActive(tab.name)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                active === tab.name
                  ? "bg-[#242124] text-white shadow-sm"
                  : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:bg-pink-50"
              }`}
            >
              {tab.emoji} {tab.name}
            </button>
          ))}

        </div>
      </section>

      {/* MESSAGE */}
      {message && (
        <div className="mx-auto max-w-3xl px-5">
          <div className="rounded-2xl bg-pink-50 p-4 text-sm font-medium text-pink-700">
            {message}
          </div>
        </div>
      )}

      {/* POSTS */}
      <section className="mx-auto max-w-3xl space-y-4 px-5 pb-20 pt-2">

        {filteredPosts.length === 0 ? (
          <div className="rounded-[1.5rem] bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
            <div className="text-4xl">🌷</div>

            <h3 className="mt-3 text-lg font-black">
              Nothing here yet
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Be the first person to say it.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-xl">
                    🌸
                  </div>

                  <div>

                    <p className="text-xs font-bold tracking-wide text-pink-500">
                      {post.category}
                    </p>

                    <p className="text-xs text-gray-400">
                      {formatDate(post.created_at)}
                    </p>

                  </div>
                </div>

                <button className="text-gray-300 hover:text-gray-500">
                  •••
                </button>

              </div>

              <p className="mt-5 text-lg font-semibold leading-7">
                {post.content}
              </p>

              <div className="mt-6 flex items-center gap-5 border-t border-gray-100 pt-4 text-sm">

                <button
                  onClick={() => toggleLike(post)}
                  className={`transition ${
                    likedPosts.includes(post.id)
                      ? "font-bold text-pink-500"
                      : "text-gray-400 hover:text-pink-500"
                  }`}
                >
                  {likedPosts.includes(post.id) ? "♥" : "♡"}{" "}
                  {likeCounts[post.id] || 0}
                </button>

                <button
                  onClick={() => openComments(post)}
                  className="text-gray-400 transition hover:text-purple-500"
                >
                  💬 Comments
                </button>

                <button
                  onClick={() => setReportPost(post)}
                  className="ml-auto text-xs font-semibold text-gray-400 hover:text-red-400"
                >
                  🚩 Report
                </button>

              </div>

            </article>
          ))
        )}

      </section>

      {/* POST MODAL */}
      {showPostForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-5 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-[2rem] bg-white p-7 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>
                <h3 className="text-2xl font-black">
                  Say it. 💗
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  No name. No profile. Just your thoughts.
                </p>
              </div>

              <button
                onClick={() => setShowPostForm(false)}
                className="text-xl text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>

            </div>

            <div className="mt-6">

              <p className="mb-2 text-sm font-bold">
                Pick a category
              </p>

              <div className="flex flex-wrap gap-2">

                <button
                  onClick={() => setCategory("HOT TAKE")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    category === "HOT TAKE"
                      ? "bg-pink-500 text-white"
                      : "bg-pink-50 text-pink-500"
                  }`}
                >
                  🔥 Hot Take
                </button>

                <button
                  onClick={() => setCategory("NEED ADVICE")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    category === "NEED ADVICE"
                      ? "bg-pink-500 text-white"
                      : "bg-pink-50 text-pink-500"
                  }`}
                >
                  🫶 Advice
                </button>

                <button
                  onClick={() => setCategory("DISCUSSION")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    category === "DISCUSSION"
                      ? "bg-pink-500 text-white"
                      : "bg-pink-50 text-pink-500"
                  }`}
                >
                  💬 Discussion
                </button>

              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              placeholder="What's on your mind?"
              className="mt-5 h-36 w-full resize-none rounded-2xl bg-gray-50 p-4 text-sm outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-pink-300"
            />

            <div className="mt-2 text-right text-xs text-gray-400">
              {content.length}/1000
            </div>

            {message && (
              <p className="mt-2 text-sm text-pink-600">
                {message}
              </p>
            )}

            <button
              onClick={createPost}
              disabled={posting || !content.trim()}
              className="mt-4 w-full rounded-full bg-pink-500 py-3.5 font-bold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? "Posting..." : "Post anonymously 💗"}
            </button>

          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-5 backdrop-blur-sm">

          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-[2rem] bg-white p-7 shadow-2xl">

            <div className="flex items-center justify-between">

              <div>
                <h3 className="text-xl font-black">
                  Comments 💬
                </h3>

                <p className="text-xs text-gray-400">
                  Anonymous conversation
                </p>
              </div>

              <button
                onClick={() => setSelectedPost(null)}
                className="text-xl text-gray-400"
              >
                ✕
              </button>

            </div>

            <div className="mt-5 overflow-y-auto">

              <div className="rounded-2xl bg-pink-50 p-4">

                <p className="text-sm font-semibold">
                  {selectedPost.content}
                </p>

              </div>

              <div className="mt-4 space-y-3">

                {comments.length === 0 ? (
                  <p className="py-5 text-center text-sm text-gray-400">
                    No comments yet. Be the first. 🌸
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl bg-gray-50 p-4"
                    >
                      <div className="flex items-center gap-2">

                        <span className="text-lg">
                          🌷
                        </span>

                        <span className="text-xs font-bold text-pink-500">
                          Anonymous
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-gray-700">
                        {comment.content}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  ))
                )}

              </div>

            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={500}
                placeholder="Add an anonymous comment..."
                className="h-20 w-full resize-none rounded-2xl bg-gray-50 p-3 text-sm outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-pink-300"
              />

              <button
                onClick={addComment}
                disabled={commenting || !commentText.trim()}
                className="mt-2 w-full rounded-full bg-[#242124] py-3 font-bold text-white disabled:opacity-50"
              >
                {commenting ? "Posting..." : "Comment anonymously"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-5 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl">

            <div className="flex items-center justify-between">

              <h3 className="text-xl font-black">
                Report this post 🚩
              </h3>

              <button
                onClick={() => setReportPost(null)}
                className="text-gray-400"
              >
                ✕
              </button>

            </div>

            <p className="mt-2 text-sm text-gray-500">
              What's wrong with this post?
            </p>

            <div className="mt-5 space-y-2">

              {[
                "Bullying or harassment",
                "Hate or discrimination",
                "Personal information",
                "Sexual content",
                "Spam",
                "Other",
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full rounded-xl p-3 text-left text-sm ${
                    reportReason === reason
                      ? "bg-pink-100 font-bold text-pink-600"
                      : "bg-gray-50 text-gray-600 hover:bg-pink-50"
                  }`}
                >
                  {reason}
                </button>
              ))}

            </div>

            <button
              onClick={submitReport}
              disabled={reporting || !reportReason}
              className="mt-5 w-full rounded-full bg-red-400 py-3 font-bold text-white disabled:opacity-50"
            >
              {reporting ? "Sending..." : "Send report"}
            </button>

          </div>
        </div>
      )}

    </main>
  );
}