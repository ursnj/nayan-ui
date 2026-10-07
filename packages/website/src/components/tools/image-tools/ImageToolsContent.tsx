import { H2_DOC, H3_DOC } from "@/design/system";

export const CompressImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Compress Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Large image files slow down your website, hurt SEO rankings, and increase bandwidth costs.
      Google&apos;s Core Web Vitals penalise pages with unoptimised images, making compression
      essential for any site that wants to rank well. Our free online image compressor reduces file
      size by up to 80&nbsp;% while preserving visual quality, powered by the Sharp image
      processing library on the server for maximum compression efficiency.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Batch processing</strong> — compress multiple JPG, PNG, WebP, and GIF files at once.</li>
      <li><strong>Adjustable quality slider</strong> — fine-tune the balance between size and clarity.</li>
      <li><strong>Server-side processing</strong> — images are processed using Sharp, a high-performance Node.js image library, for superior compression.</li>
      <li><strong>Instant preview</strong> — see original vs compressed size and savings percentage before downloading.</li>
      <li><strong>Drag &amp; drop</strong> — drop files straight onto the upload area for a faster workflow.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Each image is sent to the server where Sharp re-encodes it as a JPEG at the quality level
      you choose. Sharp uses optimised native codecs (libjpeg-turbo, libpng, libwebp) for better
      compression than browser-based methods. Lower quality values produce smaller files with
      slightly more compression artefacts, while higher values keep more detail.
    </p>

    <h3 className={H3_DOC}>Supported Formats</h3>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      JPEG, PNG, WebP, GIF, BMP, TIFF, and SVG inputs are accepted. The compressed output is always
      JPEG, which offers the best size-to-quality ratio for photographs and complex images.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Optimising product images for e-commerce stores.</li>
      <li>Reducing hero and banner image sizes for faster page loads.</li>
      <li>Preparing images for email newsletters with strict size limits.</li>
      <li>Shrinking screenshots and blog images before publishing.</li>
    </ul>
  </div>
);

export const ResizeImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Resize Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Uploading full-resolution photos straight from a camera or phone wastes bandwidth and slows
      page loads. Social media platforms, CMS systems, and ad networks each have specific dimension
      requirements. Our free online image resizer lets you set exact pixel dimensions or scale by
      percentage — powered by Sharp for high-quality Lanczos resampling.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Resize by pixels or percentage</strong> — enter exact width and height, or scale proportionally.</li>
      <li><strong>Maintain aspect ratio</strong> — lock the ratio so images never look stretched or squished.</li>
      <li><strong>Batch resize</strong> — process multiple images at once with the same settings.</li>
      <li><strong>Lanczos resampling</strong> — Sharp uses Lanczos3 interpolation for sharper, artifact-free results.</li>
      <li><strong>Instant download</strong> — grab resized images as PNG files immediately.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Each image is sent to the server where Sharp resizes it to your target dimensions using
      Lanczos3 resampling — the gold standard for downscaling. When &ldquo;Keep ratio&rdquo; is
      enabled, only the width is used and the height is calculated automatically from the original
      aspect ratio. The result is returned as a downloadable PNG.
    </p>

    <h3 className={H3_DOC}>Recommended Sizes</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Social media posts:</strong> 1200 × 630 px (Facebook / LinkedIn), 1080 × 1080 px (Instagram).</li>
      <li><strong>Blog thumbnails:</strong> 800 × 450 px is a popular widescreen ratio.</li>
      <li><strong>E-commerce products:</strong> 1000 × 1000 px square for consistent grid layouts.</li>
      <li><strong>Email banners:</strong> 600 × 200 px fits most email clients.</li>
    </ul>
  </div>
);

