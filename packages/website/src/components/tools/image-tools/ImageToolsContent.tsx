import { NView, NText } from 'nayan-ui/components';
import { H2_DOC, H3_DOC } from '@/design/system';

export const CompressImageContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Compress Images?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Image compression reduces transfer size. Use a quality setting or a lossless format appropriate for the image, then compare the result at its
      intended display size.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Lossless compression preserves every pixel. Lossy compression trades some detail for a smaller file. Compare the two on representative photos,
      screenshots, and illustrations before setting a quality target.
    </NText>

    <NText tag="h3" className={H3_DOC}>Supported Formats</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      JPEG, PNG, WebP, GIF, BMP, TIFF, and SVG inputs are accepted. The compressed output is always JPEG, which offers the best size-to-quality ratio
      for photographs and complex images.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Optimising product images for e-commerce stores.</NView>
      <NView tag="li">Reducing hero and banner image sizes for faster page loads.</NView>
      <NView tag="li">Preparing images for email newsletters with strict size limits.</NView>
      <NView tag="li">Shrinking screenshots and blog images before publishing.</NView>
    </NView>
  </NView>
);

export const ResizeImageContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Resize Images?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Uploading full-resolution photos straight from a camera or phone wastes bandwidth and slows page loads. Social media platforms, CMS systems, and
      ad networks each have specific dimension requirements.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Set a target width and height, or resize by a percentage. Preserve the aspect ratio to avoid distortion and use a resampling filter such as
      Lanczos when reducing a photo.
    </NText>

    <NText tag="h3" className={H3_DOC}>Recommended Sizes</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        <NText tag="strong">Social media posts:</NText> 1200 × 630 px (Facebook / LinkedIn), 1080 × 1080 px (Instagram).
      </NView>
      <NView tag="li">
        <NText tag="strong">Blog thumbnails:</NText> 800 × 450 px is a popular widescreen ratio.
      </NView>
      <NView tag="li">
        <NText tag="strong">E-commerce products:</NText> 1000 × 1000 px square for consistent grid layouts.
      </NView>
      <NView tag="li">
        <NText tag="strong">Email banners:</NText> 600 × 200 px fits most email clients.
      </NView>
    </NView>
  </NView>
);

export const CropImageContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Crop Images?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Cropping removes unwanted edges or backgrounds and focuses the viewer on the subject. Whether you need a square avatar, a widescreen banner, or
      a precise product shot, cropping is the fastest way to reframe an image without any design software.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Choose a crop rectangle in the source image’s pixel coordinates. To match a fixed aspect ratio, constrain the rectangle before extracting the
      region.
    </NText>

    <NText tag="h3" className={H3_DOC}>Common Crop Ratios</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        <NText tag="strong">1 : 1</NText> — profile pictures, app icons, Instagram posts.
      </NView>
      <NView tag="li">
        <NText tag="strong">16 : 9</NText> — YouTube thumbnails, desktop wallpapers, presentations.
      </NView>
      <NView tag="li">
        <NText tag="strong">4 : 3</NText> — classic photo prints, tablet screens.
      </NView>
      <NView tag="li">
        <NText tag="strong">3 : 2</NText> — DSLR photo aspect ratio, landscape prints.
      </NView>
    </NView>
  </NView>
);

export const ConvertImageContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert Image Formats?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Different platforms and use cases require different image formats. WebP offers superior compression for the web, PNG is the go-to for
      transparent graphics, and JPEG is universally supported.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Decode the source and encode the pixels in the target format. Check the output for transparency, animation, colour profile, and metadata
      support.
    </NText>

    <NText tag="h3" className={H3_DOC}>When to Use Each Format</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        <NText tag="strong">JPG</NText> — photographs and complex images where small file size matters.
      </NView>
      <NView tag="li">
        <NText tag="strong">PNG</NText> — graphics with transparency, logos, screenshots, and icons.
      </NView>
      <NView tag="li">
        <NText tag="strong">WebP</NText> — modern websites that want the best compression-to-quality ratio.
      </NView>
      <NView tag="li">
        <NText tag="strong">GIF</NText> — simple animations and low-colour graphics.
      </NView>
      <NView tag="li">
        <NText tag="strong">TIFF</NText> — high-quality images for print and professional workflows.
      </NView>
      <NView tag="li">
        <NText tag="strong">AVIF</NText> — next-generation format with the best compression-to-quality ratio.
      </NView>
    </NView>
  </NView>
);

