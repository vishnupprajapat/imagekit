'use client'

export default function ImageKitVideo({url, title}: {url?: string; title?: string}) {
  if (!url) return null

  return (
    <video controls style={{width: '100%', height: 'auto'}}>
      <source src={url} type="video/mp4" />
      {title && <track kind="captions" label={title} />}
      Your browser does not support the video tag.
    </video>
  )
}
