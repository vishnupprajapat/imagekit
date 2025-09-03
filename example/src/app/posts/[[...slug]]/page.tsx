// ./src/app/page.tsx
import '@/sakura.css'

import {notFound} from 'next/navigation'
import {defineQuery} from 'next-sanity'

import {client} from '@/sanity/client'

import {PostQueryResult} from '../../../../sanity.types'
import ImageKitVideo from './ImageKitVideo'

const postQuery = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
...,
"va": video.asset,
"video": video.asset->{
  url,
  fileId
}
}`)

export default async function PostPage({params}: {params: {slug: string[]}}) {
  const slug = params.slug.join('/')
  const post = await client.fetch<PostQueryResult>(postQuery, {
    slug,
  })
  if (!post?._id) {
    return notFound()
  }

  return (
    <main>
      <h1>{post.title}</h1>
      <ImageKitVideo url={post.video?.url ?? undefined} title={post.title} />
    </main>
  )
}
