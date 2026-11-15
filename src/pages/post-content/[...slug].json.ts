import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

interface PostContentProps {
  post: CollectionEntry<'posts'>;
}

export const getStaticPaths = (async () => {
  const posts = await getCollection('posts');

  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }));
}) satisfies GetStaticPaths;

export const GET = (({ props }) => {
  const { post } = props as PostContentProps;

  return new Response(JSON.stringify({ body: post.body ?? '' }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}) satisfies APIRoute;
