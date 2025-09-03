# Video Transformations with Clean URLs

This guide shows how video transformations work after implementing URL cleaning. **The URL cleaning only removes the `?updatedAt` parameter and does NOT affect video transformations.**

## What Gets Cleaned vs What Gets Preserved

### ❌ What Gets Removed (Cache-busting only)
```javascript
// BEFORE: 
'https://ik.imagekit.io/devVishnu/sanity-uploads/video.mp4?updatedAt=1756129696020'

// AFTER:
'https://ik.imagekit.io/devVishnu/sanity-uploads/video.mp4'
```

### ✅ What Gets Preserved (All transformations)
```javascript
// Transformation URLs are preserved completely:
'https://ik.imagekit.io/devVishnu/tr:w-400,h-300,q-80/sanity-uploads/video.mp4'
'https://ik.imagekit.io/devVishnu/tr:so-30,eo-60/sanity-uploads/video.mp4'
'https://ik.imagekit.io/devVishnu/tr:f-webm,q-90/sanity-uploads/video.mp4'
```

## How to Use Video Transformations

### 1. Import the utilities in your frontend

```typescript
import {
  getTransformedVideoUrl,
  getVideoThumbnailUrl,
  getCroppedVideoUrl,
  getTrimmedVideoUrl
} from 'sanity-plugin-imagekit-plugin'
```

### 2. Basic Video Transformations

```typescript
// Get video with specific quality and size
const videoUrl = getTransformedVideoUrl(client, secrets, fileId, {
  width: 1280,
  height: 720,
  quality: 90,
  format: 'mp4'
})

// Get cropped video
const croppedVideo = getCroppedVideoUrl(client, secrets, fileId, {
  width: 400,
  height: 300,
  quality: 80
})
```

### 3. Video Thumbnails

```typescript
// Get thumbnail at specific time
const thumbnail = getVideoThumbnailUrl(client, secrets, fileId, {
  thumbnailTime: 30, // 30 seconds into video
  width: 400,
  height: 225
})

// Get thumbnail at specific frame
const frameThumb = getTransformedVideoUrl(client, secrets, fileId, {
  frameNumber: 100,
  width: 400,
  format: 'jpg'
})
```

### 4. Video Trimming/Clipping

```typescript
// Trim video from 10 to 20 seconds
const trimmedVideo = getTrimmedVideoUrl(client, secrets, fileId, {
  startTime: 10,
  endTime: 20,
  quality: 85
})

// Get 5-second clip starting at 30 seconds
const clipVideo = getTransformedVideoUrl(client, secrets, fileId, {
  startTime: 30,
  duration: 5,
  quality: 80
})
```

### 5. Advanced Transformations

```typescript
// High quality WebM for modern browsers
const webmVideo = getTransformedVideoUrl(client, secrets, fileId, {
  format: 'webm',
  quality: 95,
  width: 1920,
  height: 1080,
  videoBitrate: 2000, // 2 Mbps
  audioBitrate: 128   // 128 kbps
})

// Mobile-optimized version
const mobileVideo = getTransformedVideoUrl(client, secrets, fileId, {
  width: 480,
  height: 270,
  quality: 60,
  videoBitrate: 500,  // 500 kbps for mobile
  fps: 24             // Lower frame rate
})
```

### 6. Private Videos (Signed URLs)

```typescript
// Private video with transformations
const privateVideo = getTransformedVideoUrl(client, secrets, fileId, {
  width: 800,
  height: 450,
  quality: 85,
  isPrivate: true,
  expireSeconds: 3600 // 1 hour expiry
})
```

## Complete Example in React

```tsx
import React from 'react'
import {useClient} from 'sanity'
import {
  getTransformedVideoUrl,
  getVideoThumbnailUrl,
  getCroppedVideoUrl
} from 'sanity-plugin-imagekit-plugin'

function MyVideoPlayer({asset, secrets}) {
  const client = useClient()
  
  // Different quality versions
  const videoUrls = {
    hd: getTransformedVideoUrl(client, secrets, asset.fileId, {
      width: 1280, height: 720, quality: 90
    }),
    sd: getTransformedVideoUrl(client, secrets, asset.fileId, {
      width: 854, height: 480, quality: 80
    }),
    mobile: getTransformedVideoUrl(client, secrets, asset.fileId, {
      width: 480, height: 270, quality: 70
    })
  }
  
  // Thumbnail for poster
  const poster = getVideoThumbnailUrl(client, secrets, asset.fileId, {
    thumbnailTime: asset.thumbTime || 0,
    width: 1280,
    height: 720
  })
  
  return (
    <video controls poster={poster}>
      <source src={videoUrls.hd} type="video/mp4" media="(min-width: 1024px)" />
      <source src={videoUrls.sd} type="video/mp4" media="(min-width: 768px)" />
      <source src={videoUrls.mobile} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}
```

## Key Points

1. **URL cleaning only removes `?updatedAt`** - all transformations are preserved
2. **All ImageKit transformation features work** - quality, cropping, trimming, format conversion
3. **Signed URLs work correctly** for private videos
4. **Performance is improved** by removing unnecessary cache-busting parameters
5. **URLs are cleaner** and more predictable for debugging

## Migration Guide

If you have existing video URLs with `?updatedAt`, you can clean them using the Studio tool:

1. Go to the ImageKit Videos tool in your Studio
2. Click "Clean URLs" button
3. This will update all existing assets to remove the `?updatedAt` parameter

Or programmatically:

```typescript
import {cleanExistingVideoAssetUrls} from './actions/cleanExistingUrls'

const result = await cleanExistingVideoAssetUrls(client)
console.log(`Cleaned ${result.cleaned} out of ${result.total} assets`)
```
