import { getPost } from "@/services/communityService";
import CommunityRoomClient from "./CommunityRoomClient";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const post = await getPost(id);
    const title = post.title || "Soru Odası";
    const description = post.text?.substring(0, 160) || "Puaniz topluluk soru odası";

    return {
      title: `${title} | Puaniz Topluluk`,
      description,
      openGraph: {
        title: `${title} | Puaniz Topluluk`,
        description,
        images: post.imageUrl ? [{ url: post.imageUrl }] : [],
        type: "article",
      },
      twitter: {
        card: post.imageUrl ? "summary_large_image" : "summary",
        title: `${title} | Puaniz`,
        description,
      },
    };
  } catch {
    return {
      title: "Soru Odası",
      description: "Puaniz topluluk soru odası",
    };
  }
}

export default async function CommunityRoomPage({ params }) {
  const { id } = await params;
  return <CommunityRoomClient id={id} />;
}
