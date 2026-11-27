interface Props {
  data: Record<string, unknown> | Record<string, unknown>[];
}

const JsonLd = ({ data }: Props) => {
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      ))}
    </>
  );
};

export default JsonLd;
