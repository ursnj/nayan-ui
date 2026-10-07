"use client";

import { useCallback, useMemo, useState } from "react";
import { Braces, ClipboardCopy, Plus, Trash2 } from "lucide-react";
import { NButton, NCard, NCheck, NInput, NSelect, NTextarea, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

type SchemaType = "FAQPage" | "Article" | "Product" | "LocalBusiness" | "BreadcrumbList";

const TYPE_OPTIONS: ReactSelectOption[] = [
  { label: "FAQ Page", value: "FAQPage" },
  { label: "Article", value: "Article" },
  { label: "Product", value: "Product" },
  { label: "Local Business", value: "LocalBusiness" },
  { label: "Breadcrumb List", value: "BreadcrumbList" },
];

interface QA {
  question: string;
  answer: string;
}
interface Crumb {
  name: string;
  url: string;
}

const emptyQA = (): QA => ({ question: "", answer: "" });
const emptyCrumb = (): Crumb => ({ name: "", url: "" });

const SchemaMarkupGenerator = () => {
  const [type, setType] = useState<ReactSelectOption>(TYPE_OPTIONS[0]);
  const [wrapScriptTag, setWrapScriptTag] = useState(true);

  // FAQPage
  const [faqItems, setFaqItems] = useState<QA[]>([emptyQA(), emptyQA()]);

  // Article
  const [headline, setHeadline] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [datePublished, setDatePublished] = useState("");
  const [articleImage, setArticleImage] = useState("");

  // Product
  const [productName, setProductName] = useState("");
  const [productImage, setProductImage] = useState("");
  const [price, setPrice] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("USD");
  const [ratingValue, setRatingValue] = useState("");
  const [reviewCount, setReviewCount] = useState("");

  // LocalBusiness
  const [businessName, setBusinessName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [addressLocality, setAddressLocality] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [telephone, setTelephone] = useState("");

  // BreadcrumbList
  const [crumbs, setCrumbs] = useState<Crumb[]>([emptyCrumb(), emptyCrumb()]);

  const schemaType = type.value as SchemaType;

  const jsonLd = useMemo(() => {
    const base: Record<string, unknown> = { "@context": "https://schema.org", "@type": schemaType };

    if (schemaType === "FAQPage") {
      const mainEntity = faqItems
        .filter((qa) => qa.question.trim() && qa.answer.trim())
        .map((qa) => ({
          "@type": "Question",
          name: qa.question.trim(),
          acceptedAnswer: { "@type": "Answer", text: qa.answer.trim() },
        }));
      return { ...base, mainEntity };
    }

    if (schemaType === "Article") {
      const obj: Record<string, unknown> = {};
      if (headline) obj.headline = headline;
      if (authorName) obj.author = { "@type": "Person", name: authorName };
      if (datePublished) obj.datePublished = datePublished;
      if (articleImage) obj.image = articleImage;
      return { ...base, ...obj };
    }

    if (schemaType === "Product") {
      const obj: Record<string, unknown> = {};
      if (productName) obj.name = productName;
      if (productImage) obj.image = productImage;
      if (price || priceCurrency) {
        obj.offers = {
          "@type": "Offer",
          price: price || undefined,
          priceCurrency: priceCurrency || undefined,
          availability: "https://schema.org/InStock",
        };
      }
      if (ratingValue && reviewCount) {
        obj.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue,
          reviewCount,
        };
      }
      return { ...base, ...obj };
    }

    if (schemaType === "LocalBusiness") {
      const obj: Record<string, unknown> = {};
      if (businessName) obj.name = businessName;
      const hasAddress = streetAddress || addressLocality || addressRegion || postalCode || addressCountry;
      if (hasAddress) {
        obj.address = {
          "@type": "PostalAddress",
          streetAddress: streetAddress || undefined,
          addressLocality: addressLocality || undefined,
          addressRegion: addressRegion || undefined,
          postalCode: postalCode || undefined,
          addressCountry: addressCountry || undefined,
        };
      }
      if (telephone) obj.telephone = telephone;
      return { ...base, ...obj };
    }

    // BreadcrumbList
    const itemListElement = crumbs
      .filter((c) => c.name.trim())
      .map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name.trim(),
        item: c.url.trim() || undefined,
      }));
    return { ...base, itemListElement };
  }, [
    schemaType,
    faqItems,
    headline,
    authorName,
    datePublished,
    articleImage,
    productName,
    productImage,
    price,
    priceCurrency,
    ratingValue,
    reviewCount,
    businessName,
    streetAddress,
    addressLocality,
    addressRegion,
    postalCode,
    addressCountry,
    telephone,
    crumbs,
  ]);

  const output = useMemo(() => {
    const pretty = JSON.stringify(jsonLd, null, 2);
    return wrapScriptTag
      ? `<script type="application/ld+json">\n${pretty}\n</script>`
      : pretty;
  }, [jsonLd, wrapScriptTag]);

  const copy = useCallback(() => {
    navigator.clipboard
      .writeText(output)
      .then(() => showToast("Schema markup copied to clipboard"))
      .catch(() => showToast("Failed to copy to clipboard"));
  }, [output]);

  return (
    <div>
      <NCard className="mb-6 space-y-4 p-4">
        <NSelect
          label="Schema Type"
          className="max-w-xs"
          value={type}
          options={TYPE_OPTIONS}
          onChange={(v) => { if (v) setType(v); }}
          isSearchable={false}
        />

        {schemaType === "FAQPage" && (
          <div className="space-y-3">
            {faqItems.map((qa, i) => (
              <NCard key={i} className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Question {i + 1}</span>
                  {faqItems.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove question ${i + 1}`}
                      onClick={() => setFaqItems((items) => items.filter((_, idx) => idx !== i))}
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <NInput
                  className="mb-0"
                  value={qa.question}
                  onChange={(e) =>
                    setFaqItems((items) =>
                      items.map((item, idx) => (idx === i ? { ...item, question: e.target.value } : item)),
                    )
                  }
                  placeholder="What is your return policy?"
                />
                <NTextarea
                  className="mb-0"
                  value={qa.answer}
                  onChange={(e) =>
                    setFaqItems((items) =>
                      items.map((item, idx) => (idx === i ? { ...item, answer: e.target.value } : item)),
                    )
                  }
                  placeholder="We accept returns within 30 days of purchase."
                  textareaClassName="h-[60px] resize-none text-sm"
                />
              </NCard>
            ))}
            <NButton isOutline onClick={() => setFaqItems((items) => [...items, emptyQA()])}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </NButton>
          </div>
        )}

        {schemaType === "Article" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NInput label="Headline" className="mb-0" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="10 Tips for Better SEO" />
            <NInput label="Author Name" className="mb-0" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Jane Doe" />
            <NInput label="Date Published" className="mb-0" value={datePublished} onChange={(e) => setDatePublished(e.target.value)} placeholder="2024-01-15" />
            <NInput label="Image URL" className="mb-0" value={articleImage} onChange={(e) => setArticleImage(e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>
        )}

        {schemaType === "Product" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NInput label="Product Name" className="mb-0" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Wireless Headphones" />
            <NInput label="Image URL" className="mb-0" value={productImage} onChange={(e) => setProductImage(e.target.value)} placeholder="https://example.com/product.jpg" />
            <NInput label="Price" className="mb-0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="99.99" />
            <NInput label="Currency" className="mb-0" value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value)} placeholder="USD" />
            <NInput label="Rating Value (optional)" className="mb-0" value={ratingValue} onChange={(e) => setRatingValue(e.target.value)} placeholder="4.5" />
            <NInput label="Review Count (optional)" className="mb-0" value={reviewCount} onChange={(e) => setReviewCount(e.target.value)} placeholder="120" />
          </div>
        )}

        {schemaType === "LocalBusiness" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NInput label="Business Name" className="mb-0" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Joe's Pizza" />
            <NInput label="Telephone" className="mb-0" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+1-555-123-4567" />
            <NInput label="Street Address" className="mb-0" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="123 Main St" />
            <NInput label="City" className="mb-0" value={addressLocality} onChange={(e) => setAddressLocality(e.target.value)} placeholder="Springfield" />
            <NInput label="State/Region" className="mb-0" value={addressRegion} onChange={(e) => setAddressRegion(e.target.value)} placeholder="IL" />
            <NInput label="Postal Code" className="mb-0" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="62701" />
            <NInput label="Country" className="mb-0" value={addressCountry} onChange={(e) => setAddressCountry(e.target.value)} placeholder="US" />
          </div>
        )}

        {schemaType === "BreadcrumbList" && (
          <div className="space-y-3">
            {crumbs.map((c, i) => (
              <div key={i} className="flex items-end gap-2">
                <NInput
                  label={`Name ${i + 1}`}
                  className="mb-0 flex-1"
                  value={c.name}
                  onChange={(e) =>
                    setCrumbs((items) => items.map((item, idx) => (idx === i ? { ...item, name: e.target.value } : item)))
                  }
                  placeholder="Home"
                />
                <NInput
                  label="URL"
                  className="mb-0 flex-1"
                  value={c.url}
                  onChange={(e) =>
                    setCrumbs((items) => items.map((item, idx) => (idx === i ? { ...item, url: e.target.value } : item)))
                  }
                  placeholder="https://example.com/"
                />
                {crumbs.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove breadcrumb ${i + 1}`}
                    onClick={() => setCrumbs((items) => items.filter((_, idx) => idx !== i))}
                    className="mb-2 text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <NButton isOutline onClick={() => setCrumbs((items) => [...items, emptyCrumb()])}>
              <Plus className="mr-2 h-4 w-4" />
              Add Breadcrumb
            </NButton>
          </div>
        )}

        <NCheck label="Wrap in <script> tag" checked={wrapScriptTag} onChange={setWrapScriptTag} />
      </NCard>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={copy}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy Markup
        </NButton>
      </div>

      <NCard className="p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <Braces className="h-4 w-4 text-muted" />
          <label className="block text-sm font-medium">Generated JSON-LD</label>
        </div>
        <pre className="max-h-[400px] overflow-auto rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
          {output}
        </pre>
      </NCard>
    </div>
  );
};

export default SchemaMarkupGenerator;