export const CropImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Crop Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Cropping removes unwanted edges or backgrounds and focuses the viewer on the subject.
      Whether you need a square avatar, a widescreen banner, or a precise product shot, cropping is
      the fastest way to reframe an image without any design software. Our tool requires no
      installs and no accounts — just upload, crop, and download.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Pixel-precise controls</strong> — set X, Y, width, and height to the exact pixel.</li>
      <li><strong>Live preview</strong> — see the crop area highlighted in real time on a dimmed overlay.</li>
      <li><strong>Server-side crop</strong> — Sharp extracts the selected region with pixel-perfect precision.</li>
      <li><strong>Instant download</strong> — export the cropped region as a PNG with one click.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      After you load an image, a scaled preview shows your crop area with a semi-transparent
      overlay. Adjust the crop rectangle using pixel-precise controls. When you click
      &ldquo;Crop&rdquo;, Sharp&apos;s extract function crops the selected region on the server
      and returns the result as a downloadable PNG.
    </p>

    <h3 className={H3_DOC}>Common Crop Ratios</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>1 : 1</strong> — profile pictures, app icons, Instagram posts.</li>
      <li><strong>16 : 9</strong> — YouTube thumbnails, desktop wallpapers, presentations.</li>
      <li><strong>4 : 3</strong> — classic photo prints, tablet screens.</li>
      <li><strong>3 : 2</strong> — DSLR photo aspect ratio, landscape prints.</li>
    </ul>
  </div>
);

export const ConvertImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Image Formats?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Different platforms and use cases require different image formats. WebP offers superior
      compression for the web, PNG is the go-to for transparent graphics, and JPEG is universally
      supported. Our converter lets you switch between multiple formats in bulk, powered by
      Sharp for high-fidelity format conversion.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Six formats</strong> — convert between JPG, PNG, WebP, GIF, TIFF, and AVIF.</li>
      <li><strong>Batch conversion</strong> — convert dozens of files at once with one click.</li>
      <li><strong>High quality</strong> — Sharp's native codecs produce superior output at any quality setting.</li>
      <li><strong>Server-side processing</strong> — conversion is handled by Sharp for format-native encoding.</li>
      <li><strong>Instant download</strong> — files are ready to save the moment conversion finishes.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Each source image is sent to the server where Sharp converts it using format-native codecs
      (libjpeg-turbo, libpng, libwebp, libtiff, libheif). This produces higher-quality output
      than browser-based encoding, especially for modern formats like AVIF and TIFF.
    </p>

    <h3 className={H3_DOC}>When to Use Each Format</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>JPG</strong> — photographs and complex images where small file size matters.</li>
      <li><strong>PNG</strong> — graphics with transparency, logos, screenshots, and icons.</li>
      <li><strong>WebP</strong> — modern websites that want the best compression-to-quality ratio.</li>
      <li><strong>GIF</strong> — simple animations and low-colour graphics.</li>
      <li><strong>TIFF</strong> — high-quality images for print and professional workflows.</li>
      <li><strong>AVIF</strong> — next-generation format with the best compression-to-quality ratio.</li>
    </ul>
  </div>
);

export const WatermarkImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Watermark Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Watermarking protects your intellectual property and establishes brand identity. Whether you
      are a photographer, designer, or content creator, adding a visible watermark discourages
      unauthorised use while still showcasing your work. Our tool provides a live preview in the
      browser and uses Sharp on the server for crisp, high-quality watermark rendering.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Custom text</strong> — type any watermark text, from brand names to copyright notices.</li>
      <li><strong>Adjustable font size</strong> — scale from subtle to prominent.</li>
      <li><strong>Opacity control</strong> — dial in transparency from 5&nbsp;% to 100&nbsp;%.</li>
      <li><strong>Colour picker</strong> — match your brand colour or choose white/black for contrast.</li>
      <li><strong>Four positions</strong> — center, bottom-right, bottom-left, or tile across the entire image.</li>
      <li><strong>Live preview</strong> — see the watermark update in real time before downloading.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      A live preview shows your watermark settings in real time. When you download, Sharp composites
      an SVG text overlay onto the image on the server with your chosen font size, colour, and
      opacity. In &ldquo;tile&rdquo; mode, the text is repeated in a grid pattern across the
      full image. The final result is exported as a high-quality PNG.
    </p>

    <h3 className={H3_DOC}>Best Practices</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Use 20–40&nbsp;% opacity so the watermark is visible but does not obscure the image.</li>
      <li>Place watermarks on important areas of the image to prevent easy cropping.</li>
      <li>Tile mode is the most difficult to remove and works well for stock photography.</li>
      <li>Match the watermark colour to the image's dominant tones for a professional look.</li>
    </ul>
  </div>
);

