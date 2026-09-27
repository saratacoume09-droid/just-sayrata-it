"use client";

import { useState } from "react";

const posts = [
  {
    category: "HOT TAKE",
    icon: "🔥",
    text: "Being friends with your ex isn't always a bad idea.",
    likes: 24,
    comments: 13,
    time: "2h ago",
    avatar: "🌷",
  },
  {
    category: "NEED ADVICE",
    icon: "🫶",
    text: "Should I tell my friend that she hurt my feelings?",
    likes: 31,
    comments: 18,
    time: "4h ago",
    avatar: "🦋",
  },
  {
    category: "DISCUSSION",
    icon: "💬",
    text: "What's something you wish people understood about you?",
    likes: 17,
    comments: 9,
    time: "5h ago",
    avatar: "☁️",
  },
];

export default function Home() {
  const [active, setActive] = useState("For You");

  return (
    <main className="min-h-screen bg-[#fffafd] text-[#242124]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-pink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              just <span className="text-pink-500">SAYrata</span> it.
            </h1>
            <p className="text-xs text-gray-400">
              say it. ask it. discuss it.
            </p>
          </div>

          <button className="rounded-full bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-pink-600">
            + Post anonymously
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-5xl px-5 pb-8 pt-12">
        <div className="rounded-[2rem] bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-8 md:p-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-pink-500">
            your thoughts, your space
          </p>

          <h2 className="max-w-2xl text-4xl font-black leading-tight md:text-6xl">
            Say what you really think.
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
            Share a hot take, ask for advice, or start a conversation —
            completely anonymously.
          </p>

          <button className="mt-7 rounded-full bg-[#242124] px-7 py-3.5 font-bold text-white transition hover:scale-105">
            Start a conversation →
          </button>
        </div>
      </section>

      {/* TABS */}
      <section className="mx-auto max-w-5xl px-5">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {["For You", "🔥 Hot Takes", "🫶 Advice", "💬 Discussions"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  active === tab
                    ? "bg-[#242124] text-white"
                    : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </section>

      {/* POSTS */}
      <section className="mx-auto max-w-3xl space-y-4 px-5 pb-20">
        {posts.map((post, index) => (
          <article
            key={index}
            className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-xl">
                  {post.avatar}
                </div>

                <div>
                  <p className="text-xs font-bold tracking-wide text-pink-500">
                    {post.icon} {post.category}
                  </p>
                  <p className="text-xs text-gray-400">{post.time}</p>
                </div>
              </div>

              <button className="text-gray-300 hover:text-gray-500">•••</button>
            </div>

            <p className="mt-5 text-lg font-semibold leading-7">
              {post.text}
            </p>

            <div className="mt-6 flex items-center gap-5 border-t border-gray-100 pt-4 text-sm text-gray-400">
              <button className="transition hover:text-pink-500">
                ♡ {post.likes}
              </button>

              <button className="transition hover:text-purple-500">
                💬 {post.comments}
              </button>

              <button className="ml-auto text-xs font-semibold hover:text-red-400">
                🚩 Report
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
