import { Metadata } from "next";
import { getPost } from "@/services/communityService";
import CommunityRoomClient from "./CommunityRoomClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const post = await getPost(id);
    const title = post?.title || "Topluluk";
    const description = post?.text?.substring(0, 160) || "Puaniz topluluk";

    return {
      title: `${title} | Puaniz Topluluk`,
      description,
      openGraph: {
        title: `${title} | Puaniz Topluluk`,
        description,
        images: post?.imageUrl ? [{ url: post.imageUrl }] : [],
        type: "article",
      },
      twitter: {
        card: post?.imageUrl ? "summary_large_image" : "summary",
        title: `${title} | Puaniz`,
        description,
      },
    };
  } catch {
    return {
      title: "Topluluk",
      description: "Puaniz topluluk",
    };
  }
}

export default async function CommunityRoomPage({ params }: PageProps) {
  const { id } = await params;
  return <CommunityRoomClient id={id} />;
}