export const RotateImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Rotate &amp; Flip Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Photos taken in portrait mode, scanned documents, and screenshots sometimes end up with the
      wrong orientation. EXIF rotation tags are not always respected by every platform, leaving
      images sideways or upside-down. Our tool lets you rotate by 90° increments and flip
      horizontally or vertically — per image — with server-side processing for lossless results.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Per-image controls</strong> — rotate left, rotate right, flip horizontal, and flip vertical for each file.</li>
      <li><strong>Batch processing</strong> — upload many images, set transforms individually, then apply all at once.</li>
      <li><strong>Live preview</strong> — CSS transforms show the effect instantly before the final render.</li>
      <li><strong>Lossless output</strong> — Sharp rotates and flips at full resolution without recompression artifacts.</li>
      <li><strong>Server-side processing</strong> — Sharp handles rotation natively for pixel-perfect results.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Each image thumbnail shows a live CSS transform so you can preview the rotation and flip in
      real time. When you click &ldquo;Apply all&rdquo;, each image is sent to the server where
      Sharp applies the rotation and flip transforms natively, then returns a downloadable PNG at
      the original resolution.
    </p>

    <h3 className={H3_DOC}>Common Scenarios</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Fixing portrait photos that display sideways on social media.</li>
      <li>Flipping scanned documents that were placed upside-down on the scanner.</li>
      <li>Creating mirror-image versions for design symmetry.</li>
      <li>Correcting orientation before uploading to marketplaces or listing sites.</li>
    </ul>
  </div>
);

export const ImageToBase64Content = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Images to Base64?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Base64-encoded images let you embed pictures directly inside HTML, CSS, or JSON without a
      separate file request — useful for small icons, email templates, and inline CSS backgrounds
      where an extra network round-trip isn&apos;t worth it. Our free online converter runs entirely
      in your browser using the native <code>FileReader</code> API, so nothing is ever uploaded.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Encode</strong> — upload any image and get both the full data URL and the raw base64 string.</li>
      <li><strong>Decode</strong> — paste a base64 string or data URL and preview or download the resulting image.</li>
      <li><strong>Size estimate</strong> — see the decoded byte size before you use the string.</li>
      <li><strong>Copy to clipboard</strong> — grab either the data URL or the raw string with one click.</li>
      <li><strong>Client-side processing</strong> — everything runs in your browser, no file is ever uploaded.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Encoding reads the file with <code>FileReader.readAsDataURL</code>, which produces a
      <code> data:</code> URL containing the image&apos;s MIME type and its base64-encoded bytes.
      Decoding reverses the process: the string is rendered back into an <code>&lt;img&gt;</code>
      element so you can preview and download it.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Embedding small icons or logos directly in CSS <code>background-image</code> rules.</li>
      <li>Inlining images in HTML emails, where external image requests are often blocked.</li>
      <li>Storing a small image inside a JSON config or API payload.</li>
      <li>Decoding a base64 image string found in an API response or browser dev tools.</li>
    </ul>
  </div>
);

export const FlipImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Flip Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Mirroring an image horizontally or vertically is useful for correcting scans, creating
      symmetrical design elements, or fixing photos captured with a front-facing camera (which
      often mirror the scene). This tool flips images instantly in your browser using the Canvas
      API — no upload, no waiting on a server round-trip.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Horizontal and vertical flip</strong> — toggle either or both independently.</li>
      <li><strong>Instant, lossless preview</strong> — rendered live on an HTML canvas.</li>
      <li><strong>Full resolution output</strong> — no recompression artefacts from the flip itself.</li>
      <li><strong>Client-side processing</strong> — your image never leaves your device.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The image is drawn onto an HTML canvas with its context mirrored (<code>ctx.scale(-1, 1)</code>
      for horizontal, <code>ctx.scale(1, -1)</code> for vertical) before the draw call, then exported
      back to an image file — a lossless geometric operation that doesn&apos;t need server-side
      processing to stay sharp.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Correcting front-camera selfies that are mirrored by default.</li>
      <li>Creating symmetrical design elements or kaleidoscope-style graphics.</li>
      <li>Fixing scanned documents or photos that were digitised the wrong way round.</li>
    </ul>
  </div>
);