export const WatermarkImageContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Watermark Images?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Watermarking protects your intellectual property and establishes brand identity. Whether you are a photographer, designer, or content creator,
      adding a visible watermark discourages unauthorised use while still showcasing your work.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Composite text or a logo over the original image. Adjust placement and opacity for legibility, and tile the mark if it needs to cover a wider
      area.
    </NText>

    <NText tag="h3" className={H3_DOC}>Best Practices</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Use 20–40&nbsp;% opacity so the watermark is visible but does not obscure the image.</NView>
      <NView tag="li">Place watermarks on important areas of the image to prevent easy cropping.</NView>
      <NView tag="li">Tile mode is the most difficult to remove and works well for stock photography.</NView>
      <NView tag="li">Match the watermark colour to the image's dominant tones for a professional look.</NView>
    </NView>
  </NView>
);

export const RotateImageContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Rotate &amp; Flip Images?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Photos taken in portrait mode, scanned documents, and screenshots sometimes end up with the wrong orientation. EXIF rotation tags are not always
      respected by every platform, leaving images sideways or upside-down.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Apply the orientation from EXIF metadata first, then rotate or flip the pixels as needed. Clear or update the orientation tag so viewers do not
      apply the same rotation again.
    </NText>

    <NText tag="h3" className={H3_DOC}>Common Scenarios</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Fixing portrait photos that display sideways on social media.</NView>
      <NView tag="li">Flipping scanned documents that were placed upside-down on the scanner.</NView>
      <NView tag="li">Creating mirror-image versions for design symmetry.</NView>
      <NView tag="li">Correcting orientation before uploading to marketplaces or listing sites.</NView>
    </NView>
  </NView>
);

export const ImageToBase64Content = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert Images to Base64?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Base64-encoded images let you embed pictures directly inside HTML, CSS, or JSON without a separate file request — useful for small icons, email
      templates, and inline CSS backgrounds where an extra network round-trip isn&apos;t worth it.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      In JavaScript, FileReader.readAsDataURL returns a data URL with the MIME type and Base64-encoded bytes. Use the data URL as an image source, or
      decode its Base64 portion to recover the original bytes.
    </NText>

    <NText tag="h3" className={H3_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        Embedding small icons or logos directly in CSS <NText tag="code">background-image</NText> rules.
      </NView>
      <NView tag="li">Inlining images in HTML emails, where external image requests are often blocked.</NView>
      <NView tag="li">Storing a small image inside a JSON config or API payload.</NView>
      <NView tag="li">Decoding a base64 image string found in an API response or browser dev tools.</NView>
    </NView>
  </NView>
);

export const FlipImageContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Flip Images?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Mirroring an image horizontally or vertically is useful for correcting scans, creating symmetrical design elements, or fixing photos captured
      with a front-facing camera (which often mirror the scene).
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Translate an HTML canvas origin to the opposite edge before scaling the context by −1 on one axis. Draw the source into the transformed context
      and choose a lossless output format if needed.
    </NText>

    <NText tag="h3" className={H3_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Correcting front-camera selfies that are mirrored by default.</NView>
      <NView tag="li">Creating symmetrical design elements or kaleidoscope-style graphics.</NView>
      <NView tag="li">Fixing scanned documents or photos that were digitised the wrong way round.</NView>
    </NView>
  </NView>
);

export const ImageColorPickerContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use an Image Colour Picker?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      A colour picker samples the colour at a pixel. Check whether the source uses an embedded colour profile and whether a transparent pixel will be
      composited over a background.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Read the red, green, blue, and alpha channels at the desired pixel. To build a palette, sample several representative areas or group similar
      pixels.
    </NText>

    <NText tag="h3" className={H3_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Matching a brand colour from a logo or screenshot for a design system.</NView>
      <NView tag="li">Building a colour palette from a product photo or mood board image.</NView>
      <NView tag="li">Picking an accessible text colour against a background image.</NView>
    </NView>
  </NView>
);

export const ImageExifViewerContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why View Image EXIF Data?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      JPEG photos often embed EXIF metadata — camera make and model, exposure settings, and sometimes precise GPS location — directly in the file.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Read the EXIF tags in the image file and interpret them using the camera’s metadata. Check for GPS coordinates and device identifiers before
      sharing the original.
    </NText>

    <NText tag="h3" className={H3_DOC}>Privacy Note</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Many messaging apps and social platforms strip EXIF data automatically, so a missing result often just means the metadata was already removed
      before you downloaded the file.
    </NText>
  </NView>
);

export const FaviconGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Generate a Favicon Set?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Browsers and device home screens can use different icon sizes and formats. Start with a square source image and create appropriately sized
      assets for the platforms your site supports.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Export a favicon for browser tabs and touch icons for devices that need them. Declare the icon paths and sizes in the page head or web app
      manifest.
    </NText>

    <NText tag="h3" className={H3_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Setting up favicons for a new website or web app from scratch.</NView>
      <NView tag="li">Replacing an outdated single-size favicon with a modern, complete icon set.</NView>
      <NView tag="li">Generating the correct Apple touch icon for an iOS home-screen bookmark.</NView>
    </NView>
  </NView>
);
