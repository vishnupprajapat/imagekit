# ImageKit Video Input Sanity Plugin

> This is a **Sanity Studio v3** plugin.

This plugin lets you use [ImageKit.io](https://imagekit.io) video assets in your Sanity studio.

The ImageKit plugin for Sanity allows you to easily upload and preview videos.

Not familiar with Sanity? [Visit www.sanity.io](https://www.sanity.io/)

## Installation

```
npm install sanity-plugin-imagekit-plugin
```

or

```
yarn add sanity-plugin-imagekit-plugin
```

## Quick start

- While in your project folder, run `npm i sanity-plugin-imagekit-plugin`.
  Read more about [using plugins in Sanity here](https://www.sanity.io/docs/plugins).

* Make a schema type that uses the plugin's type `imagekit.video`, for example:

  ```js
  export default {
    title: 'Video blog post',
    name: 'videoBlogPost',
    type: 'document',
    fields: [
      {title: 'Title', name: 'title', type: 'string'},
      {
        title: 'Video file',
        name: 'video',
        type: 'imagekit.video',
      },
    ],
  }
  ```

  - Add the `imageKitPlugin` import to your plugins:

  ```ts
  import {imageKitPlugin} from 'sanity-plugin-imagekit-plugin'
  import {defineConfig} from 'sanity'
  export default defineConfig({
    plugins: [imageKitPlugin()],
  })
  ```

Read more about [schemas in Sanity here](https://www.sanity.io/docs/the-schema).

- Get an API Access Token and enter it into the setup screen
  First time you use the plugin you will be asked to enter your ImageKit credentials.

The ImageKit Video API uses a Public Key, Private Key, and URL Endpoint for authentication.

If you haven't already, generate your API keys in the Developer section of your ImageKit account dashboard, and make sure you have the correct permissions configured.

The token is stored in the dataset as a document of the type `imagekit.apiKey` with the id `secrets.imagekit`.
Having the ID be non-root ensures that only editors are able to see it.

The ImageKit plugin will find its access tokens by fetching this document.

## Fetching file IDs and understanding the data structure

When an ImageKit video is uploaded/chosen in a document via this plugin, it gets stored as a reference to the video document:

```json5
// example document
{
  _type: 'exampleSchemaWithVideo',
  // Example video field
  myVideoField: {
    _type: 'imagekit.video',
    asset: {
      _type: 'reference',
      _weak: true,
      _ref: '4e37284e-cec2-406d-973c-fdf9ab1e5598', // 👈 ID of the document holding the video's ImageKit data
    },
  },
}
```

Before you can display videos in your frontend, you need to follow these references to fetch the asset's file ID, which will be used to create a player. Here's an example GROQ query to expand the video reference in the example data above:

```groq
// Example for fetching data above
*[ _type == "exampleSchemaWithVideo" ] {
  myVideoField {
    asset-> {
      fileId,
      url,
      filename,
    }
  }
}
```

💡 For more information on querying references, refer to the documentation on [Writing GROQ queries for references](https://www.sanity.io/docs/reference-type#96b949753900) or on [Sanity's GraphQL API](https://www.sanity.io/docs/graphql).

For reference, here's an example `imagekit.videoAsset` document:

```json5
{
  _id: '4e37284e-cec2-406d-973c-fdf9ab1e5598',
  _type: 'imagekit.videoAsset',
  fileId: '7ovyI76F92n02H00mWP7lOCZMIU00N4iysDiQDNppX026HY',
  filename: 'imagekit-example-video.mp4',
  status: 'ready',
  url: 'https://ik.imagekit.io/your_id/video.mp4',
  thumbTime: 65.82,
  // Full ImageKit asset data:
  data: {
  data: {
    quality: '80',
    transformation: 'auto',
    max_resolution: '1080p',
    aspect_ratio: '16:9',
    created_at: '1706645034',
    duration: 25.492133,
    status: 'ready',
    width: 1920,
    height: 1080,
    size: 15728640,
    fileType: 'video',
    url: 'https://ik.imagekit.io/your_id/video.mp4',
    // Additional ImageKit asset properties
    fileId: '7ovyI76F92n02H00mWP7lOCZMIU00N4iysDiQDNppX026HY',
    filePath: '/video.mp4',
    name: 'video.mp4',
    videoCodec: 'h264',
    audioCodec: 'aac',
    bitRate: 2500,
    frameRate: 29.97,
  },
}
}
```

## Playing videos in the frontend

We recommend using a standard HTML5 video element or a video player library to display your videos. Here's an example of how you can display an ImageKit video in a React component:

```tsx
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
}
```

💡 You can try these recommendations through the [Codesandbox example](https://codesandbox.io/s/github/yourusername/sanity-plugin-imagekit-plugin/tree/main/example).

## Configuring ImageKit Video uploads

### Signed URLs (private videos)

To enable secure video playback with ImageKit, you can configure signed URLs in the ImageKit Plugin configuration. This feature requires you to set the API keys (as per the [Quick start](#quick-start) section).

📌 **Note**: When the signed URL option is triggered, the plugin will cache authentication tokens in a private document in the dataset. If you encounter upload issues, you can delete the secrets document and try again:

```bash
# Using the Sanity CLI, delete the secrets, then re-open the plugin and configure it again
sanity documents delete secrets.imagekit
```

More information on signed URLs is available in ImageKit's [documentation](https://docs.imagekit.io/features/security/signed-urls).

### Video quality and transformation

You can configure video quality and transformation settings when setting up the plugin. ImageKit provides various options for video optimization:

```js
import {imageKitPlugin} from 'sanity-plugin-imagekit-plugin'

export default defineConfig({
  plugins: [imageKitPlugin({quality: 90, transformation: 'auto'})],
})
```

### Video resolution (max_resolution)

To set the maximum resolution for videos, add `max_resolution: '720p' | '1080p' | '2160p'` to the plugin configuration. Defaults to `1080p`.

```js
import {imageKitPlugin} from 'sanity-plugin-imagekit-plugin'

export default defineConfig({
  plugins: [imageKitPlugin({max_resolution: '2160p'})],
})
```

When uploading new assets, editors can still choose a lower resolution for each video than configured globally. This option controls the maximum resolution processed for the uploaded video.

```js
import {imageKitPlugin} from 'sanity-plugin-imagekit-plugin'

export default defineConfig({
  plugins: [
    imageKitPlugin({
      quality: 90,
      defaultPrivate: false,
    }),
  ],
})
```

You can also define default settings for video uploads:

```js
import {imageKitPlugin} from 'sanity-plugin-imagekit-plugin'

export default defineConfig({
  plugins: [
    imageKitPlugin({
      quality: 80,
      transformation: 'auto',
      defaultPrivate: false,
    }),
  ],
})
```

If your videos need specific processing and you want to include custom configurations by default, you can use the plugin configuration to set up these defaults without requiring user interaction for each upload.

## Contributing

Issues are actively monitored and PRs are welcome. When developing this plugin the easiest setup is:

1. Fork this repo.
1. Create a studio v3 project: `npm create sanity@dev-preview`. Follow the prompts, starting out with the blog template is a good way to go.
1. `cd` into your project directory, run `npm install && npm start` - your sanity studio should be running on http://localhost:3333.
1. `cd` into the `plugins` directory of your project.
1. Fork this repo and clone your fork into the `plugins` directory inside your project `git clone git@github.com:your-fork/sanity-plugin-imagekit-plugin.git`.
1. Open `sanity.json`, go to the `plugins` array and add `imagekit-plugin`.
1. Re-start the sanity studio server with `npm start`.
1. Edit `schemas/post.js` and add follow the plugin documentation to add a `imagekit.video` type field.
1. Your studio should reload, and now when you edit the plugin code it should reload the studio, when you're done creating a branch, put in a PR and a maintainer will review it. Thank you!

### Publishing

You can run the ["CI and Release" workflow](<[https://github.com/yourusername/sanity-plugin-imagekit-plugin/actions/workflows/ci.yml](https://github.com/yourusername/sanity-plugin-imagekit-plugin/actions/workflows/main.yml)>).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

On the [studio-v2](/tree/studio-v2) branch this will result in:

- a new version on the `latest` dist-tag.
- running `yarn add sanity-plugin-imagekit-plugin` or `npm i sanity-plugin-imagekit-plugin` will fetch the new version.
- running `sanity install imagekit-plugin` will fetch the new version.
- studio-v3 users are unaffected.

On the [main](/tree/main) branch this will result in:

- a new prerelease version on the `studio-v3` dist-tag.
- running `yarn add sanity-plugin-imagekit-plugin@studio-v3` or `npm i sanity-plugin-imagekit-plugin@studio-v3` will fetch the new version.
- running `sanity install imagekit-plugin` won't fetch the new version.

After Studio v3 turns stable this behavior will change. The v2 version will then be available on the `studio-v2` dist-tag, and `studio-v3` is upgraded to live on `latest`.

### Develop & test

You can run the example locally by doing the following:

1. run `npm install` and `npm dev` on the root of the repo
2. In the terminal, a command with `yalc` will be shown, that command will allow you to run the version that you have locally directly on the example or on your own app.
3. run `npm install` and `npm dev` on the `/example` directory where the app with the example exists or in your own app
4. the studio and app should auto reload with your changes in the plugin package you have locally

### Release new version

Run ["CI & Release" workflow](https://github.com/yourusername/sanity-plugin-imagekit-plugin/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

## License

MIT-licensed. See LICENSE.
