import { H2_DOC, H3_DOC } from '@/design/system';

export const CompressImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Compress Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Image compression reduces transfer size. Use a quality setting or a lossless format appropriate for the image, then compare the result at its
      intended display size.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Lossless compression preserves every pixel. Lossy compression trades some detail for a smaller file. Compare the two on representative photos,
      screenshots, and illustrations before setting a quality target.
    </p>

    <h3 className={H3_DOC}>Supported Formats</h3>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      JPEG, PNG, WebP, GIF, BMP, TIFF, and SVG inputs are accepted. The compressed output is always JPEG, which offers the best size-to-quality ratio
      for photographs and complex images.
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
      Uploading full-resolution photos straight from a camera or phone wastes bandwidth and slows page loads. Social media platforms, CMS systems, and
      ad networks each have specific dimension requirements.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Set a target width and height, or resize by a percentage. Preserve the aspect ratio to avoid distortion and use a resampling filter such as
      Lanczos when reducing a photo.
    </p>

    <h3 className={H3_DOC}>Recommended Sizes</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        <strong>Social media posts:</strong> 1200 × 630 px (Facebook / LinkedIn), 1080 × 1080 px (Instagram).
      </li>
      <li>
        <strong>Blog thumbnails:</strong> 800 × 450 px is a popular widescreen ratio.
      </li>
      <li>
        <strong>E-commerce products:</strong> 1000 × 1000 px square for consistent grid layouts.
      </li>
      <li>
        <strong>Email banners:</strong> 600 × 200 px fits most email clients.
      </li>
    </ul>
  </div>
);

export const CropImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Crop Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Cropping removes unwanted edges or backgrounds and focuses the viewer on the subject. Whether you need a square avatar, a widescreen banner, or
      a precise product shot, cropping is the fastest way to reframe an image without any design software.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Choose a crop rectangle in the source image’s pixel coordinates. To match a fixed aspect ratio, constrain the rectangle before extracting the
      region.
    </p>

    <h3 className={H3_DOC}>Common Crop Ratios</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        <strong>1 : 1</strong> — profile pictures, app icons, Instagram posts.
      </li>
      <li>
        <strong>16 : 9</strong> — YouTube thumbnails, desktop wallpapers, presentations.
      </li>
      <li>
        <strong>4 : 3</strong> — classic photo prints, tablet screens.
      </li>
      <li>
        <strong>3 : 2</strong> — DSLR photo aspect ratio, landscape prints.
      </li>
    </ul>
  </div>
);

export const ConvertImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Image Formats?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Different platforms and use cases require different image formats. WebP offers superior compression for the web, PNG is the go-to for
      transparent graphics, and JPEG is universally supported.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Decode the source and encode the pixels in the target format. Check the output for transparency, animation, colour profile, and metadata
      support.
    </p>

    <h3 className={H3_DOC}>When to Use Each Format</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        <strong>JPG</strong> — photographs and complex images where small file size matters.
      </li>
      <li>
        <strong>PNG</strong> — graphics with transparency, logos, screenshots, and icons.
      </li>
      <li>
        <strong>WebP</strong> — modern websites that want the best compression-to-quality ratio.
      </li>
      <li>
        <strong>GIF</strong> — simple animations and low-colour graphics.
      </li>
      <li>
        <strong>TIFF</strong> — high-quality images for print and professional workflows.
      </li>
      <li>
        <strong>AVIF</strong> — next-generation format with the best compression-to-quality ratio.
      </li>
    </ul>
  </div>
);

export const WatermarkImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Watermark Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Watermarking protects your intellectual property and establishes brand identity. Whether you are a photographer, designer, or content creator,
      adding a visible watermark discourages unauthorised use while still showcasing your work.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Composite text or a logo over the original image. Adjust placement and opacity for legibility, and tile the mark if it needs to cover a wider
      area.
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
      Photos taken in portrait mode, scanned documents, and screenshots sometimes end up with the wrong orientation. EXIF rotation tags are not always
      respected by every platform, leaving images sideways or upside-down.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Apply the orientation from EXIF metadata first, then rotate or flip the pixels as needed. Clear or update the orientation tag so viewers do not
      apply the same rotation again.
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
      Base64-encoded images let you embed pictures directly inside HTML, CSS, or JSON without a separate file request — useful for small icons, email
      templates, and inline CSS backgrounds where an extra network round-trip isn&apos;t worth it.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      In JavaScript, FileReader.readAsDataURL returns a data URL with the MIME type and Base64-encoded bytes. Use the data URL as an image source, or
      decode its Base64 portion to recover the original bytes.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        Embedding small icons or logos directly in CSS <code>background-image</code> rules.
      </li>
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
      Mirroring an image horizontally or vertically is useful for correcting scans, creating symmetrical design elements, or fixing photos captured
      with a front-facing camera (which often mirror the scene).
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Translate an HTML canvas origin to the opposite edge before scaling the context by −1 on one axis. Draw the source into the transformed context
      and choose a lossless output format if needed.
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
      A colour picker samples the colour at a pixel. Check whether the source uses an embedded colour profile and whether a transparent pixel will be
      composited over a background.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Read the red, green, blue, and alpha channels at the desired pixel. To build a palette, sample several representative areas or group similar
      pixels.
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
      JPEG photos often embed EXIF metadata — camera make and model, exposure settings, and sometimes precise GPS location — directly in the file.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Read the EXIF tags in the image file and interpret them using the camera’s metadata. Check for GPS coordinates and device identifiers before
      sharing the original.
    </p>

    <h3 className={H3_DOC}>Privacy Note</h3>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Many messaging apps and social platforms strip EXIF data automatically, so a missing result often just means the metadata was already removed
      before you downloaded the file.
    </p>
  </div>
);

export const FaviconGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Generate a Favicon Set?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Browsers and device home screens can use different icon sizes and formats. Start with a square source image and create appropriately sized
      assets for the platforms your site supports.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Export a favicon for browser tabs and touch icons for devices that need them. Declare the icon paths and sizes in the page head or web app
      manifest.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Setting up favicons for a new website or web app from scratch.</li>
      <li>Replacing an outdated single-size favicon with a modern, complete icon set.</li>
      <li>Generating the correct Apple touch icon for an iOS home-screen bookmark.</li>
    </ul>
  </div>
);
