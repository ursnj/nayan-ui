interface Props {
  data: Record<string, any> | Record<string, any>[];
}

const JsonLd = ({ data }: Props) => {
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  );
};

export default JsonLd;