export const ImageColorPickerContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use an Image Colour Picker?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Designers and developers often need to match a colour from an existing image — a logo, a
      screenshot, or a photo — without opening a full design application. This tool lets you click
      any pixel to read its exact colour, and automatically extracts a dominant colour palette from
      the whole image, entirely on-device.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Pixel-accurate colour picking</strong> — click anywhere on the image to sample its exact colour.</li>
      <li><strong>HEX, RGB, and HSL output</strong> — copy any format with one click.</li>
      <li><strong>Dominant palette extraction</strong> — 5&ndash;8 swatches computed from the image&apos;s actual pixel data.</li>
      <li><strong>Client-side processing</strong> — processed entirely on an HTML canvas in your browser.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The image is drawn onto a canvas so individual pixels can be read with
      <code> getImageData()</code>. Clicking samples the single pixel under your cursor; the palette
      is built by sampling a grid of pixels across the image, bucketing similar colours together, and
      surfacing the most frequent buckets as representative swatches.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Matching a brand colour from a logo or screenshot for a design system.</li>
      <li>Building a colour palette from a product photo or mood board image.</li>
      <li>Picking an accessible text colour against a background image.</li>
    </ul>
  </div>
);

export const ImageExifViewerContent = () => (
  <div>
    <h2 className={H2_DOC}>Why View Image EXIF Data?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      JPEG photos often embed EXIF metadata — camera make and model, exposure settings, and
      sometimes precise GPS location — directly in the file. This tool reads that metadata in your
      browser so you can inspect a photo&apos;s technical details or check what information it might
      be sharing before you post it online.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Camera details</strong> — make, model, exposure time, aperture, ISO, and orientation.</li>
      <li><strong>GPS coordinates</strong> — decoded from the embedded GPS IFD when present.</li>
      <li><strong>Graceful fallback</strong> — a clear &ldquo;no EXIF data&rdquo; message for PNGs or stripped photos.</li>
      <li><strong>Client-side processing</strong> — your photo is parsed locally and never uploaded.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The file is read as raw bytes and scanned for the JPEG APP1 segment containing the EXIF
      signature. From there, the embedded TIFF header and its Image File Directory (IFD) entries are
      parsed directly &mdash; including the GPS sub-IFD, where latitude and longitude are stored as
      degree/minute/second triplets and converted to decimal coordinates.
    </p>

    <h3 className={H3_DOC}>Privacy Note</h3>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Many messaging apps and social platforms strip EXIF data automatically, so a missing result
      often just means the metadata was already removed before you downloaded the file.
    </p>
  </div>
);

export const FaviconGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Generate a Favicon Set?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Modern browsers, iOS home screens, and Android app icons each expect a different favicon
      size. Instead of manually resizing an icon six different ways, upload one source image and
      get every standard size packaged together, powered by Sharp on the server for crisp,
      correctly-cropped output at every resolution.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>All standard sizes</strong> — 16×16, 32×32, 48×48, 180×180 (Apple touch icon), 192×192, and 512×512.</li>
      <li><strong>site.webmanifest included</strong> — pre-filled with your app name and icon references.</li>
      <li><strong>Ready-to-paste HTML</strong> — the exact <code>&lt;link&gt;</code> tags to add to your page&apos;s <code>&lt;head&gt;</code>.</li>
      <li><strong>Server-side resizing</strong> — Sharp produces crisp, correctly-cropped output at every size.</li>
      <li><strong>ZIP download</strong> — every file bundled together, ready to drop into your project.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Your source image is sent to the server once, where Sharp resizes it into each required
      dimension. The resulting PNGs, a generated <code>site.webmanifest</code>, and a text file with
      ready-to-paste <code>&lt;link&gt;</code> markup are bundled into a single ZIP archive.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Setting up favicons for a new website or web app from scratch.</li>
      <li>Replacing an outdated single-size favicon with a modern, complete icon set.</li>
      <li>Generating the correct Apple touch icon for an iOS home-screen bookmark.</li>
    </ul>
  </div>
);

