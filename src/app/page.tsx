import { Suspense } from "react";
import { Feed } from "@/components/Feed";
import { Hero } from "@/components/Hero";
import { PostCardSkeleton } from "@/components/PostCard";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense
        fallback={
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <Feed />
      </Suspense>
    </>
  );
}
